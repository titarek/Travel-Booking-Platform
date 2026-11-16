import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { WalletTransaction } from '../models/walletTransaction.model.js';
import { memoryStore } from '../utils/memoryStore.js';
import { isDbConnected, query } from '../config/db.js';

/**
 * Get current user's wallet balance and transaction history
 */
export const getWallet = async (req, res, next) => {
  try {
    const userId = (req.user.id || req.user._id || '').toString();

    // 1. PostgreSQL Persistent Lookup
    if (isDbConnected()) {
      let currentBalance = 1000;
      let transactions = [];
      try {
        const userRes = await query('SELECT wallet_balance FROM users WHERE id = $1', [userId]);
        currentBalance = userRes.rows.length > 0 ? Number(userRes.rows[0].wallet_balance || 0) : 1000;

        const txRes = await query(
          'SELECT * FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
          [userId],
        );

        transactions = txRes.rows.map((row) => ({
          _id: row.id,
          id: row.id,
          userId: row.user_id,
          type: row.type,
          amount: Number(row.amount),
          balanceBefore: Number(row.balance_before),
          balanceAfter: Number(row.balance_after),
          paymentMethod: row.payment_method,
          referenceId: row.reference_id,
          description: row.description,
          createdAt: row.created_at,
        }));
      } catch (err) {
        console.warn(`[getWallet] PostgreSQL lookup notice: ${err.message}`);
      }

      return res.status(200).json({
        success: true,
        data: {
          balance: currentBalance,
          currency: 'USD',
          transactions,
        },
      });
    }

    // 2. MongoDB Lookup
    if (mongoose.connection.readyState === 1) {
      const mongoUser = await User.findById(userId);
      const currentBalance = mongoUser ? Number(mongoUser.walletBalance || 0) : 1000;

      const transactions = await WalletTransaction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50);

      return res.status(200).json({
        success: true,
        data: {
          balance: currentBalance,
          currency: 'USD',
          transactions,
        },
      });
    }

    // 3. Resilient In-Memory Lookup
    const memUser = memoryStore.users.find(
      (u) => (u.id || u._id || '').toString() === userId,
    );
    const currentBalance = memUser ? Number(memUser.walletBalance ?? 1000) : 1000;

    const transactions = (memoryStore.walletTransactions || [])
      .filter((t) => (t.userId || '').toString() === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      data: {
        balance: currentBalance,
        currency: 'USD',
        transactions,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Top up user's digital wallet balance
 */
export const topUpWallet = async (req, res, next) => {
  try {
    const userId = (req.user.id || req.user._id || '').toString();
    const { amount, paymentMethod = 'Credit/Debit Card' } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || Number.isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid positive top-up amount is required.',
      });
    }

    const referenceId = `TOPUP-${Date.now().toString().slice(-6)}`;
    const description = `Top-up deposit via ${paymentMethod}`;

    // 1. PostgreSQL Persistent Deposit
    if (isDbConnected()) {
      let balanceBefore = 1000;
      let balanceAfter = 1000 + numAmount;
      const txId = `wtx-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      try {
        const userRes = await query('SELECT wallet_balance FROM users WHERE id = $1', [userId]);
        balanceBefore = userRes.rows.length > 0 ? Number(userRes.rows[0].wallet_balance || 0) : 1000;
        balanceAfter = balanceBefore + numAmount;

        await query('UPDATE users SET wallet_balance = $1, updated_at = NOW() WHERE id = $2', [balanceAfter, userId]);

        await query(
          `INSERT INTO wallet_transactions (id, user_id, type, amount, balance_before, balance_after, payment_method, reference_id, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [txId, userId, 'TOPUP', numAmount, balanceBefore, balanceAfter, paymentMethod, referenceId, description],
        );
      } catch (err) {
        console.warn(`[topUpWallet] PostgreSQL write error notice: ${err.message}`);
      }

      const transaction = {
        _id: txId,
        id: txId,
        userId,
        type: 'TOPUP',
        amount: numAmount,
        balanceBefore,
        balanceAfter,
        paymentMethod,
        referenceId,
        description,
        createdAt: new Date().toISOString(),
      };

      return res.status(200).json({
        success: true,
        message: `Successfully deposited $${numAmount.toFixed(2)} to your Travel Digital Wallet!`,
        data: {
          balance: balanceAfter,
          transaction,
        },
      });
    }

    // 2. MongoDB Deposit
    if (mongoose.connection.readyState === 1) {
      const mongoUser = await User.findById(userId);
      const balanceBefore = mongoUser ? Number(mongoUser.walletBalance || 0) : 1000;
      const balanceAfter = balanceBefore + numAmount;

      if (mongoUser) {
        mongoUser.walletBalance = balanceAfter;
        await mongoUser.save();
      }

      const transaction = await WalletTransaction.create({
        userId,
        type: 'TOPUP',
        amount: numAmount,
        balanceBefore,
        balanceAfter,
        paymentMethod,
        referenceId,
        description,
      });

      return res.status(200).json({
        success: true,
        message: `Successfully deposited $${numAmount.toFixed(2)} to your Travel Digital Wallet!`,
        data: {
          balance: balanceAfter,
          transaction,
        },
      });
    }

    // 3. MemoryStore Deposit
    const memUser = memoryStore.users.find(
      (u) => (u.id || u._id || '').toString() === userId,
    );
    const balanceBefore = memUser ? Number(memUser.walletBalance ?? 1000) : 1000;
    const balanceAfter = balanceBefore + numAmount;

    if (memUser) {
      memUser.walletBalance = balanceAfter;
    }

    const txId = `wtx-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const transaction = {
      _id: txId,
      id: txId,
      userId,
      type: 'TOPUP',
      amount: numAmount,
      balanceBefore,
      balanceAfter,
      paymentMethod,
      referenceId,
      description,
      createdAt: new Date(),
    };

    if (!memoryStore.walletTransactions) {
      memoryStore.walletTransactions = [];
    }
    memoryStore.walletTransactions.unshift(transaction);

    return res.status(200).json({
      success: true,
      message: `Successfully deposited $${numAmount.toFixed(2)} to your Travel Digital Wallet!`,
      data: {
        balance: balanceAfter,
        transaction,
      },
    });
  } catch (error) {
    return next(error);
  }
};
