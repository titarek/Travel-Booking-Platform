import mongoose from 'mongoose';
import { Hotel } from '../models/hotel.model.js';
import { memoryStore } from '../utils/memoryStore.js';
import { findAirport } from '../utils/amadeus.js';
import { getUnsplashPhoto } from '../utils/unsplash.js';
import {
  geocodeWithGeoapify,
  reverseGeocodeWithGeoapify,
  fetchNearbyHotelsFromGeoapify,
  getCachedGeoHotel,
  autocompleteWithGeoapify,
} from '../utils/geoapify.js';

/**
 * City geo-coordinates directory for accurate real-world locations
 */
const CITY_COORDINATES = {
  dhaka: { lat: 23.8103, lng: 90.4125, country: 'Bangladesh' },
  "cox's bazar": { lat: 21.4272, lng: 92.0058, country: 'Bangladesh' },
  chittagong: { lat: 22.3569, lng: 91.7832, country: 'Bangladesh' },
  sylhet: { lat: 24.8949, lng: 91.8687, country: 'Bangladesh' },
  jashore: { lat: 23.1664, lng: 89.2081, country: 'Bangladesh' },
  rajshahi: { lat: 24.3745, lng: 88.6042, country: 'Bangladesh' },
  dubai: { lat: 25.2048, lng: 55.2708, country: 'United Arab Emirates' },
  'abu dhabi': { lat: 24.4539, lng: 54.3773, country: 'United Arab Emirates' },
  doha: { lat: 25.2854, lng: 51.5310, country: 'Qatar' },
  riyadh: { lat: 24.7136, lng: 46.6753, country: 'Saudi Arabia' },
  jeddah: { lat: 21.4858, lng: 39.1925, country: 'Saudi Arabia' },
  madinah: { lat: 24.5247, lng: 39.5692, country: 'Saudi Arabia' },
  makkah: { lat: 21.3891, lng: 39.8579, country: 'Saudi Arabia' },
  muscat: { lat: 23.5880, lng: 58.3829, country: 'Oman' },
  bangkok: { lat: 13.7563, lng: 100.5018, country: 'Thailand' },
  phuket: { lat: 7.8804, lng: 98.3923, country: 'Thailand' },
  singapore: { lat: 1.3521, lng: 103.8198, country: 'Singapore' },
  'kuala lumpur': { lat: 3.1390, lng: 101.6869, country: 'Malaysia' },
  malé: { lat: 4.1755, lng: 73.5093, country: 'Maldives' },
  male: { lat: 4.1755, lng: 73.5093, country: 'Maldives' },
  bali: { lat: -8.4095, lng: 115.1889, country: 'Indonesia' },
  jakarta: { lat: -6.2088, lng: 106.8456, country: 'Indonesia' },
  colombo: { lat: 6.9271, lng: 79.8612, country: 'Sri Lanka' },
  tokyo: { lat: 35.6762, lng: 139.6503, country: 'Japan' },
  osaka: { lat: 34.6937, lng: 135.5023, country: 'Japan' },
  kyoto: { lat: 35.0116, lng: 135.7681, country: 'Japan' },
  seoul: { lat: 37.5665, lng: 126.9780, country: 'South Korea' },
  'hong kong': { lat: 22.3193, lng: 114.1694, country: 'Hong Kong' },
  london: { lat: 51.5074, lng: -0.1278, country: 'United Kingdom' },
  manchester: { lat: 53.4808, lng: -2.2426, country: 'United Kingdom' },
  paris: { lat: 48.8566, lng: 2.3522, country: 'France' },
  nice: { lat: 43.7102, lng: 7.2620, country: 'France' },
  rome: { lat: 41.9028, lng: 12.4964, country: 'Italy' },
  milan: { lat: 45.4642, lng: 9.1900, country: 'Italy' },
  venice: { lat: 45.4408, lng: 12.3155, country: 'Italy' },
  florence: { lat: 43.7696, lng: 11.2558, country: 'Italy' },
  istanbul: { lat: 41.0082, lng: 28.9784, country: 'Turkey' },
  amsterdam: { lat: 52.3676, lng: 4.9041, country: 'Netherlands' },
  berlin: { lat: 52.5200, lng: 13.4050, country: 'Germany' },
  frankfurt: { lat: 50.1109, lng: 8.6821, country: 'Germany' },
  munich: { lat: 48.1351, lng: 11.5820, country: 'Germany' },
  zurich: { lat: 47.3769, lng: 8.5417, country: 'Switzerland' },
  geneva: { lat: 46.2044, lng: 6.1432, country: 'Switzerland' },
  madrid: { lat: 40.4168, lng: -3.7038, country: 'Spain' },
  barcelona: { lat: 41.3879, lng: 2.1686, country: 'Spain' },
  vienna: { lat: 48.2082, lng: 16.3738, country: 'Austria' },
  athens: { lat: 37.9838, lng: 23.7275, country: 'Greece' },
  'new york': { lat: 40.7128, lng: -74.0060, country: 'United States' },
  'los angeles': { lat: 34.0522, lng: -118.2437, country: 'United States' },
  'san francisco': { lat: 37.7749, lng: -122.4194, country: 'United States' },
  chicago: { lat: 41.8781, lng: -87.6298, country: 'United States' },
  miami: { lat: 25.7617, lng: -80.1918, country: 'United States' },
  toronto: { lat: 43.6532, lng: -79.3832, country: 'Canada' },
  vancouver: { lat: 49.2827, lng: -123.1207, country: 'Canada' },
  sydney: { lat: -33.8688, lng: 151.2093, country: 'Australia' },
  melbourne: { lat: -37.8136, lng: 144.9631, country: 'Australia' },
  cairo: { lat: 30.0444, lng: 31.2357, country: 'Egypt' },
  'cape town': { lat: -33.9249, lng: 18.4241, country: 'South Africa' },
  kathmandu: { lat: 27.7172, lng: 85.3240, country: 'Nepal' },
  delhi: { lat: 28.6139, lng: 77.2090, country: 'India' },
  mumbai: { lat: 19.0760, lng: 72.8777, country: 'India' },
  kolkata: { lat: 22.5726, lng: 88.3639, country: 'India' },
};

const geocodeCache = new Map();

/**
 * Get real coordinates for any city with live geocoding fallback
 */
const getCityGeoCoordinates = async (cityName) => {
  const cleanCity = cityName.trim();
  const lower = cleanCity.toLowerCase();

  if (CITY_COORDINATES[lower]) {
    return CITY_COORDINATES[lower];
  }

  if (geocodeCache.has(lower)) {
    return geocodeCache.get(lower);
  }

  // Lookup in airport directory
  const airportMeta = findAirport(cleanCity);
  const countryName = airportMeta?.country || 'International Destination';

  // Live OpenStreetMap Nominatim geocoder fallback
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanCity)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TravelBookingApp/1.0 (contact@travelbooking.test)' },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const geoResult = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          country: countryName,
        };
        geocodeCache.set(lower, geoResult);
        return geoResult;
      }
    }
  } catch {
    // Continue to default
  }

  // Deterministic fallback based on city name hash if unlisted
  let hash = 0;
  for (let i = 0; i < lower.length; i += 1) {
    hash = (hash * 31 + lower.charCodeAt(i)) % 1000000007;
  }
  const fallbackLat = 20.0 + (Math.abs(hash % 300) / 10);
  const fallbackLng = 30.0 + (Math.abs(Math.floor(hash / 7) % 700) / 10);

  const defaultGeo = {
    lat: fallbackLat,
    lng: fallbackLng,
    country: countryName,
  };
  geocodeCache.set(lower, defaultGeo);
  return defaultGeo;
};

/**
 * Haversine formula: Calculate real distance in km between two geo-coordinates
 */
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const cosLat1 = Math.cos((lat1 * Math.PI) / 180);
  const cosLat2 = Math.cos((lat2 * Math.PI) / 180);
  const a = (sinLat * sinLat) + (cosLat1 * cosLat2 * sinLon * sinLon);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
};

/**
 * Generate nearby hotels situated across realistic surrounding districts
 */
const generateDynamicHotels = async (cityName) => {
  const cleanCity = cityName.trim();
  const matchedGeo = await getCityGeoCoordinates(cleanCity);
  const livePhoto = await getUnsplashPhoto(cleanCity);

  const districts = [
    {
      name: `The Grand Palace & Resort ${cleanCity}`,
      stars: 5,
      score: 4.8,
      price: 185,
      image: livePhoto,
      district: 'Downtown / City Center',
      address: `10 Central Avenue, Downtown ${cleanCity}`,
      offsetLat: 0.003,
      offsetLng: 0.003,
      type: 'Luxury Suite',
    },
    {
      name: `${cleanCity} Royal Bay Boutique Hotel`,
      stars: 4,
      score: 4.6,
      price: 125,
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80',
      district: 'Waterfront / Promenade',
      address: `45 Marina Boulevard, Waterfront ${cleanCity}`,
      offsetLat: -0.008,
      offsetLng: 0.010,
      type: 'Deluxe City View',
    },
    {
      name: `Radisson Blu Executive Suites ${cleanCity}`,
      stars: 5,
      score: 4.7,
      price: 210,
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&auto=format&fit=crop&q=80',
      district: 'Financial District',
      address: `88 Commerce Way, Financial District ${cleanCity}`,
      offsetLat: 0.016,
      offsetLng: -0.012,
      type: 'Executive Club Room',
    },
    {
      name: `Heritage Grand Villa & Spa ${cleanCity}`,
      stars: 4,
      score: 4.5,
      price: 95,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
      district: 'Old Town Heritage Quarter',
      address: `12 Heritage Road, Historic Old Town ${cleanCity}`,
      offsetLat: -0.022,
      offsetLng: -0.018,
      type: 'Classic Garden Villa',
    },
  ];

  return districts.map((t, idx) => {
    const hotelLat = matchedGeo.lat + t.offsetLat;
    const hotelLng = matchedGeo.lng + t.offsetLng;
    const distanceKm = calculateDistanceKm(matchedGeo.lat, matchedGeo.lng, hotelLat, hotelLng);

    return {
      name: t.name,
      city: cleanCity,
      country: matchedGeo.country,
      district: t.district,
      distanceKm,
      address: t.address,
      coordinates: {
        lat: hotelLat,
        lng: hotelLng,
      },
      starRating: t.stars,
      reviewScore: t.score,
      reviewCount: 95 + idx * 24,
      pricePerNight: t.price,
      images: [t.image],
      thumbnail: t.image,
      amenities: ['Free WiFi', 'Breakfast Included', 'Swimming Pool', 'Fitness Center', 'Airport Shuttle'],
      roomTypes: [
        {
          name: t.type,
          bed: '1 King Bed',
          maxGuests: 2,
          price: t.price,
          refundable: true,
          breakfastIncluded: true,
        },
      ],
      description: `Experience premier luxury and world-class hospitality in the heart of ${cleanCity}. Situated in ${t.district}, just ${distanceKm} km from the city center.`,
      freeCancellation: true,
      featured: idx === 0,
    };
  });
};

/**
 * Filter and sort hotels in memory
 */
const filterAndSortHotels = (hotelsList, filters, sort) => {
  let list = [...hotelsList];
  if (filters.minRating) {
    list = list.filter((h) => (h.reviewScore || 0) >= Number(filters.minRating));
  }
  if (filters.maxPrice) {
    list = list.filter((h) => (h.pricePerNight || 0) <= Number(filters.maxPrice));
  }
  if (filters.freeCancellation === 'true') {
    list = list.filter((h) => h.freeCancellation);
  }
  if (filters.featured === 'true') {
    list = list.filter((h) => h.featured);
  }
  if (filters.amenities) {
    const requested = filters.amenities.split(',').map((a) => a.trim().toLowerCase());
    list = list.filter((h) => {
      const hotelAmenities = (h.amenities || []).map((a) => a.toLowerCase());
      return requested.every((r) => hotelAmenities.some((ha) => ha.includes(r)));
    });
  }

  if (sort === 'distance') {
    list.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  } else if (sort === 'price_asc') {
    list.sort((a, b) => (a.pricePerNight || 0) - (b.pricePerNight || 0));
  } else if (sort === 'price_desc') {
    list.sort((a, b) => (b.pricePerNight || 0) - (a.pricePerNight || 0));
  } else {
    list.sort((a, b) => (b.reviewScore || 0) - (a.reviewScore || 0));
  }

  return list;
};

/**
 * Get all hotels with filtering by city, nearby radius, rating, price, amenities
 */
export const getHotels = async (req, res, next) => {
  try {
    const {
      city,
      lat,
      lng,
      minRating,
      maxPrice,
      amenities,
      freeCancellation,
      featured,
      sort,
    } = req.query;

    const filters = {
      minRating,
      maxPrice,
      amenities,
      freeCancellation,
      featured,
    };

    // 1. If explicit GPS coordinates or nearby search requested, query Geoapify Places
    if (lat && lng) {
      const numLat = parseFloat(lat);
      const numLng = parseFloat(lng);
      if (!Number.isNaN(numLat) && !Number.isNaN(numLng)) {
        let detectedCity = city;
        if (!detectedCity || detectedCity.toLowerCase() === 'nearby' || detectedCity.toLowerCase() === 'near me') {
          const rev = await reverseGeocodeWithGeoapify(numLat, numLng);
          detectedCity = rev?.city || 'Local Area';
        }

        const geoHotels = await fetchNearbyHotelsFromGeoapify(numLat, numLng, detectedCity, 30000, 20);
        if (geoHotels && geoHotels.length > 0) {
          const processed = filterAndSortHotels(geoHotels, filters, sort);
          return res.status(200).json({
            success: true,
            count: processed.length,
            source: 'geoapify',
            location: { lat: numLat, lng: numLng, city: detectedCity },
            data: processed,
          });
        }
      }
    }

    // 2. If a destination / city is entered, geocode with Geoapify and find nearby hotels
    if (city && city.trim()) {
      const cleanCity = city.trim();
      const geocoded = await geocodeWithGeoapify(cleanCity);
      if (geocoded && geocoded.lat && geocoded.lon) {
        const geoHotels = await fetchNearbyHotelsFromGeoapify(
          geocoded.lat,
          geocoded.lon,
          geocoded.city || cleanCity,
          30000,
          20,
        );

        if (geoHotels && geoHotels.length > 0) {
          const processed = filterAndSortHotels(geoHotels, filters, sort);
          return res.status(200).json({
            success: true,
            count: processed.length,
            source: 'geoapify',
            location: { lat: geocoded.lat, lng: geocoded.lon, city: geocoded.city },
            data: processed,
          });
        }
      }
    }

    // 3. Fallback to Database / Memory Catalog
    let centerGeo = null;
    if (lat && lng) {
      centerGeo = { lat: parseFloat(lat), lng: parseFloat(lng) };
    } else if (city) {
      centerGeo = await getCityGeoCoordinates(city);
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const filter = {};
      if (city) filter.city = new RegExp(city.trim(), 'i');
      if (minRating) filter.reviewScore = { $gte: Number(minRating) };
      if (maxPrice) filter.pricePerNight = { $lte: Number(maxPrice) };
      if (freeCancellation === 'true') filter.freeCancellation = true;
      if (featured === 'true') filter.featured = true;
      if (amenities) {
        const amenitiesList = amenities.split(',').map((a) => a.trim());
        filter.amenities = { $all: amenitiesList };
      }

      let query = Hotel.find(filter);
      if (sort === 'price_asc') query = query.sort({ pricePerNight: 1 });
      else if (sort === 'price_desc') query = query.sort({ pricePerNight: -1 });
      else if (sort === 'rating') query = query.sort({ reviewScore: -1 });
      else query = query.sort({ featured: -1, reviewScore: -1 });

      let results = await query.exec();

      // If user searched for a specific city and no hotels exist yet, generate & save them to MongoDB Atlas!
      if (results.length === 0 && city) {
        const dynamicHotels = await generateDynamicHotels(city);
        try {
          results = await Hotel.insertMany(dynamicHotels);
        } catch {
          results = dynamicHotels;
        }
      }

      if (results.length === 0) {
        results = await Hotel.find().sort({ reviewScore: -1 }).limit(8);
      }

      // Convert to plain objects and compute real dynamic distance from center
      const mapped = results.map((doc) => {
        const h = doc.toObject ? doc.toObject() : { ...doc };
        if (centerGeo && h.coordinates?.lat && h.coordinates?.lng) {
          h.distanceKm = calculateDistanceKm(
            centerGeo.lat,
            centerGeo.lng,
            h.coordinates.lat,
            h.coordinates.lng,
          );
        } else if (!h.distanceKm) {
          h.distanceKm = 1.2;
        }
        return h;
      });

      // If user sorted by distance (closest first)
      if (sort === 'distance') {
        mapped.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
      }

      return res.status(200).json({ success: true, count: mapped.length, data: mapped });
    }

    // Memory store fallback
    let list = [...memoryStore.hotels];
    if (city) list = list.filter((h) => h.city.toLowerCase().includes(city.toLowerCase()));
    if (minRating) list = list.filter((h) => h.reviewScore >= Number(minRating));
    if (maxPrice) list = list.filter((h) => h.pricePerNight <= Number(maxPrice));
    if (freeCancellation === 'true') list = list.filter((h) => h.freeCancellation);
    if (featured === 'true') list = list.filter((h) => h.featured);

    if (list.length === 0 && city) {
      const generated = await generateDynamicHotels(city);
      list = generated;
      memoryStore.hotels.push(...generated);
    } else if (list.length === 0) {
      list = [...memoryStore.hotels];
    }

    // Attach distance calculation in fallback mode
    const mapped = list.map((h) => {
      const item = { ...h };
      if (centerGeo && item.coordinates?.lat && item.coordinates?.lng) {
        item.distanceKm = calculateDistanceKm(
          centerGeo.lat,
          centerGeo.lng,
          item.coordinates.lat,
          item.coordinates.lng,
        );
      }
      return item;
    });

    if (sort === 'distance') {
      mapped.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    } else if (sort === 'price_asc') {
      mapped.sort((a, b) => a.pricePerNight - b.pricePerNight);
    } else if (sort === 'price_desc') {
      mapped.sort((a, b) => b.pricePerNight - a.pricePerNight);
    } else {
      mapped.sort((a, b) => b.reviewScore - a.reviewScore);
    }

    return res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get featured hotels for home page
 */
export const getFeaturedHotels = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const featured = await Hotel.find({ featured: true }).limit(4);
      return res.status(200).json({ success: true, data: featured });
    }
    const filtered = memoryStore.hotels.filter((h) => h.featured).slice(0, 4);
    return res.status(200).json({ success: true, data: filtered });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get single hotel by ID
 */
export const getHotelById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let hotel = getCachedGeoHotel(id);

    if (!hotel && mongoose.connection.readyState === 1) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        hotel = await Hotel.findById(id);
      }
    }

    if (!hotel) {
      hotel = memoryStore.hotels.find((h) => (h._id && h._id.toString() === id) || h.id === id);
    }

    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found.' });
    }

    return res.status(200).json({ success: true, data: hotel });
  } catch (error) {
    return next(error);
  }
};

/**
 * Autocomplete location text for hotel search suggestions
 */
export const getHotelAutocomplete = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }
    const suggestions = await autocompleteWithGeoapify(q, 6);
    return res.status(200).json({ success: true, data: suggestions });
  } catch (error) {
    return next(error);
  }
};
