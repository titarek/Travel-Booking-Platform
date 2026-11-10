import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      required: true,
      trim: true,
    },
    tag: {
      type: String,
      default: 'Special Deal',
      trim: true,
    },
    category: {
      type: String,
      enum: ['special_offer', 'bank_partner', 'flight', 'hotel', 'package'],
      default: 'special_offer',
    },
    discount: {
      type: String,
      default: '',
      trim: true,
    },
    promoCode: {
      type: String,
      default: '',
      trim: true,
    },
    buttonText: {
      type: String,
      default: 'View Deal',
      trim: true,
    },
    link: {
      type: String,
      default: '/flights',
      trim: true,
    },
    gradient: {
      type: String,
      default: 'from-brand-600 to-sky-700',
    },
    features: {
      type: [String],
      default: [],
    },
    validUntil: {
      type: String,
      default: 'Valid until Dec 2026',
    },
    active: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const Offer = mongoose.model('Offer', offerSchema);
