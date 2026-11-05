import mongoose from 'mongoose';
import { Flight } from '../models/flight.model.js';
import { memoryStore } from '../utils/memoryStore.js';
import { findAirport } from '../utils/amadeus.js';
import { trackFlightStatus, getLiveRouteFlights } from '../utils/aviationstack.js';

/**
 * Helper to dynamically generate realistic flights for an unseeded city route
 */
const generateDynamicFlights = (originAirport, destAirport, departureDate) => {
  const baseDepTime = departureDate ? new Date(departureDate) : new Date(Date.now() + 86400000 * 2);
  baseDepTime.setHours(9, 30, 0, 0);

  const airlines = [
    { name: 'Emirates', code: 'EK', prefix: 'EK-', basePrice: 480, duration: '6h 30m' },
    { name: 'Qatar Airways', code: 'QR', prefix: 'QR-', basePrice: 460, duration: '6h 15m' },
    { name: 'Singapore Airlines', code: 'SQ', prefix: 'SQ-', basePrice: 510, duration: '5h 45m' },
    { name: 'Biman Bangladesh Airlines', code: 'BG', prefix: 'BG-', basePrice: 380, duration: '5h 30m' },
  ];

  return airlines.map((a, idx) => {
    const dep = new Date(baseDepTime.getTime() + idx * 4 * 3600000);
    const arr = new Date(dep.getTime() + 6 * 3600000);
    return {
      airline: a.name,
      airlineCode: a.code,
      flightNumber: `${a.prefix}${Math.floor(100 + Math.random() * 899)}`,
      origin: {
        code: originAirport.code,
        city: originAirport.city,
        airport: originAirport.airport,
      },
      destination: {
        code: destAirport.code,
        city: destAirport.city,
        airport: destAirport.airport,
      },
      departureTime: dep,
      arrivalTime: arr,
      duration: a.duration,
      stops: idx % 2 === 0 ? 0 : 1,
      stopoverCities: idx % 2 === 0 ? [] : ['Dubai / Doha Transit'],
      cabinClass: 'Economy',
      price: a.basePrice + Math.floor(Math.random() * 60),
      baggage: '2 x 23 kg',
      refundable: idx !== 0,
      seatsAvailable: 15 + Math.floor(Math.random() * 25),
    };
  });
};

/**
 * Search flights by origin (city or code), destination (city or code), cabinClass, stops, price, airline
 */
export const searchFlights = async (req, res, next) => {
  try {
    const {
      origin,
      destination,
      departureDate,
      cabinClass,
      stops,
      maxPrice,
      airline,
      sort,
    } = req.query;
    const isDbConnected = mongoose.connection.readyState === 1;

    const buildRegexOr = (fieldCode, fieldCity, value) => {
      if (!value) return null;
      const clean = value.trim();
      return {
        $or: [
          { [fieldCode]: new RegExp(`^${clean}$`, 'i') },
          { [fieldCity]: new RegExp(clean, 'i') },
        ],
      };
    };

    if (isDbConnected) {
      const filter = {};
      const originMatch = buildRegexOr('origin.code', 'origin.city', origin);
      const destMatch = buildRegexOr('destination.code', 'destination.city', destination);

      if (originMatch && destMatch) {
        filter.$and = [originMatch, destMatch];
      } else if (originMatch) {
        Object.assign(filter, originMatch);
      } else if (destMatch) {
        Object.assign(filter, destMatch);
      }

      if (cabinClass && cabinClass !== 'All') filter.cabinClass = cabinClass;
      if (stops !== undefined && stops !== '' && stops !== 'all') filter.stops = Number(stops);
      if (airline) filter.airline = new RegExp(airline.trim(), 'i');
      if (maxPrice) filter.price = { $lte: Number(maxPrice) };

      let query = Flight.find(filter);
      if (sort === 'price_asc') query = query.sort({ price: 1 });
      else if (sort === 'price_desc') query = query.sort({ price: -1 });
      else if (sort === 'duration') query = query.sort({ duration: 1 });
      else query = query.sort({ price: 1, departureTime: 1 });

      let results = await query.exec();

      // If user searched a specific route and no flights found in DB yet, dynamically generate & save!
      if (results.length === 0 && (origin || destination)) {
        const originAirport = findAirport(origin || 'DAC');
        const destAirport = findAirport(destination || 'DXB');

        // Check if Aviationstack has live route flights
        let dynamicList = [];
        try {
          const liveAviation = await getLiveRouteFlights(originAirport.code, destAirport.code);
          if (liveAviation && liveAviation.length > 0) {
            dynamicList = liveAviation.map((item, idx) => ({
              airline: item.airline?.name || 'Commercial Airline',
              airlineCode: item.airline?.iata || 'CA',
              flightNumber: item.flight?.iata || `${item.airline?.iata || 'FL'}-${100 + idx}`,
              origin: {
                code: item.departure?.iata || originAirport.code,
                city: originAirport.city,
                airport: item.departure?.airport || originAirport.airport,
              },
              destination: {
                code: item.arrival?.iata || destAirport.code,
                city: destAirport.city,
                airport: item.arrival?.airport || destAirport.airport,
              },
              departureTime: item.departure?.scheduled ? new Date(item.departure.scheduled) : new Date(),
              arrivalTime: item.arrival?.scheduled ? new Date(item.arrival.scheduled) : new Date(Date.now() + 5 * 3600000),
              duration: '4h 30m',
              stops: 0,
              stopoverCities: [],
              cabinClass: 'Economy',
              price: 320 + idx * 45,
              baggage: '2 x 23 kg',
              refundable: true,
              seatsAvailable: 20,
            }));
          }
        } catch {
          // Fallback to dynamic generator
        }

        if (dynamicList.length === 0) {
          dynamicList = generateDynamicFlights(originAirport, destAirport, departureDate);
        }

        // Persist newly generated route flights into MongoDB Atlas
        try {
          results = await Flight.insertMany(dynamicList);
        } catch {
          results = dynamicList;
        }
      }

      if (results.length === 0) {
        results = await Flight.find().sort({ price: 1 }).limit(10);
      }

      return res.status(200).json({ success: true, count: results.length, data: results });
    }

    // Memory store fallback
    let list = [...memoryStore.flights];
    if (origin) {
      list = list.filter(
        (f) => f.origin.code.toLowerCase() === origin.toLowerCase()
          || f.origin.city.toLowerCase().includes(origin.toLowerCase()),
      );
    }
    if (destination) {
      list = list.filter(
        (f) => f.destination.code.toLowerCase() === destination.toLowerCase()
          || f.destination.city.toLowerCase().includes(destination.toLowerCase()),
      );
    }
    if (cabinClass && cabinClass !== 'All') list = list.filter((f) => f.cabinClass === cabinClass);
    if (stops !== undefined && stops !== '' && stops !== 'all') list = list.filter((f) => f.stops === Number(stops));
    if (airline) list = list.filter((f) => f.airline.toLowerCase().includes(airline.toLowerCase()));
    if (maxPrice) list = list.filter((f) => f.price <= Number(maxPrice));

    if (list.length === 0 && (origin || destination)) {
      const originAirport = findAirport(origin || 'DAC');
      const destAirport = findAirport(destination || 'DXB');
      const generated = generateDynamicFlights(originAirport, destAirport, departureDate);
      list = generated;
      memoryStore.flights.push(...generated);
    } else if (list.length === 0) {
      list = [...memoryStore.flights];
    }

    if (sort === 'price_desc') list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => a.price - b.price);

    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get popular flight routes
 */
export const getPopularRoutes = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const popularFlights = await Flight.find().sort({ price: 1 }).limit(6);
      return res.status(200).json({ success: true, data: popularFlights });
    }
    const sorted = [...memoryStore.flights].sort((a, b) => a.price - b.price).slice(0, 6);
    return res.status(200).json({ success: true, data: sorted });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get single flight by ID
 */
export const getFlightById = async (req, res, next) => {
  try {
    let flight;
    if (mongoose.connection.readyState === 1) {
      flight = await Flight.findById(req.params.id);
    } else {
      flight = memoryStore.flights.find((f) => f._id.toString() === req.params.id);
    }

    if (!flight) {
      return res.status(404).json({ success: false, message: 'Flight not found.' });
    }

    return res.status(200).json({ success: true, data: flight });
  } catch (error) {
    return next(error);
  }
};

/**
 * Live flight status tracking via Aviationstack
 */
export const getFlightStatus = async (req, res, next) => {
  try {
    const { flight, from, to, origin, destination } = req.query;
    const originCode = (from || origin || '').trim().toUpperCase();
    const destCode = (to || destination || '').trim().toUpperCase();
    const flightNum = (flight || '').trim().toUpperCase();

    if (!flightNum && !originCode && !destCode) {
      return res.status(400).json({
        success: false,
        message: 'Flight number or route (origin and/or destination) is required.',
      });
    }

    const liveFlights = await trackFlightStatus({
      flight: flightNum,
      from: originCode,
      to: destCode,
      limit: 10,
    });

    if (Array.isArray(liveFlights) && liveFlights.length > 0) {
      return res.status(200).json({
        success: true,
        count: liveFlights.length,
        data: liveFlights[0],
        flights: liveFlights,
      });
    }

    // Realistic fallback multi-flight array matching the requested route or flight number
    const depCode = originCode || 'DAC';
    const arrCode = destCode || (depCode === 'DXB' ? 'DAC' : 'DXB');
    const primaryNumber = flightNum || `${depCode === 'DAC' ? 'BG' : 'EK'}${Math.floor(200 + Math.random() * 700)}`;

    let fallbackAirline = 'FlyDubai';
    if (primaryNumber.startsWith('BS')) {
      fallbackAirline = 'US-Bangla Airlines';
    } else if (primaryNumber.startsWith('EK')) {
      fallbackAirline = 'Emirates';
    } else if (primaryNumber.startsWith('BG')) {
      fallbackAirline = 'Biman Bangladesh Airlines';
    }

    const fallbackList = [
      {
        source: 'simulated_fallback',
        flightDate: new Date().toISOString().split('T')[0],
        airline: fallbackAirline,
        airlineIata: primaryNumber.slice(0, 2),
        airlineIcao: '',
        flightNumber: primaryNumber,
        flightIcao: '',
        codeshared: null,
        aircraft: 'Boeing 787-8 Dreamliner',
        aircraftIcao: 'B788',
        aircraftRegistration: 'S2-AJS',
        aircraftIcao24: '76451B',
        status: 'In Flight',
        statusVariant: 'info',
        rawStatus: 'active',
        // Origin ("From")
        origin: depCode,
        originIcao: 'VGHS',
        originCity: depCode === 'DAC' ? 'Dhaka' : depCode,
        originAirport: depCode === 'DAC' ? 'Hazrat Shahjalal Intl (DAC)' : `${depCode} Airport`,
        originTimezone: 'Asia/Dhaka',
        terminal: 'Terminal 2',
        gate: 'Gate 14B',
        departureDelay: 'On Time (0 min)',
        departureDelayMinutes: 0,
        scheduledDep: '08:45 PM',
        scheduledDepFull: '',
        estimatedDep: '08:45 PM',
        actualDep: '08:50 PM',
        depRunway: '08:52 PM',
        // Destination ("Where it is going")
        destination: arrCode,
        destinationIcao: 'OMDB',
        destinationCity: arrCode === 'DXB' ? 'Dubai' : arrCode,
        destinationAirport: arrCode === 'DXB' ? 'Dubai International Airport (DXB)' : `${arrCode} Airport`,
        destinationTimezone: 'Asia/Dubai',
        arrivalTerminal: 'Terminal 3',
        arrivalGate: 'Gate B12',
        belt: 'Belt 04',
        arrivalDelay: 'On Time (0 min)',
        arrivalDelayMinutes: 0,
        scheduledArr: '11:55 PM',
        scheduledArrFull: '',
        estimatedArr: '11:50 PM',
        actualArr: null,
        arrRunway: '11:50 PM',
        // Telemetry
        altitude: '38,000 ft (11,582 m)',
        speed: '860 km/h (464 knots)',
        verticalSpeed: 'Level Cruise (0 m/s)',
        heading: '284° (WNW)',
        latitude: '24.1284°',
        longitude: '67.0821°',
        isGround: false,
        radarUpdated: new Date().toISOString(),
        progressPercent: 70,
      },
      {
        source: 'simulated_fallback',
        flightDate: new Date().toISOString().split('T')[0],
        airline: 'Emirates',
        airlineIata: 'EK',
        airlineIcao: 'UAE',
        flightNumber: 'EK585',
        flightIcao: 'UAE585',
        codeshared: null,
        aircraft: 'Airbus A380-800',
        aircraftIcao: 'A388',
        aircraftRegistration: 'A6-EEO',
        aircraftIcao24: '8960EE',
        status: 'Scheduled',
        statusVariant: 'success',
        rawStatus: 'scheduled',
        origin: depCode,
        originIcao: 'VGHS',
        originCity: depCode === 'DAC' ? 'Dhaka' : depCode,
        originAirport: depCode === 'DAC' ? 'Hazrat Shahjalal Intl (DAC)' : `${depCode} Airport`,
        originTimezone: 'Asia/Dhaka',
        terminal: 'Terminal 1',
        gate: 'Gate 08',
        departureDelay: 'On Time (0 min)',
        departureDelayMinutes: 0,
        scheduledDep: '01:40 AM',
        scheduledDepFull: '',
        estimatedDep: '01:40 AM',
        actualDep: null,
        depRunway: null,
        destination: arrCode,
        destinationIcao: 'OMDB',
        destinationCity: arrCode === 'DXB' ? 'Dubai' : arrCode,
        destinationAirport: arrCode === 'DXB' ? 'Dubai International Airport (DXB)' : `${arrCode} Airport`,
        destinationTimezone: 'Asia/Dubai',
        arrivalTerminal: 'Terminal 3',
        arrivalGate: 'Gate A04',
        belt: 'Belt 07',
        arrivalDelay: 'On Time (0 min)',
        arrivalDelayMinutes: 0,
        scheduledArr: '04:55 AM',
        scheduledArrFull: '',
        estimatedArr: '04:55 AM',
        actualArr: null,
        arrRunway: null,
        altitude: 'Ground',
        speed: '0 km/h',
        verticalSpeed: '0 m/s',
        heading: 'N/A',
        latitude: null,
        longitude: null,
        isGround: true,
        radarUpdated: new Date().toISOString(),
        progressPercent: 0,
      },
      {
        source: 'simulated_fallback',
        flightDate: new Date().toISOString().split('T')[0],
        airline: 'FlyDubai',
        airlineIata: 'FZ',
        airlineIcao: 'FDB',
        flightNumber: 'FZ584',
        flightIcao: 'FDB584',
        codeshared: null,
        aircraft: 'Boeing 737 MAX 8',
        aircraftIcao: 'B38M',
        aircraftRegistration: 'A6-FMD',
        aircraftIcao24: '89643B',
        status: 'Landed',
        statusVariant: 'secondary',
        rawStatus: 'landed',
        origin: depCode,
        originIcao: 'VGHS',
        originCity: depCode === 'DAC' ? 'Dhaka' : depCode,
        originAirport: depCode === 'DAC' ? 'Hazrat Shahjalal Intl (DAC)' : `${depCode} Airport`,
        originTimezone: 'Asia/Dhaka',
        terminal: 'Terminal 1',
        gate: 'Gate 11',
        departureDelay: 'Departed Early (-5 min)',
        departureDelayMinutes: -5,
        scheduledDep: '09:15 AM',
        scheduledDepFull: '',
        estimatedDep: '09:10 AM',
        actualDep: '09:10 AM',
        depRunway: '09:18 AM',
        destination: arrCode,
        destinationIcao: 'OMDB',
        destinationCity: arrCode === 'DXB' ? 'Dubai' : arrCode,
        destinationAirport: arrCode === 'DXB' ? 'Dubai International Airport (DXB)' : `${arrCode} Airport`,
        destinationTimezone: 'Asia/Dubai',
        arrivalTerminal: 'Terminal 2',
        arrivalGate: 'Gate F02',
        belt: 'Belt 03',
        arrivalDelay: 'Arrived Early (-10 min)',
        arrivalDelayMinutes: -10,
        scheduledArr: '12:35 PM',
        scheduledArrFull: '',
        estimatedArr: '12:25 PM',
        actualArr: '12:25 PM',
        arrRunway: '12:20 PM',
        altitude: 'Ground',
        speed: '0 km/h',
        verticalSpeed: '0 m/s',
        heading: 'N/A',
        latitude: null,
        longitude: null,
        isGround: true,
        radarUpdated: new Date().toISOString(),
        progressPercent: 100,
      },
    ];

    return res.status(200).json({
      success: true,
      count: fallbackList.length,
      data: fallbackList[0],
      flights: fallbackList,
    });
  } catch (error) {
    return next(error);
  }
};
