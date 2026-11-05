import mongoose from 'mongoose';
import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/user.model.js';
import { memoryStore } from '../utils/memoryStore.js';

/**
 * Authentication middleware
 * Verifies JWT and attaches req.user via fresh DB lookup
 */
export const authenticate = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      [, token] = authHeader.split(' ');
    } else if (req.query?.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token.',
      });
    }

    // Fresh DB lookup
    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.findById(decoded.id).select('-passwordHash');
    } else {
      user = memoryStore.users.find((u) => u._id.toString() === decoded.id);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Authorization middleware for administrative privileges
 */
export const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.',
    });
  }
  return next();
};
