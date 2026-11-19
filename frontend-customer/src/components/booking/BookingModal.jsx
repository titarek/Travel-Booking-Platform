import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Ticket,
  Printer,
  Wallet,
  ArrowRight,
  Plus,
  ShieldCheck,
  Smartphone,
  RotateCcw,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import { Modal } from '../ui/Modal.jsx';
import { Input } from '../ui/Input.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { ETicketModal } from './ETicketModal.jsx';
import { FlightRadarMap } from '../flights/FlightRadarMap.jsx';
import { WalletTopUpModal } from '../wallet/WalletTopUpModal.jsx';
import api from '../../api/axios.js';

export const BookingModal = ({
  item,
  type = 'flight', // 'flight' | 'hotel' | 'package'
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const {
    user,
    currency,
    exchangeRates,
    openAuthModal,
    walletBalance,
    updateWalletBalance,
    fetchWallet,
  } = useAuth();

  // 1: Travelers, 2: Payment Review, 3: OTP Verification, 4: Confirmation
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [eTicketOpen, setETicketOpen] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);

  // Traveler form state
  const [traveler, setTraveler] = useState({
    title: 'Mr',
    firstName: user?.name ? user.name.split(' ')[0] : 'Tanvir',
    lastName: user?.name && user.name.split(' ').length > 1 ? user.name.split(' ').slice(1).join(' ') : 'Ahmed',
    dateOfBirth: '1995-06-15',
    passportNumber: 'A08291048',
    nationality: 'Bangladeshi',
  });

  const [contact, setContact] = useState({
    email: user?.email || 'demo@travel.test',
    phone: user?.phone || '+880 1711 223344',
  });

  // Promo code
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  const paymentMethod = 'Travel Digital Wallet';

  // OTP 2FA Security State (Powered by OTP.dev)
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState('');
  const [devCode, setDevCode] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Confirmation result
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // OTP Resend cooldown timer
  useEffect(() => {
    let timer;
    if (otpCooldown > 0) {
      timer = setTimeout(() => setOtpCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  if (!item) return null;

  // Price calculations
  const rawBasePrice = item.price || item.pricePerNight || 300;
  const discountAmount = Math.round((rawBasePrice * discountPercent) / 100);
  const finalPrice = Math.max(10, rawBasePrice - discountAmount);

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'TRAVEL20' || promoCode.trim().toUpperCase() === 'SHARETRIP') {
      setDiscountPercent(15);
      setPromoMessage('Promo code applied: 15% discount!');
    } else if (promoCode.trim().toUpperCase() === 'WELCOME') {
      setDiscountPercent(10);
      setPromoMessage('Promo code applied: 10% welcome discount!');
    } else {
      setPromoMessage('Invalid promo code. Try "TRAVEL20".');
    }
  };

  // Step 2 -> Step 3: Trigger OTP.dev security dispatch
  const handleProceedToOtp = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (walletBalance < finalPrice) {
      setError(`Insufficient wallet balance (${formatCurrency(walletBalance, currency, exchangeRates)} available, ${formatCurrency(finalPrice, currency, exchangeRates)} required). Please top up your wallet.`);
      setTopUpModalOpen(true);
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const phoneToSend = contact.phone || user.phone || '+8801700000000';
      const res = await api.post('/bookings/send-otp', { phone: phoneToSend });
      if (res.data?.data) {
        setMaskedPhone(res.data.data.maskedPhone || phoneToSend);
        if (res.data.data.devCode) {
          setDevCode(res.data.data.devCode);
        }
        setOtpCooldown(60);
        setStep(3); // Advance to OTP verification
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not dispatch OTP code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    if (otpCooldown > 0) return;
    setOtpLoading(true);
    setError('');

    try {
      const phoneToSend = contact.phone || user.phone || '+8801700000000';
      const res = await api.post('/bookings/send-otp', { phone: phoneToSend });
      if (res.data?.data) {
        if (res.data.data.devCode) {
          setDevCode(res.data.data.devCode);
        }
        setOtpCooldown(60);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 3 -> Step 4: Verify OTP code and execute purchase
  const handleVerifyAndConfirm = async (e) => {
    if (e) e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setError('Please enter the 6-digit OTP code received on your phone.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        type,
        itemDetails: item,
        travelers: [traveler],
        contactInfo: contact,
        totalPrice: finalPrice,
        paymentMethod: paymentMethod || 'Travel Digital Wallet',
        otpCode: otpCode.trim(),
      };

      const res = await api.post('/bookings', payload);
      if (res.data?.data) {
        setConfirmedBooking(res.data.data);
        if (res.data.data.walletBalance != null) {
          updateWalletBalance(res.data.data.walletBalance);
        } else {
          fetchWallet();
        }
        setStep(4); // Confirmation
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 4 ? 'Booking Confirmed!' : `Complete Your ${type.charAt(0).toUpperCase() + type.slice(1)} Booking`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Step Progress Indicator (4 Steps) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 1 ? 'bg-brand-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}
            >
              1
            </span>
            <span className="text-xs font-semibold text-slate-700">Passenger</span>
          </div>

          <div className="h-0.5 w-8 sm:w-12 bg-slate-200" />

          <div className="flex items-center gap-2">
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 2 ? 'bg-brand-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}
            >
              2
            </span>
            <span className="text-xs font-semibold text-slate-700">Payment</span>
          </div>

          <div className="h-0.5 w-8 sm:w-12 bg-slate-200" />

          <div className="flex items-center gap-2">
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 3 ? 'bg-brand-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}
            >
              3
            </span>
            <span className="text-xs font-semibold text-slate-700">2FA OTP</span>
          </div>

          <div className="h-0.5 w-8 sm:w-12 bg-slate-200" />

          <div className="flex items-center gap-2">
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 4 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}
            >
              4
            </span>
            <span className="text-xs font-semibold text-slate-700">Confirmed</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Traveler Details */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Quick Item Summary Header */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Selected {type}</span>
                <h4 className="text-sm font-black text-slate-900">
                  {item.airline?.name || item.name || item.title || 'Selected Trip'}
                </h4>
                <p className="text-xs text-slate-500">
                  {item.flightNumber ? `Flight ${item.flightNumber} • ${item.origin?.code} → ${item.destination?.code}` : item.location?.city || item.destination}
                </p>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-brand-600 block">
                  {formatCurrency(finalPrice, currency, exchangeRates)}
                </span>
                <span className="text-[10px] text-slate-400">Total payable</span>
              </div>
            </div>

            {/* Live radar preview if flight */}
            {type === 'flight' && (
              <FlightRadarMap
                origin={item.origin}
                destination={item.destination}
                airline={item.airline}
                flightNumber={item.flightNumber}
                compact
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Title</label>
                <select
                  value={traveler.title}
                  onChange={(e) => setTraveler({ ...traveler, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 bg-white"
                >
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">First Name *</label>
                <Input
                  value={traveler.firstName}
                  onChange={(e) => setTraveler({ ...traveler, firstName: e.target.value })}
                  placeholder="First name"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Last Name *</label>
                <Input
                  value={traveler.lastName}
                  onChange={(e) => setTraveler({ ...traveler, lastName: e.target.value })}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Date of Birth</label>
                <Input
                  type="date"
                  value={traveler.dateOfBirth}
                  onChange={(e) => setTraveler({ ...traveler, dateOfBirth: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Passport / NID No.</label>
                <Input
                  value={traveler.passportNumber}
                  onChange={(e) => setTraveler({ ...traveler, passportNumber: e.target.value })}
                  placeholder="e.g. A08291048"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nationality</label>
                <Input
                  value={traveler.nationality}
                  onChange={(e) => setTraveler({ ...traveler, nationality: e.target.value })}
                  placeholder="Nationality"
                />
              </div>
            </div>

            {/* Contact details */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Primary Contact Information (Used for SMS OTP Authorization)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                  <Input
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile Phone (For 2FA SMS)</label>
                  <Input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    placeholder="+880 1711 223344"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                onClick={() => {
                  if (!traveler.firstName || !traveler.lastName || !contact.email) {
                    setError('Please provide passenger first and last name, and contact details.');
                    return;
                  }
                  setError('');
                  setStep(2);
                }}
                className="font-bold px-8 flex items-center gap-1.5"
              >
                <span>Continue to Payment</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Review & Wallet Balance */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Promo Code Input */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Have a Coupon or Promo Code?</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code (e.g. TRAVEL20)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs uppercase font-mono rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 bg-white"
                />
                <Button variant="outline" size="sm" onClick={handleApplyPromo} className="font-bold text-xs">
                  Apply
                </Button>
              </div>
              {promoMessage && (
                <p className={`text-[11px] font-semibold ${discountPercent > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {promoMessage}
                </p>
              )}
            </div>

            {/* Travel Digital Wallet Payment Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-brand-50 via-indigo-50/70 to-sky-50 border border-brand-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-xs">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Payment System: Travel Digital Wallet
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      All reservations deduct directly from your verified digital balance
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTopUpModalOpen(true)}
                  className="text-xs font-bold text-brand-600 border-brand-200 bg-white hover:bg-brand-50 gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Top Up</span>
                </Button>
              </div>

              {/* Wallet Balance vs Due Comparison */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-brand-100 text-center">
                <div className="p-2 rounded-xl bg-white/80 border border-brand-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Available</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 block">
                    {formatCurrency(walletBalance, currency, exchangeRates)}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-white/80 border border-brand-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Booking Fare</span>
                  <span className="text-xs sm:text-sm font-black text-brand-600 block">
                    {formatCurrency(finalPrice, currency, exchangeRates)}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-white/80 border border-brand-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">After Booking</span>
                  <span className={`text-xs sm:text-sm font-black block ${
                    walletBalance >= finalPrice ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                  >
                    {formatCurrency(Math.max(0, walletBalance - finalPrice), currency, exchangeRates)}
                  </span>
                </div>
              </div>

              {/* Balance status alert */}
              {walletBalance >= finalPrice ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-2 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Sufficient balance available. SMS OTP authentication will confirm this purchase.</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs font-semibold text-amber-800">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Short by {formatCurrency(finalPrice - walletBalance, currency, exchangeRates)}. Top up required to book.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTopUpModalOpen(true)}
                    className="underline font-bold text-brand-700 hover:text-brand-800 shrink-0"
                  >
                    Top up now →
                  </button>
                </div>
              )}
            </div>

            {/* Price breakdown */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Base Fare / Rate</span>
                <span>{formatCurrency(rawBasePrice, currency, exchangeRates)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Special Promo Discount ({discountPercent}%)</span>
                  <span>-{formatCurrency(discountAmount, currency, exchangeRates)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Taxes &amp; Carrier Surcharges</span>
                <span className="text-emerald-600 font-bold">Included</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm text-slate-900">
                <span>Total Amount Due</span>
                <span className="text-brand-600 font-black">
                  {formatCurrency(finalPrice, currency, exchangeRates)}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              {walletBalance >= finalPrice ? (
                <Button
                  variant="accent"
                  onClick={handleProceedToOtp}
                  loading={otpLoading}
                  className="font-bold px-8 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  <span>Authorize Purchase with SMS OTP</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setTopUpModalOpen(true)}
                  className="font-bold px-6 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Top Up Wallet ({formatCurrency(finalPrice - walletBalance, currency, exchangeRates)} needed)</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: OTP 2FA Security Authorization (Powered by OTP.dev) */}
        {step === 3 && (
          <form onSubmit={handleVerifyAndConfirm} className="space-y-5 py-2">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-brand-50/50 to-slate-50 border border-brand-200 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-500/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Two-Factor Security Verification
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
                  To protect your digital wallet balance and secure your account against unauthorized transactions, a 6-digit security code has been dispatched via SMS to:
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-brand-100 text-brand-800 font-mono font-bold text-xs">
                  <Smartphone className="h-3.5 w-3.5 text-brand-600" />
                  <span>{maskedPhone || contact.phone || user?.phone}</span>
                </div>
              </div>
            </div>

            {/* OTP Input Box */}
            <div className="space-y-2 text-center max-w-xs mx-auto">
              <label htmlFor="otpCodeInput" className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                Enter 6-Digit OTP Code
              </label>
              <input
                id="otpCodeInput"
                type="text"
                autoFocus
                maxLength={6}
                required
                placeholder="••••••"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[0.5em] font-mono text-2xl font-black py-3 rounded-2xl border-2 border-brand-300 focus:outline-none focus:border-brand-600 bg-white shadow-inner"
              />
              <span className="text-[11px] text-slate-400 block">
                Verification powered by OTP.dev Carrier Gateway
              </span>
            </div>

            {/* Dev Demo Quickfill Helper */}
            {devCode && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 max-w-sm mx-auto flex items-center justify-between text-xs text-amber-800">
                <span>
                  Demo Mode Code: <strong className="font-mono">{devCode}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setOtpCode(devCode)}
                  className="font-bold underline text-amber-900 hover:text-amber-700"
                >
                  Quickfill
                </button>
              </div>
            )}

            {/* Resend Cooldown / Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(2)}
                disabled={loading}
              >
                Back to Review
              </Button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={otpCooldown > 0 || otpLoading}
                  onClick={handleResendOtp}
                  className="text-xs font-bold text-slate-600 hover:text-brand-600 disabled:opacity-50 flex items-center gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>
                    {otpCooldown > 0 ? `Resend code in ${otpCooldown}s` : 'Resend OTP'}
                  </span>
                </button>

                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="px-6 font-bold flex items-center gap-1.5"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Verify &amp; Confirm Booking</span>
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* STEP 4: Booking Confirmation Screen */}
        {step === 4 && confirmedBooking && (
          <div className="space-y-6 text-center py-4">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900">Booking Verified &amp; Confirmed!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your reservation has been authenticated and processed. Official PNR reference is generated.
              </p>
            </div>

            {/* Official E-ticket voucher summary */}
            <div className="p-5 bg-gradient-to-br from-slate-50 to-brand-50/30 rounded-2xl border border-brand-200 text-left space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-brand-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Booking PNR Reference</span>
                  <p className="text-lg font-black text-brand-600 tracking-wider">{confirmedBooking.bookingReference}</p>
                </div>
                <Badge variant={confirmedBooking.status?.toLowerCase() === 'confirmed' ? 'success' : 'warning'} size="sm">
                  {confirmedBooking.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Passenger</span>
                  <strong className="text-slate-900">{traveler.title} {traveler.firstName} {traveler.lastName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Payment ID</span>
                  <strong className="text-slate-900 truncate block">{confirmedBooking.payment?.transactionId}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Total Paid</span>
                  <strong className="text-brand-600 font-extrabold">{formatCurrency(confirmedBooking.totalPrice, currency, exchangeRates)}</strong>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => setETicketOpen(true)}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Print / Save Ticket
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  onClose();
                  navigate('/my-bookings');
                }}
                className="gap-2 font-bold px-6"
              >
                <Ticket className="h-4 w-4" />
                View in My Bookings
              </Button>
            </div>

            {/* Official E-ticket print modal */}
            <ETicketModal
              booking={confirmedBooking}
              isOpen={eTicketOpen}
              onClose={() => setETicketOpen(false)}
            />
          </div>
        )}

        {/* Inline Wallet Top-Up Modal */}
        <WalletTopUpModal
          isOpen={topUpModalOpen}
          onClose={() => setTopUpModalOpen(false)}
          requiredAmount={finalPrice}
          onSuccess={() => {
            setError('');
          }}
        />
      </div>
    </Modal>
  );
};
