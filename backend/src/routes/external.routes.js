import { Router } from 'express';
import { z } from 'zod';
import { getAirports, getExchangeRates, getWeather } from '../controllers/external.controller.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

const airportsSchema = {
  query: z.object({
    q: z.string().max(50).optional(),
  }).strict(),
};

const weatherSchema = {
  query: z.object({
    city: z.string().max(50).optional(),
  }).strict(),
};

router.get('/airports', validate(airportsSchema), getAirports);
router.get('/exchange-rates', getExchangeRates);
router.get('/weather', validate(weatherSchema), getWeather);

export default router;
