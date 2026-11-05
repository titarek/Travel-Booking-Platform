import mongoose from 'mongoose';

const flightSchema = new mongoose.Schema(
  {
    airline: {
      type: String,
      required: true,
      trim: true,
    },
    airlineCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    flightNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    origin: {
      code: { type: String, required: true, uppercase: true },
      city: { type: String, required: true },
      airport: { type: String, required: true },
    },
    destination: {
      code: { type: String, required: true, uppercase: true },
      city: { type: String, required: true },
      airport: { type: String, required: true },
    },
    departureTime: {
      type: Date,
      required: true,
    },
    arrivalTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    stops: {
      type: Number,
      default: 0,
    },
    stopoverCities: [{
      type: String,
    }],
    cabinClass: {
      type: String,
      enum: ['Economy', 'Premium Economy', 'Business', 'First'],
      default: 'Economy',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    baggage: {
      type: String,
      default: '1 x 20 kg',
    },
    refundable: {
      type: Boolean,
      default: true,
    },
    seatsAvailable: {
      type: Number,
      default: 12,
    },
  },
  {
    timestamps: true,
  },
);

flightSchema.index({ 'origin.code': 1, 'destination.code': 1, departureTime: 1 });

export const Flight = mongoose.model('Flight', flightSchema);
