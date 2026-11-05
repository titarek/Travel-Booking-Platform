import mongoose from 'mongoose';

const travelerSchema = new mongoose.Schema({
  title: { type: String, enum: ['Mr', 'Mrs', 'Ms', 'Dr'], default: 'Mr' },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  dateOfBirth: { type: String, required: true },
  passportNumber: { type: String, trim: true, default: '' },
  nationality: { type: String, default: 'Bangladeshi' },
});

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['flight', 'hotel', 'package'],
      required: true,
    },
    itemDetails: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    travelers: [travelerSchema],
    contactInfo: {
      email: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['CONFIRMED', 'CANCELLED', 'PENDING', 'confirmed', 'cancelled', 'pending'],
      default: 'PENDING',
      set: (v) => (v ? v.toUpperCase() : v),
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PENDING', 'REFUNDED', 'paid', 'pending', 'refunded'],
      default: 'PAID',
      set: (v) => (v ? v.toUpperCase() : v),
    },
    payment: {
      method: { type: String, default: 'Credit/Debit Card' },
      transactionId: { type: String, required: true },
      status: { type: String, default: 'PAID' },
      paidAt: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
  },
);

bookingSchema.index({ user: 1, createdAt: -1 });

export const Booking = mongoose.model('Booking', bookingSchema);
