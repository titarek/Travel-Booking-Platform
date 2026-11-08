import { Router } from 'express';
import { z } from 'zod';
import {
  getHotels,
  getFeaturedHotels,
  getHotelById,
  getHotelAutocomplete,
} from '../controllers/hotel.controller.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

const getHotelsSchema = {
  query: z.object({
    city: z.string().max(100).optional(),
    lat: z.string().optional(),
    lng: z.string().optional(),
    minRating: z.string().optional(),
    maxPrice: z.string().optional(),
    amenities: z.string().optional(),
    freeCancellation: z.string().optional(),
    featured: z.string().optional(),
    sort: z.string().optional(),
  }).strict(),
};

const hotelIdSchema = {
  params: z.object({
    id: z.string().min(1, 'Invalid hotel ID format'),
  }).strict(),
};

router.get('/', validate(getHotelsSchema), getHotels);
router.get('/featured', getFeaturedHotels);
router.get('/autocomplete', getHotelAutocomplete);
router.get('/:id', validate(hotelIdSchema), getHotelById);

export default router;
