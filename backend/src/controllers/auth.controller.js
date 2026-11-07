import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';
import { generateToken } from '../utils/jwt.js';
import { memoryStore } from '../utils/memoryStore.js';
import { isDbConnected, query } from '../config/db.js';

/**
 * Register a new customer
 * Hashes password with bcrypt cost 12
 * Assigns role CUSTOMER
 * Never returns passwordHash
 */
export const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      securityQuestion,
      securityAnswer,
    } = req.body;

    const normalizedEmail = (email || '').toLowerCase().trim();

    let securityAnswerHash = '';
    if (securityAnswer) {
      securityAnswerHash = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 12);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const id = `usr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // 1. PostgreSQL Persistent Storage
    if (isDbConnected()) {
      const existingUser = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }

      const insertRes = await query(
        `INSERT INTO users (id, name, email, password_hash, role, phone, security_question, security_answer_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, name, email, role, phone, created_at`,
        [
          id,
          name,
          normalizedEmail,
          passwordHash,
          'CUSTOMER',
          phone || '',
          securityQuestion || '',
          securityAnswerHash,
        ],
      );

      const createdUser = insertRes.rows[0];
      const token = generateToken(createdUser);

      return res.status(201).json({
        success: true,
        message: 'Account successfully created.',
        token,
        user: {
          id: createdUser.id,
          _id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          phone: createdUser.phone,
          role: 'CUSTOMER',
        },
      });
    }

    // 2. MongoDB Fallback
    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }

      const user = await User.create({
        name,
        email: normalizedEmail,
        passwordHash,
        phone: phone || '',
        role: 'CUSTOMER',
        securityQuestion: securityQuestion || '',
        securityAnswerHash,
      });

      const token = generateToken(user);

      return res.status(201).json({
        success: true,
        message: 'Account successfully created.',
        token,
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: 'CUSTOMER',
        },
      });
    }

    // 3. Resilient In-Memory Fallback
    const existing = memoryStore.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const newUser = {
      _id: id,
      id,
      name,
      email: normalizedEmail,
      passwordHash,
      phone: phone || '',
      role: 'CUSTOMER',
      securityQuestion: securityQuestion || '',
      securityAnswerHash,
      createdAt: new Date(),
    };
    memoryStore.users.push(newUser);

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account successfully created.',
      token,
      user: {
        id: newUser.id,
        _id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: 'CUSTOMER',
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Login user with email & password
 * Signs JWT token with { id, email, role }
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    let user = null;
    let passwordHash = null;

    // 1. PostgreSQL Persistent Lookup
    if (isDbConnected()) {
      const result = await query(
        `SELECT id, name, email, password_hash, role, phone, security_question, created_at
         FROM users WHERE LOWER(email) = LOWER($1)`,
        [normalizedEmail],
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        passwordHash = row.password_hash;
        user = {
          id: row.id,
          _id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          role: (row.role || 'CUSTOMER').toUpperCase(),
          createdAt: row.created_at,
        };
      }
    } else if (mongoose.connection.readyState === 1) {
      // 2. MongoDB Lookup
      const mongoUser = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
      if (mongoUser) {
        passwordHash = mongoUser.passwordHash;
        user = {
          id: mongoUser._id.toString(),
          _id: mongoUser._id.toString(),
          name: mongoUser.name,
          email: mongoUser.email,
          phone: mongoUser.phone,
          role: (mongoUser.role || 'CUSTOMER').toUpperCase(),
        };
      }
    } else {
      // 3. MemoryStore Lookup
      const memUser = memoryStore.users.find(
        (u) => u.email.toLowerCase() === normalizedEmail,
      );
      if (memUser) {
        passwordHash = memUser.passwordHash;
        user = {
          id: memUser.id || memUser._id.toString(),
          _id: memUser.id || memUser._id.toString(),
          name: memUser.name,
          email: memUser.email,
          phone: memUser.phone,
          role: (memUser.role || 'CUSTOMER').toUpperCase(),
        };
      }
    }

    if (!user || !passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get current authenticated user profile
 */
export const getMe = async (req, res) => {
  const role = (req.user.role || 'CUSTOMER').toUpperCase();
  res.status(200).json({
    success: true,
    user: {
      id: req.user.id || req.user._id,
      _id: req.user.id || req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role,
      createdAt: req.user.createdAt || req.user.created_at,
    },
  });
};

/**
 * Get user's registered security question for password recovery
 */
export const getSecurityQuestion = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let securityQuestion = null;

    if (isDbConnected()) {
      const resPg = await query('SELECT security_question FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
      if (resPg.rows.length > 0) {
        securityQuestion = resPg.rows[0].security_question;
      }
    } else if (mongoose.connection.readyState === 1) {
      const u = await User.findOne({ email: normalizedEmail });
      securityQuestion = u?.securityQuestion;
    } else {
      const u = memoryStore.users.find((mem) => mem.email.toLowerCase() === normalizedEmail);
      securityQuestion = u?.securityQuestion;
    }

    if (securityQuestion === undefined || securityQuestion === null) {
      return res.status(404).json({
        success: false,
        message: 'No registered account found with this email address.',
      });
    }

    if (!securityQuestion) {
      return res.status(400).json({
        success: false,
        message: 'No security question is configured for this account. Please contact support.',
      });
    }

    return res.status(200).json({
      success: true,
      email: normalizedEmail,
      securityQuestion,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Verify security answer and reset user password
 */
export const resetPasswordWithSecurityAnswer = async (req, res, next) => {
  try {
    const { email, securityAnswer, newPassword } = req.body;

    if (!email || !securityAnswer || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, security answer, and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let securityAnswerHash = null;

    if (isDbConnected()) {
      const resPg = await query(
        'SELECT id, security_answer_hash FROM users WHERE LOWER(email) = LOWER($1)',
        [normalizedEmail],
      );
      if (resPg.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'No account found with this email address.' });
      }
      securityAnswerHash = resPg.rows[0].security_answer_hash;
    } else if (mongoose.connection.readyState === 1) {
      const u = await User.findOne({ email: normalizedEmail }).select('+passwordHash +securityAnswerHash');
      if (!u) {
        return res.status(404).json({ success: false, message: 'No account found with this email address.' });
      }
      securityAnswerHash = u.securityAnswerHash;
    } else {
      const u = memoryStore.users.find((mem) => mem.email.toLowerCase() === normalizedEmail);
      if (!u) {
        return res.status(404).json({ success: false, message: 'No account found with this email address.' });
      }
      securityAnswerHash = u.securityAnswerHash;
    }

    if (!securityAnswerHash) {
      return res.status(400).json({
        success: false,
        message: 'No security question answer is recorded for this account.',
      });
    }

    const cleanAnswer = securityAnswer.toLowerCase().trim();
    const isAnswerMatch = await bcrypt.compare(cleanAnswer, securityAnswerHash);

    if (!isAnswerMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect answer to security question. Please check and try again.',
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    if (isDbConnected()) {
      await query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE LOWER(email) = LOWER($2)',
        [newPasswordHash, normalizedEmail],
      );
    } else if (mongoose.connection.readyState === 1) {
      await User.updateOne({ email: normalizedEmail }, { passwordHash: newPasswordHash });
    } else {
      const u = memoryStore.users.find((mem) => mem.email.toLowerCase() === normalizedEmail);
      if (u) u.passwordHash = newPasswordHash;
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now sign in with your new password.',
    });
  } catch (error) {
    return next(error);
  }
};
