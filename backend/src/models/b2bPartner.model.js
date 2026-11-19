import mongoose from 'mongoose';

const b2bPartnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Partner company name is required'],
      trim: true,
      maxlength: 120,
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid contact email'],
    },
    apiKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tier: {
      type: String,
      enum: ['FREE_TRIAL', 'STARTER', 'GROWTH', 'ENTERPRISE'],
      default: 'GROWTH',
    },
    commissionDiscount: {
      type: Number,
      default: 8.0,
      min: 0,
      max: 50,
    },
    rateLimit: {
      type: Number,
      default: 5000,
      min: 1,
    },
    totalRequests: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    webhookUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

export const B2BPartner = mongoose.model('B2BPartner', b2bPartnerSchema);
