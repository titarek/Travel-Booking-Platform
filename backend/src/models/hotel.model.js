import mongoose from 'mongoose';

const roomTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  bed: { type: String, required: true },
  maxGuests: { type: Number, default: 2 },
  price: { type: Number, required: true },
  refundable: { type: Boolean, default: true },
  breakfastIncluded: { type: Boolean, default: true },
});

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      index: true,
    },
    country: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    district: {
      type: String,
      default: 'City Center',
    },
    distanceKm: {
      type: Number,
      default: 1.2,
    },
    starRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4,
    },
    reviewScore: {
      type: Number,
      min: 1,
      max: 5,
      default: 4.5,
    },
    reviewCount: {
      type: Number,
      default: 85,
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    images: [{
      type: String,
    }],
    thumbnail: {
      type: String,
      default: '',
    },
    amenities: [{
      type: String,
    }],
    roomTypes: [roomTypeSchema],
    description: {
      type: String,
      required: true,
    },
    freeCancellation: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

hotelSchema.index({ city: 1, pricePerNight: 1, reviewScore: -1 });

export const Hotel = mongoose.model('Hotel', hotelSchema);
