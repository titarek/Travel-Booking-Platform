import { Router } from 'express';
import { z } from 'zod';
import { getWallet, topUpWallet } from '../controllers/wallet.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.use(authenticate);

const topUpSchema = {
  body: z.object({
    amount: z.number().positive('Top-up amount must be greater than zero'),
    paymentMethod: z.string().optional().default('Credit/Debit Card'),
  }).strict(),
};

router.get('/', getWallet);
router.post('/topup', validate(topUpSchema), topUpWallet);

export default router;
