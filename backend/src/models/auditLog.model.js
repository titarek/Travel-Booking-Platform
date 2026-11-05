import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    adminEmail: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'DELETE_HOTEL',
        'DELETE_FLIGHT',
        'DELETE_BOOKING',
        'CANCEL_BOOKING',
        'UPDATE_ROLE',
        'DELETE_PACKAGE',
        'UPDATE_SETTINGS',
        'FLUSH_CACHE',
        'UPDATE_API_KEY',
        'UPDATE_MASTER_PIN',
      ],
    },
    targetType: {
      type: String,
      required: true,
      enum: ['Hotel', 'Flight', 'Booking', 'User', 'Package', 'System', 'Settings', 'Security'],
    },
    targetId: {
      type: String,
      required: true,
    },
    targetName: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason for action is required'],
      trim: true,
      minlength: [3, 'Reason must be at least 3 characters'],
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
