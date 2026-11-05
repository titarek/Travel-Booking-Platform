import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';
import { generateToken } from '../utils/jwt.js';
import { memoryStore } from '../utils/memoryStore.js';

/**
 * Register a new user
 * Hashes password with bcrypt cost 12
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

    const isDbConnected = mongoose.connection.readyState === 1;

    let securityAnswerHash = '';
    if (securityAnswer) {
      securityAnswerHash = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 12);
    }

    if (isDbConnected) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }

      // Hash password with explicit cost 12
      const passwordHash = await bcrypt.hash(password, 12);

      const user = await User.create({
        name,
        email,
        passwordHash,
        phone: phone || '',
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
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });
    }

    // Memory store fallback
    const existing = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = {
      _id: `64a1b2c3d4e5f6789012${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      email,
      passwordHash,
      phone: phone || '',
      role: 'user',
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
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Login user with email & password
 * Signs JWT token with { id, email }
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const isDbConnected = mongoose.connection.readyState === 1;

    let user;
    if (isDbConnected) {
      user = await User.findOne({ email }).select('+passwordHash');
    } else {
      user = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
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
        id: user._id,
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
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      createdAt: req.user.createdAt,
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

    const isDbConnected = mongoose.connection.readyState === 1;
    let user;
    if (isDbConnected) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    } else {
      user = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered account found with this email address.',
      });
    }

    if (!user.securityQuestion) {
      return res.status(400).json({
        success: false,
        message: 'No security question is configured for this account. Please contact support.',
      });
    }

    return res.status(200).json({
      success: true,
      email: user.email,
      securityQuestion: user.securityQuestion,
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

    const isDbConnected = mongoose.connection.readyState === 1;
    let user;

    if (isDbConnected) {
      user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash +securityAnswerHash');
    } else {
      user = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.',
      });
    }

    if (!user.securityAnswerHash) {
      return res.status(400).json({
        success: false,
        message: 'No security question answer is recorded for this account.',
      });
    }

    const cleanAnswer = securityAnswer.toLowerCase().trim();
    const isAnswerMatch = await bcrypt.compare(cleanAnswer, user.securityAnswerHash);

    if (!isAnswerMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect answer to security question. Please check and try again.',
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    user.passwordHash = newPasswordHash;

    if (isDbConnected) {
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now sign in with your new password.',
    });
  } catch (error) {
    return next(error);
  }
};
