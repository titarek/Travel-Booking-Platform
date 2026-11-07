import mongoose from 'mongoose';
import { Booking } from '../models/booking.model.js';
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
      paymentMethod,
    } = req.body;
    const bookingReference = generatePNR();
    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const userId = (req.user.id || req.user._id || '').toString();

    const payment = {
      method: paymentMethod || 'Online Payment',
      transactionId,
      status: 'PAID',
      paidAt: new Date().toISOString(),
    };

    // 1. PostgreSQL Persistent Storage
    if (isDbConnected()) {
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
        data: booking,
      });
    }

    // 3. Memory fallback
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

      const updateRes = await query(
        'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        ['CANCELLED', row.id],
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
        paymentStatus: updatedRow.payment?.status || 'PAID',
        payment: updatedRow.payment,
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
        message: 'Booking has been successfully cancelled.',
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

      booking.status = 'CANCELLED';
      await booking.save();
      await booking.populate('user', 'name email phone');

      notifyAdminClients('booking_updated', booking);

      return res.status(200).json({
        success: true,
        message: 'Booking has been successfully cancelled.',
        data: booking,
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

    booking.status = 'CANCELLED';
    notifyAdminClients('booking_updated', booking);

    return res.status(200).json({
      success: true,
      message: 'Booking has been successfully cancelled.',
      data: booking,
    });
  } catch (error) {
    return next(error);
  }
};
