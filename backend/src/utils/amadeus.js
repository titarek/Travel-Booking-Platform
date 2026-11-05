import { env } from '../config/env.js';

/**
 * Server-side external travel helper (Airport directory & multi-currency converter)
 */

export const AIRPORT_DIRECTORY = [
  // Bangladesh & Regional
  { code: 'DAC', city: 'Dhaka', airport: 'Hazrat Shahjalal International Airport', country: 'Bangladesh' },
  { code: 'CXB', city: "Cox's Bazar", airport: "Cox's Bazar Airport", country: 'Bangladesh' },
  { code: 'CGP', city: 'Chittagong', airport: 'Shah Amanat International Airport', country: 'Bangladesh' },
  { code: 'ZYL', city: 'Sylhet', airport: 'Osmani International Airport', country: 'Bangladesh' },
  { code: 'JSR', city: 'Jashore', airport: 'Jashore Airport', country: 'Bangladesh' },
  { code: 'RJH', city: 'Rajshahi', airport: 'Shah Makhdum Airport', country: 'Bangladesh' },
  { code: 'SPD', city: 'Saidpur', airport: 'Saidpur Airport', country: 'Bangladesh' },
  { code: 'BZL', city: 'Barishal', airport: 'Barishal Airport', country: 'Bangladesh' },

  // Middle East
  { code: 'DXB', city: 'Dubai', airport: 'Dubai International Airport', country: 'United Arab Emirates' },
  { code: 'AUH', city: 'Abu Dhabi', airport: 'Zayed International Airport', country: 'United Arab Emirates' },
  { code: 'DOH', city: 'Doha', airport: 'Hamad International Airport', country: 'Qatar' },
  { code: 'JED', city: 'Jeddah', airport: 'King Abdulaziz International Airport', country: 'Saudi Arabia' },
  { code: 'RUH', city: 'Riyadh', airport: 'King Khalid International Airport', country: 'Saudi Arabia' },
  { code: 'MED', city: 'Madinah', airport: 'Prince Mohammad Bin Abdulaziz Airport', country: 'Saudi Arabia' },
  { code: 'MCT', city: 'Muscat', airport: 'Muscat International Airport', country: 'Oman' },
  { code: 'BAH', city: 'Manama', airport: 'Bahrain International Airport', country: 'Bahrain' },
  { code: 'KWI', city: 'Kuwait City', airport: 'Kuwait International Airport', country: 'Kuwait' },

  // South East Asia & East Asia
  { code: 'BKK', city: 'Bangkok', airport: 'Suvarnabhumi Airport', country: 'Thailand' },
  { code: 'DMK', city: 'Bangkok', airport: 'Don Mueang International Airport', country: 'Thailand' },
  { code: 'HKT', city: 'Phuket', airport: 'Phuket International Airport', country: 'Thailand' },
  { code: 'SIN', city: 'Singapore', airport: 'Singapore Changi Airport', country: 'Singapore' },
  { code: 'KUL', city: 'Kuala Lumpur', airport: 'Kuala Lumpur International Airport', country: 'Malaysia' },
  { code: 'DPS', city: 'Bali', airport: 'Ngurah Rai International Airport', country: 'Indonesia' },
  { code: 'CGK', city: 'Jakarta', airport: 'Soekarno-Hatta International Airport', country: 'Indonesia' },
  { code: 'MLE', city: 'Malé', airport: 'Velana International Airport', country: 'Maldives' },
  { code: 'CMB', city: 'Colombo', airport: 'Bandaranaike International Airport', country: 'Sri Lanka' },
  { code: 'HND', city: 'Tokyo', airport: 'Haneda Airport', country: 'Japan' },
  { code: 'NRT', city: 'Tokyo', airport: 'Narita International Airport', country: 'Japan' },
  { code: 'KIX', city: 'Osaka', airport: 'Kansai International Airport', country: 'Japan' },
  { code: 'ICN', city: 'Seoul', airport: 'Incheon International Airport', country: 'South Korea' },
  { code: 'HKG', city: 'Hong Kong', airport: 'Hong Kong International Airport', country: 'Hong Kong' },
  { code: 'TPE', city: 'Taipei', airport: 'Taiwan Taoyuan International Airport', country: 'Taiwan' },
  { code: 'PEK', city: 'Beijing', airport: 'Beijing Capital International Airport', country: 'China' },
  { code: 'PVG', city: 'Shanghai', airport: 'Shanghai Pudong International Airport', country: 'China' },
  { code: 'CAN', city: 'Guangzhou', airport: 'Guangzhou Baiyun International Airport', country: 'China' },

  // Europe
  { code: 'LHR', city: 'London', airport: 'Heathrow Airport', country: 'United Kingdom' },
  { code: 'LGW', city: 'London', airport: 'Gatwick Airport', country: 'United Kingdom' },
  { code: 'MAN', city: 'Manchester', airport: 'Manchester Airport', country: 'United Kingdom' },
  { code: 'CDG', city: 'Paris', airport: 'Charles de Gaulle Airport', country: 'France' },
  { code: 'FCO', city: 'Rome', airport: 'Leonardo da Vinci-Fiumicino Airport', country: 'Italy' },
  { code: 'MXP', city: 'Milan', airport: 'Milan Malpensa Airport', country: 'Italy' },
  { code: 'IST', city: 'Istanbul', airport: 'Istanbul Airport', country: 'Turkey' },
  { code: 'FRA', city: 'Frankfurt', airport: 'Frankfurt Airport', country: 'Germany' },
  { code: 'MUC', city: 'Munich', airport: 'Munich Airport', country: 'Germany' },
  { code: 'AMS', city: 'Amsterdam', airport: 'Amsterdam Airport Schiphol', country: 'Netherlands' },
  { code: 'ZRH', city: 'Zurich', airport: 'Zurich Airport', country: 'Switzerland' },
  { code: 'VIE', city: 'Vienna', airport: 'Vienna International Airport', country: 'Austria' },
  { code: 'MAD', city: 'Madrid', airport: 'Adolfo Suárez Madrid-Barajas Airport', country: 'Spain' },
  { code: 'BCN', city: 'Barcelona', airport: 'Josep Tarradellas Barcelona-El Prat Airport', country: 'Spain' },
  { code: 'ATH', city: 'Athens', airport: 'Athens International Airport', country: 'Greece' },

  // North America
  { code: 'JFK', city: 'New York', airport: 'John F. Kennedy International Airport', country: 'United States' },
  { code: 'EWR', city: 'Newark', airport: 'Newark Liberty International Airport', country: 'United States' },
  { code: 'LAX', city: 'Los Angeles', airport: 'Los Angeles International Airport', country: 'United States' },
  { code: 'SFO', city: 'San Francisco', airport: 'San Francisco International Airport', country: 'United States' },
  { code: 'ORD', city: 'Chicago', airport: "O'Hare International Airport", country: 'United States' },
  { code: 'MIA', city: 'Miami', airport: 'Miami International Airport', country: 'United States' },
  { code: 'DFW', city: 'Dallas', airport: 'Dallas/Fort Worth International Airport', country: 'United States' },
  { code: 'YYZ', city: 'Toronto', airport: 'Toronto Pearson International Airport', country: 'Canada' },
  { code: 'YVR', city: 'Vancouver', airport: 'Vancouver International Airport', country: 'Canada' },

  // Australia & Oceania
  { code: 'SYD', city: 'Sydney', airport: 'Sydney Kingsford Smith Airport', country: 'Australia' },
  { code: 'MEL', city: 'Melbourne', airport: 'Melbourne Airport', country: 'Australia' },
  { code: 'BNE', city: 'Brisbane', airport: 'Brisbane Airport', country: 'Australia' },
  { code: 'PER', city: 'Perth', airport: 'Perth Airport', country: 'Australia' },
  { code: 'AKL', city: 'Auckland', airport: 'Auckland Airport', country: 'New Zealand' },

  // South Asia
  { code: 'DEL', city: 'Delhi', airport: 'Indira Gandhi International Airport', country: 'India' },
  { code: 'BOM', city: 'Mumbai', airport: 'Chhatrapati Shivaji Maharaj International Airport', country: 'India' },
  { code: 'CCU', city: 'Kolkata', airport: 'Netaji Subhash Chandra Bose International Airport', country: 'India' },
  { code: 'MAA', city: 'Chennai', airport: 'Chennai International Airport', country: 'India' },
  { code: 'BLR', city: 'Bengaluru', airport: 'Kempegowda International Airport', country: 'India' },
  { code: 'KTM', city: 'Kathmandu', airport: 'Tribhuvan International Airport', country: 'Nepal' },

  // Africa
  { code: 'CAI', city: 'Cairo', airport: 'Cairo International Airport', country: 'Egypt' },
  { code: 'JNB', city: 'Johannesburg', airport: 'O. R. Tambo International Airport', country: 'South Africa' },
  { code: 'CPT', city: 'Cape Town', airport: 'Cape Town International Airport', country: 'South Africa' },
  { code: 'NBO', city: 'Nairobi', airport: 'Jomo Kenyatta International Airport', country: 'Kenya' },
];

export const EXCHANGE_RATES = {
  USD: 1.0,
  BDT: 121.5,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
};

let cachedAmadeusToken = null;
let tokenExpiresAt = 0;

export const resetAmadeusToken = () => {
  cachedAmadeusToken = null;
  tokenExpiresAt = 0;
};

const getAmadeusToken = async () => {
  if (!env.AMADEUS_CLIENT_ID || !env.AMADEUS_CLIENT_SECRET) {
    return null;
  }
  if (cachedAmadeusToken && Date.now() < tokenExpiresAt) {
    return cachedAmadeusToken;
  }
  try {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.AMADEUS_CLIENT_ID,
      client_secret: env.AMADEUS_CLIENT_SECRET,
    });
    const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    if (!response.ok) return null;
    const data = await response.json();
    cachedAmadeusToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return cachedAmadeusToken;
  } catch {
    return null;
  }
};

/**
 * Search airports by city, country, or IATA code
 */
export const searchAirports = async (query) => {
  const q = (query || '').trim().toLowerCase();
  if (!q) return AIRPORT_DIRECTORY.slice(0, 8);

  const token = await getAmadeusToken();
  if (token) {
    try {
      const url = `https://test.api.amadeus.com/v1/reference-data/locations?subType=AIRPORT,CITY&keyword=${encodeURIComponent(q)}&page[limit]=10`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          return json.data.map((item) => ({
            code: item.iataCode,
            city: item.address?.cityName || item.name,
            airport: item.name,
            country: item.address?.countryName || '',
          }));
        }
      }
    } catch {
      // Fallback to local directory
    }
  }

  return AIRPORT_DIRECTORY.filter(
    (a) => a.code.toLowerCase().includes(q)
      || a.city.toLowerCase().includes(q)
      || a.country.toLowerCase().includes(q)
      || a.airport.toLowerCase().includes(q),
  );
};

/**
 * Resolve any airport or city code
 */
export const findAirport = (term) => {
  if (!term) return null;
  const clean = term.trim().toLowerCase();
  return (
    AIRPORT_DIRECTORY.find((a) => a.code.toLowerCase() === clean)
    || AIRPORT_DIRECTORY.find((a) => a.city.toLowerCase() === clean)
    || AIRPORT_DIRECTORY.find((a) => a.city.toLowerCase().includes(clean))
    || {
      code: term.toUpperCase().slice(0, 3),
      city: term,
      airport: `${term} International Airport`,
      country: 'International',
    }
  );
};

export const getRates = () => EXCHANGE_RATES;
