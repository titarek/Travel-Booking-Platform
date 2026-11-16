import { Router } from 'express';
import {
  authenticateB2BKey,
  getB2BStatus,
  searchFlightsB2B,
  searchHotelsB2B,
  createBookingB2B,
  getAdminB2BPartners,
  createAdminB2BPartner,
  updateAdminB2BPartner,
  regenerateAdminB2BKey,
  deleteAdminB2BPartner,
  updateAdminB2BSettings,
} from '../controllers/b2b.controller.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// ==========================================
// 1. Programmatic B2B Endpoints (API Key)
// Supports both /status and /v1/status
// ==========================================
router.get(['/status', '/v1/status'], authenticateB2BKey, getB2BStatus);
router.get(['/flights/search', '/v1/flights/search'], authenticateB2BKey, searchFlightsB2B);
router.get(['/hotels/search', '/v1/hotels/search'], authenticateB2BKey, searchHotelsB2B);
router.post(['/bookings/create', '/v1/bookings/create'], authenticateB2BKey, createBookingB2B);

// ==========================================
// 2. Admin Management Endpoints (JWT Admin)
// ==========================================
router.get('/admin/partners', authenticate, authorizeAdmin, getAdminB2BPartners);
router.post('/admin/partners', authenticate, authorizeAdmin, createAdminB2BPartner);
router.patch('/admin/partners/:id', authenticate, authorizeAdmin, updateAdminB2BPartner);
router.post('/admin/partners/:id/regenerate-key', authenticate, authorizeAdmin, regenerateAdminB2BKey);
router.delete('/admin/partners/:id', authenticate, authorizeAdmin, deleteAdminB2BPartner);
router.patch('/admin/settings', authenticate, authorizeAdmin, updateAdminB2BSettings);

export default router;
