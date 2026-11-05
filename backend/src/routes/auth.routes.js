import { Router } from 'express';
import { z } from 'zod';
import {
  register,
  login,
  getMe,
  getSecurityQuestion,
  resetPasswordWithSecurityAnswer,
} from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// Apply auth rate limiter to all auth routes
router.use(authLimiter);

const registerSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(80),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100),
    phone: z.string().max(25).optional(),
    securityQuestion: z.string().max(255).optional(),
    securityAnswer: z.string().max(255).optional(),
  }).strict(),
};

const loginSchema = {
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }).strict(),
};

const forgotQuestionSchema = {
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
  }).strict(),
};

const forgotResetSchema = {
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    securityAnswer: z.string().min(1, 'Security answer is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100),
  }).strict(),
};

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/forgot-password/question', validate(forgotQuestionSchema), getSecurityQuestion);
router.post('/forgot-password/reset', validate(forgotResetSchema), resetPasswordWithSecurityAnswer);
router.get('/me', authenticate, getMe);

export default router;
