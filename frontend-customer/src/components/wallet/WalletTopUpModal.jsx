import { useState } from 'react';
import {
  Wallet,
  CreditCard,
  Smartphone,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000];

export const WalletTopUpModal = ({
  isOpen,
  onClose,
  onSuccess,
  requiredAmount = null,
}) => {
  const {
    walletBalance,
    topUpWallet,
    currency,
    exchangeRates,
  } = useAuth();

  const [selectedPreset, setSelectedPreset] = useState(
    requiredAmount && requiredAmount > walletBalance
      ? Math.ceil((requiredAmount - walletBalance) / 50) * 50
      : 250,
  );
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit/Debit Card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const activeAmount = customAmount ? Number(customAmount) : Number(selectedPreset);

  const handleTopUp = async () => {
    if (!activeAmount || Number.isNaN(activeAmount) || activeAmount <= 0) {
      setError('Please choose or enter a valid deposit amount.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await topUpWallet(activeAmount, paymentMethod);
      setSuccessMessage(res?.message || `Successfully added ${formatCurrency(activeAmount, currency, exchangeRates)} to your wallet!`);
      setTimeout(() => {
        setSuccessMessage('');
        if (onSuccess) onSuccess(res?.data?.balance);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err?.message || 'Deposit failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (amount) => {
    setSelectedPreset(amount);
    setCustomAmount('');
    setError('');
  };

  const handleCustomChange = (e) => {
    setCustomAmount(e.target.value);
    setSelectedPreset(null);
    setError('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Top Up Travel Digital Wallet"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {/* Current Balance Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-sky-600 text-white shadow-lg shadow-brand-500/20 relative overflow-hidden">
          <div className="absolute right-[-15px] top-[-15px] opacity-10">
            <Wallet className="h-32 w-32" />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/80 block">
                Current Available Balance
              </span>
              <span className="text-2xl font-black text-white mt-0.5 block">
                {formatCurrency(walletBalance, currency, exchangeRates)}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>

          {requiredAmount && requiredAmount > walletBalance && (
            <div className="mt-3 pt-3 border-t border-white/20 text-xs font-semibold text-amber-200 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                Required for Booking: {formatCurrency(requiredAmount, currency, exchangeRates)} (Short: {formatCurrency(requiredAmount - walletBalance, currency, exchangeRates)})
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Preset Amount Chips */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            Select Deposit Amount
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {PRESET_AMOUNTS.map((amt) => {
              const isSelected = selectedPreset === amt && !customAmount;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handlePresetClick(amt)}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50 text-brand-700 font-black shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 font-semibold'
                  }`}
                >
                  <span className="text-xs block">
                    {formatCurrency(amt, currency, exchangeRates)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Amount */}
          <div className="pt-1">
            <div className="relative">
              <input
                type="number"
                min="1"
                placeholder="Or enter custom amount (USD)"
                value={customAmount}
                onChange={handleCustomChange}
                className="w-full pl-3 pr-10 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 bg-white"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                USD
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            Top-Up Source / Payment Gateway
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'Credit/Debit Card', label: 'Card (Visa/Master)', icon: CreditCard },
              { id: 'bKash / Mobile Wallet', label: 'bKash / MFS', icon: Smartphone },
              { id: 'Bank Transfer / Wire', label: 'Online Banking', icon: Building2 },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/70 text-brand-700 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span className="text-[11px] leading-tight block">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleTopUp}
            loading={loading}
            className="px-6 font-bold flex items-center gap-1.5"
          >
            <span>Deposit {formatCurrency(activeAmount || 0, currency, exchangeRates)}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Modal>
  );
};
