import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global_saas_config',
    },
    commissionRate: {
      type: Number,
      default: 5.0, // 5% platform commission
      min: 0,
      max: 50,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    announcementBanner: {
      enabled: { type: Boolean, default: false },
      message: { type: String, default: 'Special Offer: Get 10% off on all luxury hotels this week!' },
      type: { type: String, enum: ['promotion', 'info', 'warning'], default: 'promotion' },
    },
    currencyRates: {
      USD: { type: Number, default: 1.0 },
      BDT: { type: Number, default: 121.5 },
      EUR: { type: Number, default: 0.92 },
      GBP: { type: Number, default: 0.79 },
      AED: { type: Number, default: 3.67 },
      SAR: { type: Number, default: 3.75 },
    },
    lastUpdatedBy: {
      type: String,
      default: 'system',
    },
  },
  {
    timestamps: true,
  },
);

export const Setting = mongoose.model('Setting', settingSchema);
