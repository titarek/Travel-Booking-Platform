import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['TOPUP', 'DEBIT_BOOKING', 'REFUND_BOOKING'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      default: 'Digital Wallet',
    },
    referenceId: {
      type: String,
      default: '',
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

export const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
