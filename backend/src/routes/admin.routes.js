import { Router } from 'express';
import { z } from 'zod';
import {
  getAdminStats,
  getAllBookings,
  updateBookingStatus,
  deleteBooking,
  getAdminHotels,
  createHotel,
  updateHotel,
  deleteHotel,
  getAdminFlights,
  createFlight,
  updateFlightStatus,
  deleteFlight,
  getAdminPackages,
  createPackage,
  updatePackage,
  deletePackage,
  getAdminUsers,
  updateUserRole,
  getAdminAuditLogs,
  getSystemHealth,
  clearSystemCache,
  getPlatformSettings,
  updatePlatformSettings,
  getApiKeysStatus,
  revealApiKey,
  updateApiKey,
  updateMasterPin,
  testApiConnection,
} from '../controllers/admin.controller.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerAdminClient } from '../utils/realtime.js';

const router = Router();

// Protect all admin endpoints
router.use(authenticate, authorizeAdmin);

// Realtime SSE event streaming for live order notifications
router.get('/realtime', registerAdminClient);

// Analytics & Audit Logs
router.get('/stats', getAdminStats);
router.get('/logs', getAdminAuditLogs);

// Bookings
router.get('/bookings', getAllBookings);
router.patch(
  '/bookings/:id/status',
  validate({
    params: z.object({ id: z.string().min(1) }).strict(),
    body: z.object({
      status: z.enum(['confirmed', 'pending', 'cancelled', 'CONFIRMED', 'PENDING', 'CANCELLED']).optional(),
      paymentStatus: z.enum(['pending', 'paid', 'refunded', 'PENDING', 'PAID', 'REFUNDED']).optional(),
    }).strict(),
  }),
  updateBookingStatus,
);
router.delete('/bookings/:id', deleteBooking);

// Hotels
router.get('/hotels', getAdminHotels);
router.post(
  '/hotels',
  validate({
    body: z.object({
      name: z.string().min(2),
      city: z.string().min(2),
      country: z.string().optional(),
      address: z.string().optional(),
      pricePerNight: z.number().positive(),
      starRating: z.number().min(1).max(5).optional(),
      amenities: z.array(z.string()).optional(),
      description: z.string().optional(),
      thumbnail: z.string().url().optional(),
      featured: z.boolean().optional(),
    }).strict(),
  }),
  createHotel,
);
router.patch('/hotels/:id', updateHotel);
router.delete('/hotels/:id', deleteHotel);

// Flights
router.get('/flights', getAdminFlights);
router.post(
  '/flights',
  validate({
    body: z.object({
      airline: z.string().optional(),
      flightNumber: z.string().optional(),
      originCode: z.string().length(3),
      originCity: z.string().min(2),
      destCode: z.string().length(3),
      destCity: z.string().min(2),
      departureTime: z.string().optional(),
      arrivalTime: z.string().optional(),
      price: z.number().positive(),
      availableSeats: z.number().positive().optional(),
    }).strict(),
  }),
  createFlight,
);
router.patch('/flights/:id/status', updateFlightStatus);
router.delete('/flights/:id', deleteFlight);

// Holiday & Umrah Tour Packages
router.get('/packages', getAdminPackages);
router.post(
  '/packages',
  validate({
    body: z.object({
      title: z.string().min(3),
      destination: z.string().min(2),
      country: z.string().optional(),
      durationDays: z.number().positive().optional(),
      durationNights: z.number().nonnegative().optional(),
      price: z.number().positive(),
      discountPrice: z.number().positive().optional(),
      image: z.string().url().optional(),
      category: z.enum(['Family', 'Honeymoon', 'Adventure', 'Luxury', 'Budget']).optional(),
      badge: z.string().optional(),
      featured: z.boolean().optional(),
      highlights: z.array(z.string()).optional(),
    }).strict(),
  }),
  createPackage,
);
router.patch('/packages/:id', updatePackage);
router.delete('/packages/:id', deletePackage);

// SaaS Optimization & System Telemetry
router.get('/system/health', getSystemHealth);
router.post('/system/cache-clear', clearSystemCache);

// SaaS Platform Pricing & Global Settings
router.get('/settings', getPlatformSettings);
router.patch('/settings', updatePlatformSettings);

// Third-Party API Statuses & Credentials Management (Protected with Master PIN)
router.get('/api-keys', getApiKeysStatus);
router.post('/api-keys/reveal', revealApiKey);
router.patch('/api-keys', updateApiKey);
router.patch('/api-keys/pin', updateMasterPin);
router.post('/api-keys/test', testApiConnection);

// Users
router.get('/users', getAdminUsers);
router.patch(
  '/users/:id/role',
  validate({
    params: z.object({ id: z.string().min(1) }).strict(),
    body: z.object({
      role: z.enum(['user', 'admin']),
    }).strict(),
  }),
  updateUserRole,
);

export default router;
