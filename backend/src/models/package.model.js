import mongoose from 'mongoose';

const itineraryDaySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
});

const packageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      index: true,
    },
    country: {
      type: String,
      required: true,
    },
    durationDays: {
      type: Number,
      required: true,
    },
    durationNights: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    discountPrice: {
      type: Number,
      default: null,
    },
    image: {
      type: String,
      required: true,
    },
    gallery: [{
      type: String,
    }],
    highlights: [{
      type: String,
    }],
    itinerary: [itineraryDaySchema],
    inclusions: [{
      type: String,
    }],
    exclusions: [{
      type: String,
    }],
    category: {
      type: String,
      enum: ['Family', 'Honeymoon', 'Adventure', 'Luxury', 'Budget'],
      default: 'Family',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    badge: {
      type: String,
      default: 'Best Seller',
    },
  },
  {
    timestamps: true,
  },
);

packageSchema.index({ destination: 1, category: 1, price: 1 });

export const Package = mongoose.model('Package', packageSchema);
