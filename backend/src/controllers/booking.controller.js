import mongoose from 'mongoose';
import { Booking } from '../models/booking.model.js';
import { memoryStore } from '../utils/memoryStore.js';
import { notifyAdminClients } from '../utils/realtime.js';

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

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
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
        payment: {
          method: paymentMethod || 'Online Payment',
          transactionId,
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      await booking.populate('user', 'name email phone');

      // Dispatch real-time event to connected admin portals
      notifyAdminClients('booking_created', booking);

      return res.status(201).json({
        success: true,
        message: 'Booking submitted successfully! Reservation is pending admin confirmation.',
        data: booking,
      });
    }

    // Memory fallback
    const newBooking = {
      _id: `64a1b2c3d4e5f6789012${Math.floor(1000 + Math.random() * 9000)}`,
      user: {
        _id: req.user._id.toString(),
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
      payment: {
        method: paymentMethod || 'Online Payment',
        transactionId,
        status: 'PAID',
        paidAt: new Date(),
      },
      createdAt: new Date(),
    };

    memoryStore.bookings.unshift(newBooking);

    // Dispatch real-time event to connected admin portals
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
    if (mongoose.connection.readyState === 1) {
      const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: bookings.length, data: bookings });
    }

    const myBookings = memoryStore.bookings.filter(
      (b) => b.user.toString() === req.user._id.toString(),
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
    let booking;
    if (mongoose.connection.readyState === 1) {
      booking = await Booking.findById(req.params.id);
    } else {
      booking = memoryStore.bookings.find((b) => b._id.toString() === req.params.id);
    }

    // Ownership check: return 404 (not 403)
    if (!booking || booking.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
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
    let booking;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      booking = await Booking.findById(req.params.id);
    } else {
      booking = memoryStore.bookings.find((b) => b._id.toString() === req.params.id);
    }

    // Ownership check: return 404 (not 403)
    if (!booking || booking.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been cancelled.',
      });
    }

    booking.status = 'CANCELLED';
    if (isDbConnected) {
      await booking.save();
      await booking.populate('user', 'name email phone');
    }

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
