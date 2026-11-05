import { Router } from 'express';
import { z } from 'zod';
import {
  searchFlights,
  getPopularRoutes,
  getFlightById,
  getFlightStatus,
} from '../controllers/flight.controller.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

const searchFlightSchema = {
  query: z.object({
    origin: z.string().max(50).optional(),
    destination: z.string().max(50).optional(),
    departureDate: z.string().optional(),
    returnDate: z.string().optional(),
    cabinClass: z.string().optional(),
    stops: z.string().optional(),
    maxPrice: z.string().optional(),
    airline: z.string().optional(),
    sort: z.string().optional(),
    tripType: z.string().optional(),
    passengers: z.string().optional(),
    fareType: z.string().optional(),
    directOnly: z.string().optional(),
  }).strict(),
};

const flightIdSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid flight ID format'),
  }).strict(),
};

router.get('/search', validate(searchFlightSchema), searchFlights);
router.get('/popular', getPopularRoutes);
router.get('/status', getFlightStatus);
router.get('/:id', validate(flightIdSchema), getFlightById);

export default router;
