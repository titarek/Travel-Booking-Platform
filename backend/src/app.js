import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env.js';
import { generalLimiter } from './middleware/rateLimiter.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

import authRoutes from './routes/auth.routes.js';
import flightRoutes from './routes/flight.routes.js';
import hotelRoutes from './routes/hotel.routes.js';
import packageRoutes from './routes/package.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import externalRoutes from './routes/external.routes.js';
import adminRoutes from './routes/admin.routes.js';
import offerRoutes from './routes/offer.routes.js';

const app = express();

// Security headers for web protection
app.use(helmet());

// Cross-Origin Resource Sharing (CORS) configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  env.CLIENT_ORIGIN,
  env.ADMIN_ORIGIN,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin)
      || process.env.NODE_ENV === 'development'
      || origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Body parsing with safe payload limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Sanitize query and body inputs against NoSQL injection
app.use(mongoSanitize());

// Lightweight health check endpoint for keep-alive monitoring & Render cold start prevention
// Requires no authentication, minimal processing, returns 200 OK instantly
const healthCheckHandler = (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', healthCheckHandler);
app.head('/health', (req, res) => res.status(200).end());
app.get('/api/health', healthCheckHandler);
app.head('/api/health', (req, res) => res.status(200).end());

// Global rate limiting to guard public endpoints (bypassed by /health)
app.use('/api', generalLimiter);

// Primary application API routes
app.use('/api/auth', authRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/external', externalRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler for unknown endpoints
app.use(notFoundHandler);

// Centralized application error handling middleware
app.use(errorHandler);

export default app;
