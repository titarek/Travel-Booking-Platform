import mongoose from 'mongoose';
import { Flight } from '../models/flight.model.js';
import { memoryStore } from '../utils/memoryStore.js';
import { findAirport } from '../utils/amadeus.js';
import { trackFlightStatus, getLiveRouteFlights } from '../utils/aviationstack.js';

/**
 * Helper to calculate flight duration from departure & arrival timestamps
 */
const calculateFlightDuration = (depTime, arrTime) => {
  if (depTime && arrTime) {
    const diff = new Date(arrTime) - new Date(depTime);
    if (diff > 0 && !Number.isNaN(diff)) {
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      return `${h}h ${m}m`;
    }
  }
  return '5h 15m';
};

/**
 * Dynamic pricing calculation based on airline tier and cabin class
 */
const calculateDynamicPrice = (airlineName = '', cabinClass = 'Economy', idx = 0) => {
  let basePrice = 340 + ((idx * 47) % 180);
  const lower = (airlineName || '').toLowerCase();
  if (lower.includes('emirates') || lower.includes('singapore')) {
    basePrice += 85;
  } else if (lower.includes('qatar')) {
    basePrice += 65;
  } else if (lower.includes('flydubai') || lower.includes('airasia') || lower.includes('indigo')) {
    basePrice -= 45;
  }

  if (cabinClass === 'Business') {
    return Math.round(basePrice * 2.4);
  }
  if (cabinClass === 'First') {
    return Math.round(basePrice * 4.8);
  }
  return Math.max(140, basePrice);
};

/**
 * Search flights dynamically using live Aviationstack API
 * Full dynamic: if there are no commercial flights between start and destination, returns empty list.
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

    const originTerm = origin ? origin.trim() : '';
    const destTerm = destination ? destination.trim() : '';

    const effOrigin = originTerm || 'DAC';
    const effDest = destTerm || 'DXB';

    const originAirport = findAirport(effOrigin);
    const destAirport = findAirport(effDest);

    const depIata = originAirport?.code || effOrigin.toUpperCase().slice(0, 3);
    const arrIata = destAirport?.code || effDest.toUpperCase().slice(0, 3);

    // Fetch live flights dynamically from Aviationstack API
    const rawFlights = await getLiveRouteFlights(depIata, arrIata);

    // Strict dynamic requirement: If no flights exist from that place to destination, return empty!
    if (!rawFlights || rawFlights.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: `No flights found operating from ${originAirport.city} (${depIata}) to ${destAirport.city} (${arrIata}).`,
      });
    }

    // Map live Aviationstack records into full platform flight models
    let list = rawFlights.map((raw, idx) => {
      const flightNum = raw.flight?.iata
        || (raw.airline?.iata && raw.flight?.number ? `${raw.airline.iata}${raw.flight.number}` : `FL-${100 + idx}`);
      const airlineName = raw.airline?.name || 'Commercial Airline';
      const airlineIata = raw.airline?.iata || flightNum.slice(0, 2);

      const depScheduled = raw.departure?.scheduled;
      const arrScheduled = raw.arrival?.scheduled;
      const duration = calculateFlightDuration(depScheduled, arrScheduled);

      // Align departure date if user selected a specific departure date
      let finalDepDate = depScheduled ? new Date(depScheduled) : new Date();
      let finalArrDate = arrScheduled ? new Date(arrScheduled) : new Date(finalDepDate.getTime() + 4 * 3600000);

      if (departureDate) {
        const targetDate = new Date(departureDate);
        if (!Number.isNaN(targetDate.getTime())) {
          const originalHours = finalDepDate.getUTCHours();
          const originalMinutes = finalDepDate.getUTCMinutes();
          finalDepDate = new Date(Date.UTC(
            targetDate.getUTCFullYear(),
            targetDate.getUTCMonth(),
            targetDate.getUTCDate(),
            originalHours,
            originalMinutes,
            0,
          ));
          const durationMs = arrScheduled && depScheduled
            ? (new Date(arrScheduled) - new Date(depScheduled))
            : (4.5 * 3600000);
          finalArrDate = new Date(finalDepDate.getTime() + Math.max(3600000, durationMs));
        }
      }

      const calculatedPrice = calculateDynamicPrice(airlineName, cabinClass || 'Economy', idx);

      const statusMap = {
        active: 'In Flight',
        scheduled: 'Scheduled',
        landed: 'Landed',
        cancelled: 'Cancelled',
      };
      const flightStatus = statusMap[raw.flight_status?.toLowerCase()] || 'Scheduled';

      return {
        _id: `av_${flightNum.replace(/[^a-zA-Z0-9]/g, '')}_${idx}_${raw.flight_date || 'live'}`,
        airline: airlineName,
        airlineCode: airlineIata,
        flightNumber: flightNum,
        origin: {
          code: raw.departure?.iata || originAirport.code,
          city: originAirport.city || raw.departure?.airport || 'Origin',
          airport: raw.departure?.airport || originAirport.airport,
        },
        destination: {
          code: raw.arrival?.iata || destAirport.code,
          city: destAirport.city || raw.arrival?.airport || 'Destination',
          airport: raw.arrival?.airport || destAirport.airport,
        },
        departureTime: finalDepDate.toISOString(),
        arrivalTime: finalArrDate.toISOString(),
        duration,
        stops: 0,
        stopoverCities: [],
        cabinClass: cabinClass && cabinClass !== 'All' ? cabinClass : 'Economy',
        price: calculatedPrice,
        baggage: '2 x 23 kg',
        refundable: idx % 3 !== 0,
        seatsAvailable: 10 + ((idx * 5) % 20),
        status: flightStatus,
        rawStatus: raw.flight_status || 'scheduled',
      };
    });

    // Apply optional filters
    if (cabinClass && cabinClass !== 'All') {
      list = list.filter((f) => f.cabinClass === cabinClass);
    }
    if (stops !== undefined && stops !== '' && stops !== 'all') {
      list = list.filter((f) => f.stops === Number(stops));
    }
    if (airline) {
      list = list.filter((f) => f.airline.toLowerCase().includes(airline.toLowerCase()));
    }
    if (maxPrice) {
      list = list.filter((f) => f.price <= Number(maxPrice));
    }

    // Apply sorting
    if (sort === 'price_desc') list.sort((a, b) => b.price - a.price);
    else if (sort === 'price_asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'duration') list.sort((a, b) => a.duration.localeCompare(b.duration));

    return res.status(200).json({
      success: true,
      count: list.length,
      data: list,
    });
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
    const { id } = req.params;
    let flight = null;

    if (mongoose.isValidObjectId(id) && mongoose.connection.readyState === 1) {
      flight = await Flight.findById(id);
    }
    if (!flight) {
      flight = memoryStore.flights.find((f) => f._id?.toString() === id);
    }

    if (!flight && id && id.startsWith('av_')) {
      const parts = id.split('_');
      const flightNum = parts[1];
      if (flightNum) {
        const live = await trackFlightStatus(flightNum);
        if (live && live.length > 0) {
          const l = live[0];
          flight = {
            _id: id,
            airline: l.airline,
            airlineCode: l.airlineIata,
            flightNumber: l.flightNumber,
            origin: {
              code: l.origin,
              city: l.originCity,
              airport: l.originAirport,
            },
            destination: {
              code: l.destination,
              city: l.destinationCity,
              airport: l.destinationAirport,
            },
            departureTime: l.scheduledDepFull || new Date().toISOString(),
            arrivalTime: l.scheduledArrFull || new Date().toISOString(),
            duration: '5h 15m',
            stops: 0,
            stopoverCities: [],
            cabinClass: 'Economy',
            price: 420,
            baggage: '2 x 23 kg',
            refundable: true,
            seatsAvailable: 15,
            status: l.status,
          };
        }
      }
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
