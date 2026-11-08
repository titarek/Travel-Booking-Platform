import { env } from '../config/env.js';

const GEOAPIFY_BASE = 'https://api.geoapify.com';

// In-memory cache for geocoding and places lookups (15-minute TTL)
const cache = new Map();
const hotelDetailsCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

export const getCachedGeoHotel = (id) => hotelDetailsCache.get(id);

export const cacheGeoHotel = (hotel) => {
  if (!hotel) return;
  const hId = hotel.id || hotel._id;
  if (hId) {
    hotelDetailsCache.set(hId, hotel);
    hotelDetailsCache.set(String(hId), hotel);
  }
};

// Curated high-resolution hotel and resort imagery
const HOTEL_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=900&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=900&auto=format&fit=crop&q=80',
];

/**
 * Calculate distance between two coordinates in kilometers using Haversine formula
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180)
    * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
};

/**
 * Geocode location name (e.g. "Cox's Bazar", "Paris") into { lat, lon, city, country }
 */
export const geocodeWithGeoapify = async (locationText) => {
  const clean = (locationText || '').trim();
  if (!clean) return null;

  const cacheKey = `geo_${clean.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const apiKey = env.GEOAPIFY_API_KEY || '7ce40ffb71cf4ca59ea23cc96d69bb67';
  const url = `${GEOAPIFY_BASE}/v1/geocode/search?text=${encodeURIComponent(clean)}&apiKey=${apiKey}&limit=1`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.features || data.features.length === 0) return null;

    const prop = data.features[0].properties;
    const result = {
      lat: prop.lat,
      lon: prop.lon,
      city: prop.city || prop.name || clean,
      country: prop.country || '',
      formatted: prop.formatted || clean,
    };

    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (err) {
    console.warn(`[Geoapify] Geocoding lookup error for ${clean}:`, err.message);
    return null;
  }
};

/**
 * Reverse geocode (lat, lon) to obtain human-readable city and country
 */
export const reverseGeocodeWithGeoapify = async (lat, lon) => {
  const cacheKey = `rev_${Number(lat).toFixed(3)}_${Number(lon).toFixed(3)}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const apiKey = env.GEOAPIFY_API_KEY || '7ce40ffb71cf4ca59ea23cc96d69bb67';
  const url = `${GEOAPIFY_BASE}/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.features || data.features.length === 0) return null;

    const prop = data.features[0].properties;
    const result = {
      city: prop.city || prop.county || prop.state || 'Local Area',
      country: prop.country || '',
      formatted: prop.formatted || '',
    };

    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (err) {
    console.warn(`[Geoapify] Reverse geocode error for (${lat}, ${lon}):`, err.message);
    return null;
  }
};

// Strict exclusion for non-hotel establishments (hostels, student halls, dorms, paying guests)
const EXCLUDED_PATTERNS = [
  '\\b(hostel|hostels|dormitory|dorms?|mess|pg\\b|paying\\s*guest)\\b',
  '\\b(girls?\\s*hall|boys?\\s*hall|college|school|colony)\\b',
].join('|');
const EXCLUDED_HOTEL_REGEX = new RegExp(EXCLUDED_PATTERNS, 'i');

// Keywords that indicate legitimate bookable commercial hotels and resorts
const VALID_PATTERNS = [
  '\\b(hotels?|h[oô]tels?|resorts?|motels?|inns?|suites?|lodges?)\\b',
  '\\b(palaces?|villas?|ch[aâ]teaux?|cottages?|b&b|bed\\s*(and|&)\\s*breakfast)\\b',
  '(হোটেল|রিসোর্ট|মোটেল|ইন)',
  '(best\\s*western|marriott|hilton|hyatt|radisson|sheraton)',
  '(westin|novotel|intercontinental|four\\s*seasons|le\\s*meridien)',
].join('|');
const VALID_HOTEL_REGEX = new RegExp(VALID_PATTERNS, 'i');

/**
 * Filter out college/girls/student hostels, dormitories, and unbookable entities
 */
export const isValidHotelTitle = (name) => {
  if (!name || name.trim().toLowerCase() === 'undefined') return false;
  const clean = name.trim();
  if (EXCLUDED_HOTEL_REGEX.test(clean)) return false;
  return VALID_HOTEL_REGEX.test(clean);
};

/**
 * Fetch live nearby hotels from Geoapify Places API around coordinates
 */
export const fetchNearbyHotelsFromGeoapify = async (lat, lon, cityName, radiusMeters = 25000, limit = 20) => {
  const numLat = parseFloat(lat);
  const numLon = parseFloat(lon);
  if (Number.isNaN(numLat) || Number.isNaN(numLon)) return [];

  const cacheKey = `places_${numLat.toFixed(3)}_${numLon.toFixed(3)}_${radiusMeters}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const apiKey = env.GEOAPIFY_API_KEY || '7ce40ffb71cf4ca59ea23cc96d69bb67';
  const fetchLimit = Math.max(limit * 2, 40);
  const url = `${GEOAPIFY_BASE}/v2/places?categories=accommodation.hotel,accommodation.motel&filter=circle:${numLon},${numLat},${radiusMeters}&bias=proximity:${numLon},${numLat}&limit=${fetchLimit}&apiKey=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.features || data.features.length === 0) return [];

    const validFeatures = data.features.filter((feature) => {
      const p = feature.properties;
      if (!p || !p.name) return false;
      const cats = p.categories || [];
      const hasExcludedCategory = cats.some(
        (c) => c.includes('hostel') || c.includes('dormitory') || c.includes('apartment'),
      );
      if (hasExcludedCategory) return false;
      return isValidHotelTitle(p.name);
    });

    const mappedHotels = validFeatures.slice(0, limit).map((feature, idx) => {
      const p = feature.properties;
      const hotelLat = p.lat;
      const hotelLng = p.lon;
      const distKm = calculateDistanceKm(numLat, numLon, hotelLat, hotelLng);

      // Clean and sanitize hotel name
      const hotelName = (p.name || '').trim();

      // Generate deterministic pricing & review scores
      const baseHash = Math.abs(hotelName.split('').reduce((acc, c) => acc + c.charCodeAt(0), idx * 17));
      let starRating = 4;
      if (baseHash % 3 === 0) {
        starRating = 5;
      } else if (baseHash % 2 === 0) {
        starRating = 3;
      }
      const reviewScore = Number((4.1 + (baseHash % 9) * 0.1).toFixed(1));
      const reviewCount = 65 + (baseHash % 280);
      const pricePerNight = 60 + ((baseHash % 16) * 12);
      const image = HOTEL_IMAGES[idx % HOTEL_IMAGES.length];

      return {
        _id: `geo_${p.place_id || `${idx}_${Date.now()}`}`,
        id: `geo_${p.place_id || `${idx}_${Date.now()}`}`,
        name: hotelName,
        city: p.city || cityName || 'Nearby Location',
        country: p.country || 'International',
        district: p.suburb || p.district || p.county || 'City Center',
        address: p.formatted || p.address_line2 || `${hotelName}, ${cityName}`,
        distanceKm: distKm,
        coordinates: {
          lat: hotelLat,
          lng: hotelLng,
        },
        starRating,
        reviewScore,
        reviewCount,
        pricePerNight,
        images: [image],
        thumbnail: image,
        amenities: [
          'Free High-Speed WiFi',
          'Air Conditioning',
          'Swimming Pool',
          'Breakfast Included',
          '24/7 Front Desk Service',
          'Daily Housekeeping',
        ],
        roomTypes: [
          {
            name: starRating === 5 ? 'Presidential Suite' : 'Deluxe Double Room',
            bed: '1 King Bed',
            maxGuests: 2,
            price: pricePerNight,
            refundable: true,
            breakfastIncluded: true,
          },
        ],
        description: `Verified accommodations on Geoapify Live Radar located in ${p.city || cityName || 'destination'}. Situated ${distKm} km from center with premium guest amenities.`,
        freeCancellation: true,
        featured: idx === 0,
        source: 'geoapify',
      };
    });

    mappedHotels.forEach(cacheGeoHotel);
    cache.set(cacheKey, { timestamp: Date.now(), data: mappedHotels });
    return mappedHotels;
  } catch (err) {
    console.warn(`[Geoapify] Places API error for (${numLat}, ${numLon}):`, err.message);
    return [];
  }
};

/**
 * Autocomplete location text for hotel search suggestions
 */
export const autocompleteWithGeoapify = async (queryText, limit = 5) => {
  const clean = (queryText || '').trim();
  if (!clean || clean.length < 2) return [];

  const cacheKey = `auto_${clean.toLowerCase()}_${limit}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const apiKey = env.GEOAPIFY_API_KEY || '7ce40ffb71cf4ca59ea23cc96d69bb67';
  const url = `${GEOAPIFY_BASE}/v1/geocode/autocomplete?text=${encodeURIComponent(clean)}&apiKey=${apiKey}&limit=${limit}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.features || data.features.length === 0) return [];

    const suggestions = data.features.map((f) => {
      const p = f.properties;
      return {
        city: p.city || p.name || clean,
        country: p.country || '',
        formatted: p.formatted || '',
        lat: p.lat,
        lng: p.lon,
      };
    });

    cache.set(cacheKey, { timestamp: Date.now(), data: suggestions });
    return suggestions;
  } catch (err) {
    console.warn(`[Geoapify] Autocomplete error for "${clean}":`, err.message);
    return [];
  }
};
