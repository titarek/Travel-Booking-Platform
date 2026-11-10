import { Router } from 'express';
import { getPublicOffers } from '../controllers/offer.controller.js';

const router = Router();

// Public route to fetch offers for homepage & promotions
router.get('/', getPublicOffers);

export default router;
