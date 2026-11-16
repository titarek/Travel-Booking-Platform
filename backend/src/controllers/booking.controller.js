import mongoose from 'mongoose';
import { Booking } from '../models/booking.model.js';
import { User } from '../models/user.model.js';
import { WalletTransaction } from '../models/walletTransaction.model.js';
import { memoryStore } from '../utils/memoryStore.js';
import { notifyAdminClients } from '../utils/realtime.js';
import { isDbConnected, query } from '../config/db.js';

/**
 * Generate unique PNR reference like TRV-482910
 */
const generatePNR = () => `TRV-${Math.floor(100000 + Math.random() * 900000)}`;

/**
 * Create a new booking
 */
export const createBooking = async (req, res, next) => {
  try {
    const {
      type,
      itemDetails,
      travelers,
      contactInfo,
      totalPrice,
      paymentMethod = 'Travel Digital Wallet',
    } = req.body;
    const bookingReference = generatePNR();
    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const userId = (req.user.id || req.user._id || '').toString();

    // 0. Verify and deduct funds from customer's Travel Digital Wallet
    let currentBalance = 0;
    if (isDbConnected()) {
      const uRes = await query('SELECT wallet_balance FROM users WHERE id = $1', [userId]);
      currentBalance = uRes.rows.length > 0 ? Number(uRes.rows[0].wallet_balance || 0) : 1000;
    } else if (mongoose.connection.readyState === 1) {
      const uDoc = await User.findById(userId);
      currentBalance = uDoc ? Number(uDoc.walletBalance || 0) : 1000;
    } else {
      const uMem = memoryStore.users.find((u) => (u.id || u._id || '').toString() === userId);
      currentBalance = uMem ? Number(uMem.walletBalance ?? 1000) : 1000;
    }

    if (currentBalance < totalPrice) {
      return res.status(400).json({
        success: false,
        code: 'INSUFFICIENT_WALLET_BALANCE',
        message: `Insufficient wallet balance ($${currentBalance.toFixed(2)} available, $${totalPrice.toFixed(2)} required). Please top up your wallet to complete this reservation.`,
        availableBalance: currentBalance,
        requiredAmount: totalPrice,
      });
    }

    const newBalance = currentBalance - totalPrice;
    const debitDescription = `Payment for ${type.toUpperCase()} reservation (${bookingReference})`;

    const payment = {
      method: paymentMethod || 'Travel Digital Wallet',
      transactionId,
      status: 'PAID',
      paidAt: new Date().toISOString(),
    };

    // 1. PostgreSQL Persistent Storage
    if (isDbConnected()) {
      // Deduct wallet balance
      await query('UPDATE users SET wallet_balance = $1, updated_at = NOW() WHERE id = $2', [newBalance, userId]);
      const txId = `wtx-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      await query(
        `INSERT INTO wallet_transactions (id, user_id, type, amount, balance_before, balance_after, payment_method, reference_id, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [txId, userId, 'DEBIT_BOOKING', totalPrice, currentBalance, newBalance, payment.method, bookingReference, debitDescription],
      );

      const id = `bk-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const result = await query(
        `INSERT INTO bookings (id, booking_reference, user_id, booking_type, item_details, travelers, contact_info, total_price, currency, status, payment)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          id,
          bookingReference,
          userId,
          type,
          JSON.stringify(itemDetails || {}),
          JSON.stringify(travelers || []),
          JSON.stringify(contactInfo || {}),
          totalPrice,
          'USD',
          'PENDING',
          JSON.stringify(payment),
        ],
      );

      const row = result.rows[0];
      const formattedBooking = {
        _id: row.id,
        id: row.id,
        bookingReference: row.booking_reference,
        type: row.booking_type,
        itemDetails: row.item_details,
        travelers: row.travelers,
        contactInfo: row.contact_info,
        totalPrice: Number(row.total_price),
        currency: row.currency,
        status: row.status,
        paymentStatus: row.payment?.status || 'PAID',
        payment: row.payment,
        walletBalance: newBalance,
        createdAt: row.created_at,
        user: {
          _id: req.user.id || req.user._id,
          id: req.user.id || req.user._id,
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
        },
      };

      notifyAdminClients('booking_created', formattedBooking);

      return res.status(201).json({
        success: true,
        message: 'Booking submitted successfully! Reservation is pending admin confirmation.',
        data: formattedBooking,
      });
    }

    // 2. MongoDB Fallback
    if (mongoose.connection.readyState === 1) {
      await User.findByIdAndUpdate(userId, { walletBalance: newBalance });
      await WalletTransaction.create({
        userId,
        type: 'DEBIT_BOOKING',
        amount: totalPrice,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        paymentMethod: payment.method,
        referenceId: bookingReference,
        description: debitDescription,
      });

      const booking = await Booking.create({
        user: req.user._id,
        bookingReference,
        type,
        itemDetails,
        travelers,
        contactInfo,
        totalPrice,
        status: 'PENDING',
        paymentStatus: 'PAID',
        payment,
      });

      await booking.populate('user', 'name email phone');

      notifyAdminClients('booking_created', booking);

      return res.status(201).json({
        success: true,
        message: 'Booking submitted successfully! Reservation is pending admin confirmation.',
        data: {
          ...booking.toObject(),
          walletBalance: newBalance,
        },
      });
    }

    // 3. Memory fallback
    const memUser = memoryStore.users.find((u) => (u.id || u._id || '').toString() === userId);
    if (memUser) {
      memUser.walletBalance = newBalance;
    }

    const txId = `wtx-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    if (!memoryStore.walletTransactions) {
      memoryStore.walletTransactions = [];
    }
    memoryStore.walletTransactions.unshift({
      _id: txId,
      id: txId,
      userId,
      type: 'DEBIT_BOOKING',
      amount: totalPrice,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      paymentMethod: payment.method,
      referenceId: bookingReference,
      description: debitDescription,
      createdAt: new Date(),
    });

    const newBooking = {
      _id: `bk-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      user: {
        _id: userId,
        id: userId,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
      },
      bookingReference,
      type,
      itemDetails,
      travelers,
      contactInfo,
      totalPrice,
      status: 'PENDING',
      paymentStatus: 'PAID',
      payment,
      walletBalance: newBalance,
      createdAt: new Date(),
    };

    memoryStore.bookings.unshift(newBooking);
    notifyAdminClients('booking_created', newBooking);

    return res.status(201).json({
      success: true,
      message: 'Booking submitted successfully! Reservation is pending admin confirmation.',
      data: newBooking,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all bookings for authenticated user
 */
export const getMyBookings = async (req, res, next) => {
  try {
    const userId = (req.user.id || req.user._id || '').toString();

    // 1. PostgreSQL Persistent Lookup
    if (isDbConnected()) {
      const result = await query(
        `SELECT b.*, u.name as user_name, u.email as user_email, u.phone as user_phone
         FROM bookings b
         LEFT JOIN users u ON b.user_id = u.id
         WHERE b.user_id = $1
         ORDER BY b.created_at DESC`,
        [userId],
      );

      const mappedBookings = result.rows.map((row) => ({
        _id: row.id,
        id: row.id,
        bookingReference: row.booking_reference,
        type: row.booking_type,
        itemDetails: row.item_details,
        travelers: row.travelers,
        contactInfo: row.contact_info,
        totalPrice: Number(row.total_price),
        currency: row.currency,
        status: row.status,
        paymentStatus: row.payment?.status || 'PAID',
        payment: row.payment,
        createdAt: row.created_at,
        user: {
          _id: row.user_id,
          id: row.user_id,
          name: row.user_name || req.user.name,
          email: row.user_email || req.user.email,
          phone: row.user_phone || req.user.phone,
        },
      }));

      return res.status(200).json({ success: true, count: mappedBookings.length, data: mappedBookings });
    }

    // 2. MongoDB Lookup
    if (mongoose.connection.readyState === 1) {
      const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: bookings.length, data: bookings });
    }

    // 3. MemoryStore Lookup
    const myBookings = memoryStore.bookings.filter(
      (b) => {
        const bUser = (b.user?._id || b.user?.id || b.user || '').toString();
        return bUser === userId;
      },
    );
    return res.status(200).json({ success: true, count: myBookings.length, data: myBookings });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get single booking by ID
 * Security: Return 404 for cross-user access to avoid leaking existence
 */
export const getBookingById = async (req, res, next) => {
  try {
    const userId = (req.user.id || req.user._id || '').toString();
    const isAdmin = (req.user.role || '').toUpperCase() === 'ADMIN';

    // 1. PostgreSQL Lookup
    if (isDbConnected()) {
      const result = await query(
        `SELECT b.*, u.name as user_name, u.email as user_email, u.phone as user_phone
         FROM bookings b
         LEFT JOIN users u ON b.user_id = u.id
         WHERE b.id = $1 OR b.booking_reference = $1`,
        [req.params.id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
      }

      const row = result.rows[0];
      if (!isAdmin && row.user_id !== userId) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
      }

      const booking = {
        _id: row.id,
        id: row.id,
        bookingReference: row.booking_reference,
        type: row.booking_type,
        itemDetails: row.item_details,
        travelers: row.travelers,
        contactInfo: row.contact_info,
        totalPrice: Number(row.total_price),
        currency: row.currency,
        status: row.status,
        paymentStatus: row.payment?.status || 'PAID',
        payment: row.payment,
        createdAt: row.created_at,
        user: {
          _id: row.user_id,
          id: row.user_id,
          name: row.user_name,
          email: row.user_email,
          phone: row.user_phone,
        },
      };

      return res.status(200).json({ success: true, data: booking });
    }

    // 2. MongoDB Lookup
    if (mongoose.connection.readyState === 1) {
      const booking = await Booking.findById(req.params.id);
      if (!booking || (!isAdmin && booking.user.toString() !== userId)) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
      }
      return res.status(200).json({ success: true, data: booking });
    }

    // 3. MemoryStore Lookup
    const booking = memoryStore.bookings.find(
      (b) => b._id.toString() === req.params.id || b.bookingReference === req.params.id,
    );
    const bUser = (booking?.user?._id || booking?.user?.id || booking?.user || '').toString();
    if (!booking || (!isAdmin && bUser !== userId)) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    return res.status(200).json({ success: true, data: booking });
  } catch (error) {
    return next(error);
  }
};

/**
 * Cancel a booking
 * Security: Return 404 for cross-user access to avoid leaking existence
 */
export const cancelBooking = async (req, res, next) => {
  try {
    const userId = (req.user.id || req.user._id || '').toString();
    const isAdmin = (req.user.role || '').toUpperCase() === 'ADMIN';

    // 1. PostgreSQL Persistent Update
    if (isDbConnected()) {
      const checkRes = await query(
        `SELECT b.*, u.name as user_name, u.email as user_email, u.phone as user_phone
         FROM bookings b
         LEFT JOIN users u ON b.user_id = u.id
         WHERE b.id = $1 OR b.booking_reference = $1`,
        [req.params.id],
      );

      if (checkRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
      }

      const row = checkRes.rows[0];
      if (!isAdmin && row.user_id !== userId) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
      }

      if (row.status === 'CANCELLED') {
        return res.status(400).json({ success: false, message: 'This booking has already been cancelled.' });
      }

      // Refund to user's Travel Digital Wallet if booking was paid
      const refundAmount = Number(row.total_price || 0);
      let updatedWalletBalance = 0;
      if (refundAmount > 0 && row.payment?.status === 'PAID') {
        const uRes = await query('SELECT wallet_balance FROM users WHERE id = $1', [row.user_id]);
        const balBefore = uRes.rows.length > 0 ? Number(uRes.rows[0].wallet_balance || 0) : 1000;
        updatedWalletBalance = balBefore + refundAmount;
        await query('UPDATE users SET wallet_balance = $1, updated_at = NOW() WHERE id = $2', [updatedWalletBalance, row.user_id]);

        const txId = `wtx-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
        await query(
          `INSERT INTO wallet_transactions (id, user_id, type, amount, balance_before, balance_after, payment_method, reference_id, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            txId,
            row.user_id,
            'REFUND_BOOKING',
            refundAmount,
            balBefore,
            updatedWalletBalance,
            'Travel Digital Wallet',
            row.booking_reference,
            `Refund for cancelled ${row.booking_type.toUpperCase()} reservation (${row.booking_reference})`,
          ],
        );
      }

      const updatedPayment = {
        ...row.payment,
        status: 'REFUNDED',
        refundedAt: new Date().toISOString(),
      };

      const updateRes = await query(
        'UPDATE bookings SET status = $1, payment = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        ['CANCELLED', JSON.stringify(updatedPayment), row.id],
      );

      const updatedRow = updateRes.rows[0];
      const updatedBooking = {
        _id: updatedRow.id,
        id: updatedRow.id,
        bookingReference: updatedRow.booking_reference,
        type: updatedRow.booking_type,
        itemDetails: updatedRow.item_details,
        travelers: updatedRow.travelers,
        contactInfo: updatedRow.contact_info,
        totalPrice: Number(updatedRow.total_price),
        currency: updatedRow.currency,
        status: updatedRow.status,
        paymentStatus: 'REFUNDED',
        payment: updatedPayment,
        walletBalance: updatedWalletBalance,
        createdAt: updatedRow.created_at,
        user: {
          _id: row.user_id,
          id: row.user_id,
          name: row.user_name,
          email: row.user_email,
          phone: row.user_phone,
        },
      };

      notifyAdminClients('booking_updated', updatedBooking);

      return res.status(200).json({
        success: true,
        message: `Booking has been cancelled and $${refundAmount.toFixed(2)} was refunded to the user's Travel Digital Wallet.`,
        data: updatedBooking,
      });
    }

    // 2. MongoDB Update
    if (mongoose.connection.readyState === 1) {
      const booking = await Booking.findById(req.params.id);
      if (!booking || (!isAdmin && booking.user.toString() !== userId)) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
      }

      if (booking.status === 'CANCELLED') {
        return res.status(400).json({ success: false, message: 'This booking has already been cancelled.' });
      }

      const refundAmount = Number(booking.totalPrice || 0);
      let updatedWalletBalance = 0;
      if (refundAmount > 0 && booking.paymentStatus === 'PAID') {
        const uDoc = await User.findById(booking.user);
        const balBefore = uDoc ? Number(uDoc.walletBalance || 0) : 1000;
        updatedWalletBalance = balBefore + refundAmount;
        if (uDoc) {
          uDoc.walletBalance = updatedWalletBalance;
          await uDoc.save();
        }

        await WalletTransaction.create({
          userId: booking.user,
          type: 'REFUND_BOOKING',
          amount: refundAmount,
          balanceBefore: balBefore,
          balanceAfter: updatedWalletBalance,
          paymentMethod: 'Travel Digital Wallet',
          referenceId: booking.bookingReference,
          description: `Refund for cancelled ${booking.type.toUpperCase()} reservation (${booking.bookingReference})`,
        });
      }

      booking.status = 'CANCELLED';
      booking.paymentStatus = 'REFUNDED';
      if (booking.payment) {
        booking.payment.status = 'REFUNDED';
      }
      await booking.save();
      await booking.populate('user', 'name email phone');

      notifyAdminClients('booking_updated', booking);

      return res.status(200).json({
        success: true,
        message: `Booking has been cancelled and $${refundAmount.toFixed(2)} was refunded to the user's Travel Digital Wallet.`,
        data: {
          ...booking.toObject(),
          walletBalance: updatedWalletBalance,
        },
      });
    }

    // 3. MemoryStore Update
    const booking = memoryStore.bookings.find(
      (b) => b._id.toString() === req.params.id || b.bookingReference === req.params.id,
    );
    const bUser = (booking?.user?._id || booking?.user?.id || booking?.user || '').toString();
    if (!booking || (!isAdmin && bUser !== userId)) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'This booking has already been cancelled.' });
    }

    const refundAmount = Number(booking.totalPrice || 0);
    const uMem = memoryStore.users.find((u) => (u.id || u._id || '').toString() === bUser);
    const balBefore = uMem ? Number(uMem.walletBalance ?? 1000) : 1000;
    const updatedWalletBalance = balBefore + refundAmount;

    if (uMem && refundAmount > 0 && booking.paymentStatus === 'PAID') {
      uMem.walletBalance = updatedWalletBalance;
      const txId = `wtx-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      if (!memoryStore.walletTransactions) {
        memoryStore.walletTransactions = [];
      }
      memoryStore.walletTransactions.unshift({
        _id: txId,
        id: txId,
        userId: bUser,
        type: 'REFUND_BOOKING',
        amount: refundAmount,
        balanceBefore: balBefore,
        balanceAfter: updatedWalletBalance,
        paymentMethod: 'Travel Digital Wallet',
        referenceId: booking.bookingReference,
        description: `Refund for cancelled ${booking.type.toUpperCase()} reservation (${booking.bookingReference})`,
        createdAt: new Date(),
      });
    }

    booking.status = 'CANCELLED';
    booking.paymentStatus = 'REFUNDED';
    if (booking.payment) {
      booking.payment.status = 'REFUNDED';
    }
    booking.walletBalance = updatedWalletBalance;

    notifyAdminClients('booking_updated', booking);

    return res.status(200).json({
      success: true,
      message: `Booking has been cancelled and $${refundAmount.toFixed(2)} was refunded to the user's Travel Digital Wallet.`,
      data: booking,
    });
  } catch (error) {
    return next(error);
  }
};
