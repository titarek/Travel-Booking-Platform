import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const currentFilename = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilename);

dotenv.config();
dotenv.config({ path: path.resolve(currentDir, '../../.env') });

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  PGHOST: process.env.PGHOST || '',
  PGUSER: process.env.PGUSER || '',
  PGPASSWORD: process.env.PGPASSWORD || '',
  PGDATABASE: process.env.PGDATABASE || '',
  PGPORT: process.env.PGPORT || 5432,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travel_db',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secure_travel_jwt_secret_key_change_in_production_9988',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'https://travel-booking-platform-u2vi.vercel.app',
  ADMIN_ORIGIN: process.env.ADMIN_ORIGIN || 'http://localhost:5174',
  AMADEUS_CLIENT_ID: process.env.AMADEUS_CLIENT_ID || '',
  AMADEUS_CLIENT_SECRET: process.env.AMADEUS_CLIENT_SECRET || '',
  AVIATIONSTACK_KEY: process.env.AVIATIONSTACK_KEY || '',
  EXCHANGE_RATE_API_KEY: process.env.EXCHANGE_RATE_API_KEY || '',
  UNSPLASH_API_KEY: process.env.UNSPLASH_API_KEY || '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_51MzTravelBookingGatewayLiveTestKey8821',
  GEOAPIFY_API_KEY: process.env.GEOAPIFY_API_KEY || '7ce40ffb71cf4ca59ea23cc96d69bb67',
};
