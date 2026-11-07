import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Generate a signed JWT token containing { id, email, role }
 * @param {Object} user - User document or row
 * @returns {string} Signed JWT
 */
export const generateToken = (user) => {
  const payload = {
    id: (user.id || user._id || '').toString(),
    email: user.email,
    role: (user.role || 'CUSTOMER').toUpperCase(),
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * Verify a JWT token
 * @param {string} token
 * @returns {Object} Decoded payload
 */
export const verifyToken = (token) => jwt.verify(token, env.JWT_SECRET);
