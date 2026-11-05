import { Router } from 'express';
import { z } from 'zod';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
} from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

// All booking routes require user authentication
router.use(authenticate);

const travelerSchema = z.object({
  title: z.enum(['Mr', 'Mrs', 'Ms', 'Dr']).default('Mr'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  passportNumber: z.string().optional().default(''),
  nationality: z.string().optional().default('Bangladeshi'),
});

const createBookingSchema = {
  body: z.object({
    type: z.enum(['flight', 'hotel', 'package']),
    itemDetails: z.record(z.any()),
    travelers: z.array(travelerSchema).min(1, 'At least one traveler is required'),
    contactInfo: z.object({
      email: z.string().email('Valid contact email is required'),
      phone: z.string().min(5, 'Valid contact phone number is required'),
    }).strict(),
    totalPrice: z.number().positive('Total price must be positive'),
    paymentMethod: z.string().optional(),
  }).strict(),
};

const bookingIdSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID format'),
  }).strict(),
};

router.post('/', validate(createBookingSchema), createBooking);
router.get('/', getMyBookings);
router.get('/:id', validate(bookingIdSchema), getBookingById);
router.patch('/:id/cancel', validate(bookingIdSchema), cancelBooking);

export default router;
