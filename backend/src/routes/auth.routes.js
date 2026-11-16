import { Router } from 'express';
import { z } from 'zod';
import {
  register,
  login,
  getMe,
  getSecurityQuestion,
  resetPasswordWithSecurityAnswer,
  updateProfile,
  changeEmail,
  changePassword,
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

const updateProfileSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(80).optional(),
    phone: z.string().max(25).optional(),
    securityQuestion: z.string().max(255).optional(),
    securityAnswer: z.string().max(255).optional(),
  }).strict(),
};

const changeEmailSchema = {
  body: z.object({
    newEmail: z.string().email('Please provide a valid new email address'),
    currentPassword: z.string().min(1, 'Current password is required for verification'),
  }).strict(),
};

const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100),
  }).strict(),
};

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/forgot-password/question', validate(forgotQuestionSchema), getSecurityQuestion);
router.post('/forgot-password/reset', validate(forgotResetSchema), resetPasswordWithSecurityAnswer);
router.get('/me', authenticate, getMe);

// Authenticated Account & Profile Management
router.patch('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.patch('/change-email', authenticate, validate(changeEmailSchema), changeEmail);
router.patch('/change-password', authenticate, validate(changePasswordSchema), changePassword);

export default router;
