/**
 * Global Airport Geolocation Directory & Great-Circle Geodesic Flight Route Utilities
 */

export const AIRPORT_COORDINATES = {
  // Bangladesh & Regional
  DAC: {
    code: 'DAC', city: 'Dhaka', airport: 'Hazrat Shahjalal International Airport', country: 'Bangladesh', lat: 23.8433, lng: 90.3978,
  },
  CXB: {
    code: 'CXB', city: "Cox's Bazar", airport: "Cox's Bazar Airport", country: 'Bangladesh', lat: 21.4522, lng: 91.9639,
  },
  CGP: {
    code: 'CGP', city: 'Chittagong', airport: 'Shah Amanat International Airport', country: 'Bangladesh', lat: 22.2496, lng: 91.8133,
  },
  ZYL: {
    code: 'ZYL', city: 'Sylhet', airport: 'Osmani International Airport', country: 'Bangladesh', lat: 24.9632, lng: 91.8668,
  },
  JSR: {
    code: 'JSR', city: 'Jashore', airport: 'Jashore Airport', country: 'Bangladesh', lat: 23.1838, lng: 89.1608,
  },
  RJH: {
    code: 'RJH', city: 'Rajshahi', airport: 'Shah Makhdum Airport', country: 'Bangladesh', lat: 24.4372, lng: 88.6165,
  },
  SPD: {
    code: 'SPD', city: 'Saidpur', airport: 'Saidpur Airport', country: 'Bangladesh', lat: 25.7592, lng: 88.9086,
  },
  BZL: {
    code: 'BZL', city: 'Barishal', airport: 'Barishal Airport', country: 'Bangladesh', lat: 22.8010, lng: 90.3012,
  },

  // Middle East
  DXB: {
    code: 'DXB', city: 'Dubai', airport: 'Dubai International Airport', country: 'United Arab Emirates', lat: 25.2532, lng: 55.3657,
  },
  AUH: {
    code: 'AUH', city: 'Abu Dhabi', airport: 'Zayed International Airport', country: 'United Arab Emirates', lat: 24.4330, lng: 54.6511,
  },
  DOH: {
    code: 'DOH', city: 'Doha', airport: 'Hamad International Airport', country: 'Qatar', lat: 25.2731, lng: 51.6081,
  },
  JED: {
    code: 'JED', city: 'Jeddah', airport: 'King Abdulaziz International Airport', country: 'Saudi Arabia', lat: 21.6796, lng: 39.1565,
  },
  RUH: {
    code: 'RUH', city: 'Riyadh', airport: 'King Khalid International Airport', country: 'Saudi Arabia', lat: 24.9576, lng: 46.6988,
  },
  MED: {
    code: 'MED', city: 'Madinah', airport: 'Prince Mohammad Bin Abdulaziz Airport', country: 'Saudi Arabia', lat: 24.5534, lng: 39.7051,
  },
  MCT: {
    code: 'MCT', city: 'Muscat', airport: 'Muscat International Airport', country: 'Oman', lat: 23.5933, lng: 58.2844,
  },
  BAH: {
    code: 'BAH', city: 'Manama', airport: 'Bahrain International Airport', country: 'Bahrain', lat: 26.2708, lng: 50.6336,
  },
  KWI: {
    code: 'KWI', city: 'Kuwait City', airport: 'Kuwait International Airport', country: 'Kuwait', lat: 29.2266, lng: 47.9689,
  },

  // South East Asia & East Asia
  BKK: {
    code: 'BKK', city: 'Bangkok', airport: 'Suvarnabhumi Airport', country: 'Thailand', lat: 13.6900, lng: 100.7501,
  },
  DMK: {
    code: 'DMK', city: 'Bangkok', airport: 'Don Mueang International Airport', country: 'Thailand', lat: 13.9126, lng: 100.6067,
  },
  HKT: {
    code: 'HKT', city: 'Phuket', airport: 'Phuket International Airport', country: 'Thailand', lat: 8.1132, lng: 98.3169,
  },
  SIN: {
    code: 'SIN', city: 'Singapore', airport: 'Singapore Changi Airport', country: 'Singapore', lat: 1.3644, lng: 103.9915,
  },
  KUL: {
    code: 'KUL', city: 'Kuala Lumpur', airport: 'Kuala Lumpur International Airport', country: 'Malaysia', lat: 2.7456, lng: 101.7072,
  },
  DPS: {
    code: 'DPS', city: 'Bali', airport: 'Ngurah Rai International Airport', country: 'Indonesia', lat: -8.7482, lng: 115.1672,
  },
  CGK: {
    code: 'CGK', city: 'Jakarta', airport: 'Soekarno-Hatta International Airport', country: 'Indonesia', lat: -6.1275, lng: 106.6537,
  },
  MLE: {
    code: 'MLE', city: 'Malé', airport: 'Velana International Airport', country: 'Maldives', lat: 4.1918, lng: 73.5290,
  },
  CMB: {
    code: 'CMB', city: 'Colombo', airport: 'Bandaranaike International Airport', country: 'Sri Lanka', lat: 7.1808, lng: 79.8841,
  },
  HND: {
    code: 'HND', city: 'Tokyo', airport: 'Haneda Airport', country: 'Japan', lat: 35.5494, lng: 139.7798,
  },
  NRT: {
    code: 'NRT', city: 'Tokyo', airport: 'Narita International Airport', country: 'Japan', lat: 35.7720, lng: 140.3929,
  },
  KIX: {
    code: 'KIX', city: 'Osaka', airport: 'Kansai International Airport', country: 'Japan', lat: 34.4320, lng: 135.2304,
  },
  ICN: {
    code: 'ICN', city: 'Seoul', airport: 'Incheon International Airport', country: 'South Korea', lat: 37.4602, lng: 126.4407,
  },
  HKG: {
    code: 'HKG', city: 'Hong Kong', airport: 'Hong Kong International Airport', country: 'Hong Kong', lat: 22.3080, lng: 113.9185,
  },
  TPE: {
    code: 'TPE', city: 'Taipei', airport: 'Taiwan Taoyuan International Airport', country: 'Taiwan', lat: 25.0797, lng: 121.2342,
  },
  PEK: {
    code: 'PEK', city: 'Beijing', airport: 'Beijing Capital International Airport', country: 'China', lat: 40.0799, lng: 116.6031,
  },
  PVG: {
    code: 'PVG', city: 'Shanghai', airport: 'Shanghai Pudong International Airport', country: 'China', lat: 31.1443, lng: 121.8083,
  },
  CAN: {
    code: 'CAN', city: 'Guangzhou', airport: 'Guangzhou Baiyun International Airport', country: 'China', lat: 23.3924, lng: 113.2988,
  },

  // Europe
  LHR: {
    code: 'LHR', city: 'London', airport: 'Heathrow Airport', country: 'United Kingdom', lat: 51.4700, lng: -0.4543,
  },
  LGW: {
    code: 'LGW', city: 'London', airport: 'Gatwick Airport', country: 'United Kingdom', lat: 51.1537, lng: -0.1821,
  },
  MAN: {
    code: 'MAN', city: 'Manchester', airport: 'Manchester Airport', country: 'United Kingdom', lat: 53.3588, lng: -2.2727,
  },
  CDG: {
    code: 'CDG', city: 'Paris', airport: 'Charles de Gaulle Airport', country: 'France', lat: 49.0097, lng: 2.5479,
  },
  FCO: {
    code: 'FCO', city: 'Rome', airport: 'Leonardo da Vinci-Fiumicino Airport', country: 'Italy', lat: 41.8003, lng: 12.2389,
  },
  MXP: {
    code: 'MXP', city: 'Milan', airport: 'Milan Malpensa Airport', country: 'Italy', lat: 45.6301, lng: 8.7255,
  },
  IST: {
    code: 'IST', city: 'Istanbul', airport: 'Istanbul Airport', country: 'Turkey', lat: 41.2753, lng: 28.7519,
  },
  FRA: {
    code: 'FRA', city: 'Frankfurt', airport: 'Frankfurt Airport', country: 'Germany', lat: 50.0379, lng: 8.5622,
  },
  MUC: {
    code: 'MUC', city: 'Munich', airport: 'Munich Airport', country: 'Germany', lat: 48.3537, lng: 11.7750,
  },
  AMS: {
    code: 'AMS', city: 'Amsterdam', airport: 'Amsterdam Airport Schiphol', country: 'Netherlands', lat: 52.3105, lng: 4.7683,
  },
  ZRH: {
    code: 'ZRH', city: 'Zurich', airport: 'Zurich Airport', country: 'Switzerland', lat: 47.4582, lng: 8.5555,
  },
  VIE: {
    code: 'VIE', city: 'Vienna', airport: 'Vienna International Airport', country: 'Austria', lat: 48.1103, lng: 16.5697,
  },
  MAD: {
    code: 'MAD', city: 'Madrid', airport: 'Adolfo Suárez Madrid-Barajas Airport', country: 'Spain', lat: 40.4839, lng: -3.5680,
  },
  BCN: {
    code: 'BCN', city: 'Barcelona', airport: 'Josep Tarradellas Barcelona-El Prat Airport', country: 'Spain', lat: 41.2974, lng: 2.0833,
  },
  ATH: {
    code: 'ATH', city: 'Athens', airport: 'Athens International Airport', country: 'Greece', lat: 37.9364, lng: 23.9445,
  },

  // North America
  JFK: {
    code: 'JFK', city: 'New York', airport: 'John F. Kennedy International Airport', country: 'United States', lat: 40.6413, lng: -73.7781,
  },
  EWR: {
    code: 'EWR', city: 'Newark', airport: 'Newark Liberty International Airport', country: 'United States', lat: 40.6895, lng: -74.1745,
  },
  LAX: {
    code: 'LAX', city: 'Los Angeles', airport: 'Los Angeles International Airport', country: 'United States', lat: 33.9416, lng: -118.4085,
  },
  SFO: {
    code: 'SFO', city: 'San Francisco', airport: 'San Francisco International Airport', country: 'United States', lat: 37.6213, lng: -122.3790,
  },
  ORD: {
    code: 'ORD', city: 'Chicago', airport: "O'Hare International Airport", country: 'United States', lat: 41.9742, lng: -87.9073,
  },
  MIA: {
    code: 'MIA', city: 'Miami', airport: 'Miami International Airport', country: 'United States', lat: 25.7959, lng: -80.2870,
  },
  DFW: {
    code: 'DFW', city: 'Dallas', airport: 'Dallas/Fort Worth International Airport', country: 'United States', lat: 32.8998, lng: -97.0403,
  },
  YYZ: {
    code: 'YYZ', city: 'Toronto', airport: 'Toronto Pearson International Airport', country: 'Canada', lat: 43.6777, lng: -79.6248,
  },
  YVR: {
    code: 'YVR', city: 'Vancouver', airport: 'Vancouver International Airport', country: 'Canada', lat: 49.1967, lng: -123.1815,
  },

  // South Asia
  DEL: {
    code: 'DEL', city: 'Delhi', airport: 'Indira Gandhi International Airport', country: 'India', lat: 28.5562, lng: 77.1000,
  },
  BOM: {
    code: 'BOM', city: 'Mumbai', airport: 'Chhatrapati Shivaji Maharaj International Airport', country: 'India', lat: 19.0896, lng: 72.8656,
  },
  CCU: {
    code: 'CCU', city: 'Kolkata', airport: 'Netaji Subhash Chandra Bose International Airport', country: 'India', lat: 22.6547, lng: 88.4467,
  },
  MAA: {
    code: 'MAA', city: 'Chennai', airport: 'Chennai International Airport', country: 'India', lat: 12.9941, lng: 80.1709,
  },
  BLR: {
    code: 'BLR', city: 'Bengaluru', airport: 'Kempegowda International Airport', country: 'India', lat: 13.1986, lng: 77.7066,
  },
  KTM: {
    code: 'KTM', city: 'Kathmandu', airport: 'Tribhuvan International Airport', country: 'Nepal', lat: 27.6966, lng: 85.3591,
  },

  // Australia & Africa
  SYD: {
    code: 'SYD', city: 'Sydney', airport: 'Sydney Kingsford Smith Airport', country: 'Australia', lat: -33.9399, lng: 151.1753,
  },
  MEL: {
    code: 'MEL', city: 'Melbourne', airport: 'Melbourne Airport', country: 'Australia', lat: -37.6690, lng: 144.8410,
  },
  CAI: {
    code: 'CAI', city: 'Cairo', airport: 'Cairo International Airport', country: 'Egypt', lat: 30.1219, lng: 31.4056,
  },
  JNB: {
    code: 'JNB', city: 'Johannesburg', airport: 'O. R. Tambo International Airport', country: 'South Africa', lat: -26.1367, lng: 28.2411,
  },
  CPT: {
    code: 'CPT', city: 'Cape Town', airport: 'Cape Town International Airport', country: 'South Africa', lat: -33.9715, lng: 18.6021,
  },
};

/**
 * Resolve coordinates for an airport code or city name
 */
export const getAirportCoordinates = (code, city = '') => {
  const cleanCode = (code || '').toUpperCase().trim();
  if (AIRPORT_COORDINATES[cleanCode]) {
    return AIRPORT_COORDINATES[cleanCode];
  }
  const cleanCity = (city || '').toLowerCase().trim();
  const found = Object.values(AIRPORT_COORDINATES).find(
    (a) => a.city.toLowerCase() === cleanCity || cleanCity.includes(a.city.toLowerCase()),
  );
  if (found) return found;

  // Deterministic fallback coordinate calculation based on character code hashing
  let hash = 0;
  for (let i = 0; i < cleanCode.length; i += 1) {
    hash = (hash * 31 + cleanCode.charCodeAt(i)) % 1000000007;
  }
  return {
    code: cleanCode || 'AIR',
    city: city || cleanCode,
    airport: `${cleanCode} Airport`,
    country: 'International',
    lat: 20 + ((hash % 400) / 10),
    lng: 40 + ((Math.floor(hash / 7) % 800) / 10),
  };
};

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

/**
 * Calculate intermediate points on great circle arc
 */
export const calculateGreatCirclePath = (coord1, coord2, steps = 40) => {
  if (!coord1 || !coord2) return [];
  const lat1 = coord1.lat;
  const lon1 = coord1.lng;
  const lat2 = coord2.lat;
  const lon2 = coord2.lng;

  const phi1 = toRad(lat1);
  const lam1 = toRad(lon1);
  const phi2 = toRad(lat2);
  const lam2 = toRad(lon2);

  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((phi2 - phi1) / 2) ** 2
    + Math.cos(phi1) * Math.cos(phi2) * (Math.sin((lam2 - lam1) / 2) ** 2),
  ));

  if (d === 0) return [[lat1, lon1], [lat2, lon2]];

  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const f = i / steps;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(phi1) * Math.cos(lam1) + B * Math.cos(phi2) * Math.cos(lam2);
    const y = A * Math.cos(phi1) * Math.sin(lam1) + B * Math.cos(phi2) * Math.sin(lam2);
    const z = A * Math.sin(phi1) + B * Math.sin(phi2);
    const phi3 = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lam3 = Math.atan2(y, x);
    points.push([toDeg(phi3), toDeg(lam3)]);
  }

  return points;
};

/**
 * Calculate bearing/heading angle in degrees between two coordinates
 */
export const calculateBearing = (coord1, coord2) => {
  if (!coord1 || !coord2) return 0;
  const phi1 = toRad(coord1.lat);
  const lam1 = toRad(coord1.lng);
  const phi2 = toRad(coord2.lat);
  const lam2 = toRad(coord2.lng);

  const y = Math.sin(lam2 - lam1) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(lam2 - lam1);
  const theta = Math.atan2(y, x);
  return (toDeg(theta) + 360) % 360;
};

/**
 * Interpolate aircraft position along Great Circle route at progress percentage (0 - 100)
 */
export const getInterpolatedPosition = (coord1, coord2, progressPercent = 50) => {
  if (!coord1 || !coord2) return null;
  const f = Math.max(0, Math.min(100, progressPercent)) / 100;
  const path = calculateGreatCirclePath(coord1, coord2, 100);
  const idx = Math.min(Math.floor(f * 100), path.length - 1);
  const pos = path[idx];
  const nextPos = path[Math.min(idx + 1, path.length - 1)];
  const bearing = calculateBearing({ lat: pos[0], lng: pos[1] }, { lat: nextPos[0], lng: nextPos[1] });
  return {
    lat: pos[0],
    lng: pos[1],
    bearing,
  };
};
