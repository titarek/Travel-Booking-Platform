import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { WalletTransaction } from '../models/walletTransaction.model.js';
import { ManualDeposit } from '../models/manualDeposit.model.js';
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

/**
 * Submit an offline/manual payment record for concierge verification and wallet crediting
 */
export const submitManualDeposit = async (req, res, next) => {
  try {
    const userId = (req.user.id || req.user._id || '').toString();
    const userName = req.user.name || 'Customer';
    const userEmail = req.user.email || '';
    const { amount, paymentMethod, transactionId, senderAccount, notes = '' } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || Number.isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid deposit amount greater than 0 is required.',
      });
    }

    if (!transactionId || !transactionId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID / Reference Number is required for verification.',
      });
    }

    if (!senderAccount || !senderAccount.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Sender Account or Phone Number is required.',
      });
    }

    const depositId = `mdep-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const depositRecord = {
      _id: depositId,
      id: depositId,
      userId,
      userName,
      userEmail,
      amount: numAmount,
      paymentMethod: paymentMethod || 'bKash / MFS',
      transactionId: transactionId.trim(),
      senderAccount: senderAccount.trim(),
      notes: notes.trim(),
      status: 'PENDING',
      approvedBy: null,
      approvedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. PostgreSQL
    if (isDbConnected()) {
      try {
        await query(
          `INSERT INTO manual_deposits (id, user_id, user_name, user_email, amount, payment_method, transaction_id, sender_account, notes, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            depositId,
            userId,
            userName,
            userEmail,
            numAmount,
            depositRecord.paymentMethod,
            depositRecord.transactionId,
            depositRecord.senderAccount,
            depositRecord.notes,
            'PENDING',
          ],
        );
      } catch (err) {
        console.warn(`[submitManualDeposit] PostgreSQL insert notice: ${err.message}`);
      }
    }

    // 2. MongoDB
    if (mongoose.connection.readyState === 1) {
      try {
        await ManualDeposit.create({
          userId,
          userName,
          userEmail,
          amount: numAmount,
          paymentMethod: depositRecord.paymentMethod,
          transactionId: depositRecord.transactionId,
          senderAccount: depositRecord.senderAccount,
          notes: depositRecord.notes,
          status: 'PENDING',
        });
      } catch (err) {
        console.warn(`[submitManualDeposit] MongoDB insert notice: ${err.message}`);
      }
    }

    // 3. MemoryStore Fallback
    if (!memoryStore.manualDeposits) {
      memoryStore.manualDeposits = [];
    }
    memoryStore.manualDeposits.unshift(depositRecord);

    return res.status(201).json({
      success: true,
      message: 'Deposit slip submitted successfully! Our support team will verify and credit your wallet shortly.',
      data: depositRecord,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * ADMIN: Get all manual deposit verification requests
 */
export const getAdminManualDeposits = async (req, res, next) => {
  try {
    // 1. PostgreSQL
    if (isDbConnected()) {
      try {
        const result = await query(
          'SELECT * FROM manual_deposits ORDER BY created_at DESC LIMIT 100',
        );
        const deposits = result.rows.map((row) => ({
          _id: row.id,
          id: row.id,
          userId: row.user_id,
          userName: row.user_name,
          userEmail: row.user_email,
          amount: Number(row.amount),
          paymentMethod: row.payment_method,
          transactionId: row.transaction_id,
          senderAccount: row.sender_account,
          notes: row.notes,
          status: row.status,
          approvedBy: row.approved_by,
          approvedAt: row.approved_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
        return res.status(200).json({ success: true, count: deposits.length, data: deposits });
      } catch (err) {
        console.warn(`[getAdminManualDeposits] PostgreSQL fetch notice: ${err.message}`);
      }
    }

    // 2. MongoDB
    if (mongoose.connection.readyState === 1) {
      const deposits = await ManualDeposit.find().sort({ createdAt: -1 }).limit(100);
      return res.status(200).json({ success: true, count: deposits.length, data: deposits });
    }

    // 3. MemoryStore
    const deposits = (memoryStore.manualDeposits || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    return res.status(200).json({ success: true, count: deposits.length, data: deposits });
  } catch (error) {
    return next(error);
  }
};

/**
 * ADMIN: Approve manual deposit & automatically credit user's wallet
 */
export const approveManualDeposit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user?.email || 'admin@travel.test';
    const nowIso = new Date().toISOString();

    // 1. PostgreSQL
    if (isDbConnected()) {
      try {
        const findRes = await query('SELECT * FROM manual_deposits WHERE id = $1', [id]);
        if (findRes.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Deposit record not found.' });
        }
        const deposit = findRes.rows[0];
        if (deposit.status !== 'PENDING') {
          return res.status(400).json({ success: false, message: `Deposit is already marked as ${deposit.status}.` });
        }

        const depositAmount = Number(deposit.amount);
        const targetUserId = deposit.user_id;

        // Credit user wallet
        const userRes = await query('SELECT wallet_balance FROM users WHERE id = $1', [targetUserId]);
        const balanceBefore = userRes.rows.length > 0 ? Number(userRes.rows[0].wallet_balance || 0) : 1000;
        const balanceAfter = balanceBefore + depositAmount;

        await query('UPDATE users SET wallet_balance = $1, updated_at = NOW() WHERE id = $2', [balanceAfter, targetUserId]);

        // Insert wallet transaction
        const txId = `wtx-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
        await query(
          `INSERT INTO wallet_transactions (id, user_id, type, amount, balance_before, balance_after, payment_method, reference_id, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            txId,
            targetUserId,
            'TOPUP',
            depositAmount,
            balanceBefore,
            balanceAfter,
            `${deposit.payment_method} (Concierge Verified)`,
            deposit.transaction_id,
            `Manual top-up approved by admin (${deposit.transaction_id})`,
          ],
        );

        // Update deposit status
        await query(
          'UPDATE manual_deposits SET status = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW() WHERE id = $3',
          ['APPROVED', adminEmail, id],
        );

        return res.status(200).json({
          success: true,
          message: `Deposit of $${depositAmount.toFixed(2)} approved and credited to customer wallet!`,
          data: {
            depositId: id,
            status: 'APPROVED',
            balanceAfter,
          },
        });
      } catch (err) {
        console.warn(`[approveManualDeposit] PostgreSQL notice: ${err.message}`);
      }
    }

    // 2. MongoDB
    if (mongoose.connection.readyState === 1) {
      const deposit = await ManualDeposit.findById(id);
      if (!deposit) {
        return res.status(404).json({ success: false, message: 'Deposit record not found.' });
      }
      if (deposit.status !== 'PENDING') {
        return res.status(400).json({ success: false, message: `Deposit is already ${deposit.status}.` });
      }

      deposit.status = 'APPROVED';
      deposit.approvedBy = adminEmail;
      deposit.approvedAt = new Date();
      await deposit.save();

      const mongoUser = await User.findById(deposit.userId);
      const balanceBefore = mongoUser ? Number(mongoUser.walletBalance || 0) : 1000;
      const balanceAfter = balanceBefore + deposit.amount;

      if (mongoUser) {
        mongoUser.walletBalance = balanceAfter;
        await mongoUser.save();
      }

      await WalletTransaction.create({
        userId: deposit.userId,
        type: 'TOPUP',
        amount: deposit.amount,
        balanceBefore,
        balanceAfter,
        paymentMethod: `${deposit.paymentMethod} (Concierge Verified)`,
        referenceId: deposit.transactionId,
        description: `Manual top-up approved by admin (${deposit.transactionId})`,
      });

      return res.status(200).json({
        success: true,
        message: `Deposit of $${deposit.amount.toFixed(2)} approved and credited to customer wallet!`,
        data: deposit,
      });
    }

    // 3. MemoryStore
    const deposit = (memoryStore.manualDeposits || []).find(
      (d) => (d.id || d._id || '').toString() === id.toString(),
    );
    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit record not found.' });
    }
    if (deposit.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Deposit is already ${deposit.status}.` });
    }

    deposit.status = 'APPROVED';
    deposit.approvedBy = adminEmail;
    deposit.approvedAt = nowIso;
    deposit.updatedAt = nowIso;

    const memUser = memoryStore.users.find(
      (u) => (u.id || u._id || '').toString() === deposit.userId.toString(),
    );
    const balanceBefore = memUser ? Number(memUser.walletBalance ?? 1000) : 1000;
    const balanceAfter = balanceBefore + deposit.amount;

    if (memUser) {
      memUser.walletBalance = balanceAfter;
    }

    const txId = `wtx-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const tx = {
      _id: txId,
      id: txId,
      userId: deposit.userId,
      type: 'TOPUP',
      amount: deposit.amount,
      balanceBefore,
      balanceAfter,
      paymentMethod: `${deposit.paymentMethod} (Concierge Verified)`,
      referenceId: deposit.transactionId,
      description: `Manual top-up approved by admin (${deposit.transactionId})`,
      createdAt: new Date(),
    };
    if (!memoryStore.walletTransactions) memoryStore.walletTransactions = [];
    memoryStore.walletTransactions.unshift(tx);

    return res.status(200).json({
      success: true,
      message: `Deposit of $${deposit.amount.toFixed(2)} approved and credited to customer wallet!`,
      data: deposit,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * ADMIN: Reject manual deposit request
 */
export const rejectManualDeposit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user?.email || 'admin@travel.test';
    const nowIso = new Date().toISOString();

    // 1. PostgreSQL
    if (isDbConnected()) {
      try {
        const findRes = await query('SELECT * FROM manual_deposits WHERE id = $1', [id]);
        if (findRes.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Deposit record not found.' });
        }
        await query(
          'UPDATE manual_deposits SET status = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW() WHERE id = $3',
          ['REJECTED', adminEmail, id],
        );
        return res.status(200).json({
          success: true,
          message: 'Deposit request has been marked as REJECTED.',
          data: { depositId: id, status: 'REJECTED' },
        });
      } catch (err) {
        console.warn(`[rejectManualDeposit] PostgreSQL notice: ${err.message}`);
      }
    }

    // 2. MongoDB
    if (mongoose.connection.readyState === 1) {
      const deposit = await ManualDeposit.findById(id);
      if (!deposit) {
        return res.status(404).json({ success: false, message: 'Deposit record not found.' });
      }
      deposit.status = 'REJECTED';
      deposit.approvedBy = adminEmail;
      deposit.approvedAt = new Date();
      await deposit.save();
      return res.status(200).json({
        success: true,
        message: 'Deposit request has been marked as REJECTED.',
        data: deposit,
      });
    }

    // 3. MemoryStore
    const deposit = (memoryStore.manualDeposits || []).find(
      (d) => (d.id || d._id || '').toString() === id.toString(),
    );
    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit record not found.' });
    }
    deposit.status = 'REJECTED';
    deposit.approvedBy = adminEmail;
    deposit.approvedAt = nowIso;
    deposit.updatedAt = nowIso;

    return res.status(200).json({
      success: true,
      message: 'Deposit request has been marked as REJECTED.',
      data: deposit,
    });
  } catch (error) {
    return next(error);
  }
};
