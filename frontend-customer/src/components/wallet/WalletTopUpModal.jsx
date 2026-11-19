import { useState } from 'react';
import {
  CreditCard,
  Smartphone,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Headphones,
  Phone,
  Clock,
  ShieldCheck,
  Send,
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
    submitManualDeposit,
    currency,
    exchangeRates,
  } = useAuth();

  // Active top-up tab: 'manual' (Concierge & Customer Care) vs 'instant' (Simulation / Test)
  const [activeTab, setActiveTab] = useState('manual');

  // Simulation mode state
  const [selectedPreset, setSelectedPreset] = useState(
    requiredAmount && requiredAmount > walletBalance
      ? Math.ceil((requiredAmount - walletBalance) / 50) * 50
      : 250,
  );
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit/Debit Card');

  // Manual payment concierge form state
  const [manualAmount, setManualAmount] = useState(
    requiredAmount && requiredAmount > walletBalance
      ? Math.ceil(requiredAmount - walletBalance)
      : 250,
  );
  const [manualMethod, setManualMethod] = useState('bKash / MFS');
  const [transactionId, setTransactionId] = useState('');
  const [senderAccount, setSenderAccount] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const activeSimulationAmount = customAmount ? Number(customAmount) : Number(selectedPreset);

  // Handle Instant Top-Up (Simulation)
  const handleInstantTopUp = async () => {
    if (!activeSimulationAmount || Number.isNaN(activeSimulationAmount) || activeSimulationAmount <= 0) {
      setError('Please choose or enter a valid deposit amount.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await topUpWallet(activeSimulationAmount, paymentMethod);
      setSuccessMessage(res?.message || `Successfully credited ${formatCurrency(activeSimulationAmount, currency, exchangeRates)} to your wallet!`);
      setTimeout(() => {
        setSuccessMessage('');
        if (onSuccess) onSuccess(res?.data?.balance);
        onClose();
      }, 1400);
    } catch (err) {
      setError(err?.message || 'Deposit simulation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Manual Payment Slip Submission
  const handleManualSubmit = async (e) => {
    if (e) e.preventDefault();
    const numAmt = Number(manualAmount);
    if (!numAmt || Number.isNaN(numAmt) || numAmt <= 0) {
      setError('Please enter a valid deposit amount greater than 0.');
      return;
    }
    if (!transactionId.trim()) {
      setError('Transaction ID / Reference Number is required for payment verification.');
      return;
    }
    if (!senderAccount.trim()) {
      setError('Sender Phone Number or Bank Account Name is required.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (submitManualDeposit) {
        await submitManualDeposit({
          amount: numAmt,
          paymentMethod: manualMethod,
          transactionId: transactionId.trim(),
          senderAccount: senderAccount.trim(),
          notes: notes.trim(),
        });
      }
      setSuccessMessage('Payment submitted successfully! Admin will verify and credit your wallet shortly.');
      setTransactionId('');
      setSenderAccount('');
      setNotes('');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 2500);
    } catch (err) {
      setError(err?.message || 'Failed to submit payment verification request.');
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
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* Current Balance Banner - Logo removed as requested */}
        <div className="p-4 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-sky-600 text-white shadow-lg shadow-brand-500/20 relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/80 block">
                Current Available Balance
              </span>
              <span className="text-3xl font-black text-white mt-0.5 block tracking-tight">
                {formatCurrency(walletBalance, currency, exchangeRates)}
              </span>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-white border border-white/20">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                Verified Travel Wallet
              </span>
            </div>
          </div>

          {requiredAmount && requiredAmount > walletBalance && (
            <div className="mt-3 pt-3 border-t border-white/20 text-xs font-semibold text-amber-200 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                Required for Booking: {formatCurrency(requiredAmount, currency, exchangeRates)} (Shortfall: {formatCurrency(requiredAmount - walletBalance, currency, exchangeRates)})
              </span>
            </div>
          )}
        </div>

        {/* Prominent Red Note as requested */}
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-red-800 block">Payment Gateway Notice:</span>
            Automated online payment gateway will be fully activated after integrating payment gateway API. In the meantime, you can submit payment details below or contact customer care for concierge wallet verification.
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => { setActiveTab('manual'); setError(''); }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Headphones className="h-3.5 w-3.5 text-brand-600" />
            <span>Manual Payment & Concierge Approval</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('instant'); setError(''); }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'instant'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
            <span>Instant Simulation (Test Mode)</span>
          </button>
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

        {/* TAB 1: Manual Payment Verification & Customer Care */}
        {activeTab === 'manual' && (
          <div className="space-y-4">
            {/* Customer Care Hotline & Payment Accounts */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Headphones className="h-4 w-4 text-brand-600" />
                  Official Accounts & Customer Care Desk
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  24/7 Live Concierge
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                  <span className="font-bold text-slate-700 block">📱 bKash / Nagad (Merchant)</span>
                  <span className="font-mono text-brand-700 font-bold block mt-0.5">+880 1712-345678</span>
                  <span className="text-[10px] text-slate-400">Reference: Your Account Email</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                  <span className="font-bold text-slate-700 block">🏛️ Direct Bank Wire (City Bank)</span>
                  <span className="font-mono text-slate-700 font-bold block mt-0.5">A/C: 110-234-987654</span>
                  <span className="text-[10px] text-slate-400">Travel Global Ltd. (Gulshan Branch)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-0.5 text-slate-500">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-slate-400" />
                  Help Desk Hotline: <strong className="text-slate-700">+880 9617-888888</strong>
                </span>
                <span className="text-slate-400">Desk: payments@travel.test</span>
              </div>
            </div>

            {/* Submission Form */}
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Deposit Amount */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Deposit Amount (USD) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      placeholder="e.g. 250"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 bg-white"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">USD</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={manualMethod}
                    onChange={(e) => setManualMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 bg-white"
                  >
                    <option value="bKash / MFS">bKash (MFS)</option>
                    <option value="Nagad / MFS">Nagad (MFS)</option>
                    <option value="Bank Wire Transfer">Bank Wire Transfer</option>
                    <option value="Card Deposit Receipt">Card Deposit Receipt</option>
                    <option value="Other">Other Gateway / Voucher</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Transaction ID */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Transaction ID / Reference No. *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TRX92817364"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 bg-white font-mono"
                  />
                </div>

                {/* Sender Account */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Sender Phone / Account Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01712345678 or John Doe"
                    value={senderAccount}
                    onChange={(e) => setSenderAccount(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 bg-white"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Additional Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Booking deposit for flight TRV-482910"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-normal rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 bg-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={loading}
                  className="px-6 font-bold flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit Payment for Approval</span>
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: Instant Simulation (Test Mode) */}
        {activeTab === 'instant' && (
          <div className="space-y-4">
            {/* Preset Amount Chips */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Select Simulation Deposit Amount
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
                Top-Up Source / Simulated Gateway
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
                onClick={handleInstantTopUp}
                loading={loading}
                className="px-6 font-bold flex items-center gap-1.5"
              >
                <span>Deposit {formatCurrency(activeSimulationAmount || 0, currency, exchangeRates)}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
