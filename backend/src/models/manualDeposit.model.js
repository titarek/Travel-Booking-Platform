import mongoose from 'mongoose';

const manualDepositSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      default: 'Customer',
    },
    userEmail: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be greater than zero'],
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['bKash / MFS', 'Nagad / MFS', 'Bank Wire Transfer', 'Card Deposit Receipt', 'Other'],
      default: 'bKash / MFS',
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
    },
    senderAccount: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    approvedBy: {
      type: String,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const ManualDeposit = mongoose.model('ManualDeposit', manualDepositSchema);
