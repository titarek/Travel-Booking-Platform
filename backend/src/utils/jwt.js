import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Generate a signed JWT token containing strictly { id, email }
 * @param {Object} user - User document
 * @returns {string} Signed JWT
 */
export const generateToken = (user) => {
  const payload = {
    id: user._id.toString(),
    email: user.email,
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
