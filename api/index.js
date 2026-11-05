import app from '../backend/src/app.js';
import { connectDB } from '../backend/src/config/db.js';

/**
 * Vercel Serverless Function Handler
 * Wraps the Express application and manages database connection caching
 */
export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection error in serverless handler:', err);
  }
  return app(req, res);
}

