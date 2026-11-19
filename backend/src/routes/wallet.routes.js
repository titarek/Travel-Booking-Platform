import { Router } from 'express';
import { z } from 'zod';
import {
  getWallet,
  topUpWallet,
  submitManualDeposit,
  getAdminManualDeposits,
  approveManualDeposit,
  rejectManualDeposit,
} from '../controllers/wallet.controller.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.use(authenticate);

const topUpSchema = {
  body: z.object({
    amount: z.number().positive('Top-up amount must be greater than zero'),
    paymentMethod: z.string().optional().default('Credit/Debit Card'),
  }).strict(),
};

const manualDepositSchema = {
  body: z.object({
    amount: z.number().positive('Deposit amount must be greater than zero'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    transactionId: z.string().min(1, 'Transaction ID is required'),
    senderAccount: z.string().min(1, 'Sender account / phone is required'),
    notes: z.string().optional().default(''),
  }),
};

// Customer wallet endpoints
router.get('/', getWallet);
router.post('/topup', validate(topUpSchema), topUpWallet);
router.post('/manual-deposit', validate(manualDepositSchema), submitManualDeposit);

// Admin concierge verification endpoints
router.get('/admin/manual-deposits', authorizeAdmin, getAdminManualDeposits);
router.patch('/admin/manual-deposits/:id/approve', authorizeAdmin, approveManualDeposit);
router.patch('/admin/manual-deposits/:id/reject', authorizeAdmin, rejectManualDeposit);

export default router;
