import { searchAirports, getRates } from '../utils/amadeus.js';
import { env } from '../config/env.js';

let cachedRates = null;
let ratesExpiresAt = 0;

export const resetExchangeRatesCache = () => {
  cachedRates = null;
  ratesExpiresAt = 0;
};

/**
 * Airport autocomplete endpoint
 * Frontend queries /api/external/airports?q=dac
 */
export const getAirports = async (req, res, next) => {
  try {
    const { q } = req.query;
    const airports = await searchAirports(q);
    return res.status(200).json({
      success: true,
      data: airports,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Currency exchange rates
 * Uses live ExchangeRate-API when key is present, with 1-hour in-memory cache
 */
export const getExchangeRates = async (req, res) => {
  const apiKey = env.EXCHANGE_RATE_API_KEY || process.env.EXCHANGE_RATE_API_KEY;
  if (apiKey && (!cachedRates || Date.now() > ratesExpiresAt)) {
    try {
      const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        if (json.result === 'success' && json.conversion_rates) {
          cachedRates = {
            USD: 1.0,
            BDT: json.conversion_rates.BDT || 123.5,
            EUR: json.conversion_rates.EUR || 0.89,
            GBP: json.conversion_rates.GBP || 0.75,
            AED: json.conversion_rates.AED || 3.67,
          };
          ratesExpiresAt = Date.now() + 3600 * 1000; // 1 hour cache
        }
      }
    } catch {
      // Fallback
    }
  }

  const rates = cachedRates || getRates();
  return res.status(200).json({
    success: true,
    base: 'USD',
    rates,
    live: Boolean(env.EXCHANGE_RATE_API_KEY),
  });
};

/**
 * Destination weather info overview
 */
export const getWeather = (req, res) => {
  const { city } = req.query;
  const destinationWeather = {
    Dhaka: { temp: 28, condition: 'Sunny', humidity: 65 },
    "Cox's Bazar": { temp: 27, condition: 'Breezy & Clear', humidity: 70 },
    Dubai: { temp: 32, condition: 'Sunny & Warm', humidity: 45 },
    Bangkok: { temp: 31, condition: 'Partly Cloudy', humidity: 75 },
    Singapore: { temp: 30, condition: 'Tropical Shower', humidity: 80 },
    Malé: { temp: 29, condition: 'Sunny Coastal', humidity: 72 },
    Istanbul: { temp: 21, condition: 'Pleasant & Mild', humidity: 55 },
    London: { temp: 17, condition: 'Partly Cloudy', humidity: 68 },
    Tokyo: { temp: 20, condition: 'Clear', humidity: 50 },
  };

  const matched = destinationWeather[city] || { temp: 26, condition: 'Fair Weather', humidity: 60 };

  return res.status(200).json({
    success: true,
    city: city || 'Global',
    weather: matched,
  });
};
