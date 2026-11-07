import mongoose from 'mongoose';
import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/user.model.js';
import { memoryStore } from '../utils/memoryStore.js';
import { isDbConnected, query } from '../config/db.js';

/**
 * Authentication middleware
 * Verifies JWT and attaches req.user via fresh DB / PostgreSQL lookup
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

    // Lookup user in PostgreSQL, MongoDB, or resilient MemoryStore
    let user = null;
    if (isDbConnected()) {
      const result = await query(
        'SELECT id, name, email, role, phone, created_at, updated_at FROM users WHERE id = $1',
        [decoded.id],
      );
      if (result.rows.length > 0) {
        const row = result.rows[0];
        user = {
          ...row,
          _id: row.id,
          role: (row.role || 'CUSTOMER').toUpperCase(),
        };
      }
    } else if (mongoose.connection.readyState === 1) {
      const mongoUser = await User.findById(decoded.id).select('-passwordHash');
      if (mongoUser) {
        user = mongoUser.toObject();
        user.role = (user.role || 'CUSTOMER').toUpperCase();
      }
    } else {
      const memUser = memoryStore.users.find(
        (u) => u.id === decoded.id || u._id?.toString() === decoded.id,
      );
      if (memUser) {
        user = { ...memUser, role: (memUser.role || 'CUSTOMER').toUpperCase() };
      }
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
 * Strictly verifies role is 'ADMIN'
 */
export const authorizeAdmin = (req, res, next) => {
  const role = (req.user?.role || '').toUpperCase();
  if (!req.user || role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.',
    });
  }
  return next();
};
