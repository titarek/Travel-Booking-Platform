import { env } from '../config/env.js';

/**
 * 404 Route Not Found Handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found at ${req.originalUrl}`,
  });
};

/**
 * Central Error Handler Middleware
 * In production, returns generic safe messages and never leaks stack traces or raw DB errors
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  // Safe logging in dev / console
  if (env.NODE_ENV !== 'production') {
    console.error('Error caught by errorHandler:', err);
  }

  // Handle specific known error types safely
  if (err.name === 'CastError') {
    return res.status(404).json({
      success: false,
      message: 'Requested item not found or invalid identifier.',
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate key error. An entry with that value already exists.',
    });
  }

  const isProduction = env.NODE_ENV === 'production';

  return res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode === 500
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Server error',
    ...(isProduction ? {} : { stack: err.stack }),
  });
};
