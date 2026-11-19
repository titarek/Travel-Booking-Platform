import rateLimit from 'express-rate-limit';

/**
 * Authentication rate limiter:
 * High allowance (1,000 attempts per 15 minutes) with skipSuccessfulRequests.
 * Prevents legitimate administrators and travelers from being locked out during login or testing.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 5000 : 1000,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in a few moments.',
  },
});

/**
 * General rate limiter for public routes:
 * Generous production ceiling (15,000 requests per 15 minutes) to easily accommodate
 * real-time SSE streaming, continuous background synchronization, flight radar updates, and fast page navigation.
 * Bypasses internal sync, admin routes, auth endpoints, and keep-alive health checks.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 25000 : 15000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const url = req.originalUrl || req.url || '';
    if (
      url.includes('/health')
      || url.includes('/auth') // Let authLimiter manage auth endpoints independently
      || url.includes('/admin') // Admin dashboard operations are exempt from public throttles
      || url.includes('/manual-deposits') // Background polling bypass
      || url.includes('/stream') // SSE live streams bypass
      || req.headers.accept?.includes('text/event-stream')
      || req.method === 'OPTIONS'
    ) {
      return true;
    }
    return false;
  },
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again in a few moments.',
  },
});
