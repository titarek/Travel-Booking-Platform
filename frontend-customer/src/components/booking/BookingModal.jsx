import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Ticket,
  Printer,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import { Modal } from '../ui/Modal.jsx';
import { Input } from '../ui/Input.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { ETicketModal } from './ETicketModal.jsx';
import { FlightRadarMap } from '../flights/FlightRadarMap.jsx';
import api from '../../api/axios.js';

export const BookingModal = ({
  item,
  type = 'flight', // 'flight' | 'hotel' | 'package'
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { user, currency, exchangeRates, openAuthModal } = useAuth();

  const [step, setStep] = useState(1); // 1: Travelers, 2: Payment, 3: Confirmation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [eTicketOpen, setETicketOpen] = useState(false);

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
  const [paymentMethod, setPaymentMethod] = useState('Credit/Debit Card');

  // Confirmation result
  const [confirmedBooking, setConfirmedBooking] = useState(null);

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

  const handleCreateBooking = async () => {
    if (!user) {
      openAuthModal('login');
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
        paymentMethod,
      };

      const res = await api.post('/bookings', payload);
      if (res.data?.data) {
        setConfirmedBooking(res.data.data);
        setStep(3); // Confirmation
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to complete booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 3 ? 'Booking Confirmed!' : `Complete Your ${type.charAt(0).toUpperCase() + type.slice(1)} Booking`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Step Progress Indicator */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 1 ? 'bg-brand-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}
            >
              1
            </span>
            <span className="text-xs font-semibold text-slate-700">Passenger Info</span>
          </div>

          <div className="h-0.5 w-12 bg-slate-200" />

          <div className="flex items-center gap-2">
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 2 ? 'bg-brand-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}
            >
              2
            </span>
            <span className="text-xs font-semibold text-slate-700">Review & Payment</span>
          </div>

          <div className="h-0.5 w-12 bg-slate-200" />

          <div className="flex items-center gap-2">
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 3 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}
            >
              3
            </span>
            <span className="text-xs font-semibold text-slate-700">Confirmation</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Selected Item Summary Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                {type}
              </span>
              <h4 className="font-extrabold text-sm text-slate-900">
                {item.title || item.name || `${item.airline} (${item.origin?.code} → ${item.destination?.code})`}
              </h4>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {item.selectedRoom?.name || (item.cabinClass && `${item.cabinClass} Class`) || item.destination}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-brand-600">
              {formatCurrency(finalPrice, currency, exchangeRates)}
            </span>
            <span className="text-[10px] text-slate-400 block">Total Payable</span>
          </div>
        </div>

        {/* Live Flight Radar Map for Flight Bookings */}
        {type === 'flight' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Radar Route & Aircraft Telemetry
              </span>
              <span className="text-[10px] text-slate-500 font-mono font-semibold">
                {item.flightNumber || 'FLIGHT'}
              </span>
            </div>
            <FlightRadarMap
              flight={item}
              className="h-44 sm:h-52 w-full rounded-2xl border border-slate-200/90 shadow-inner overflow-hidden"
            />
          </div>
        )}

        {/* STEP 1: Traveler Details */}
        {step === 1 && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Primary Traveler Details</h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Title</label>
                <select
                  value={traveler.title}
                  onChange={(e) => setTraveler({ ...traveler, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-xs font-semibold bg-white"
                >
                  <option value="Mr">Mr.</option>
                  <option value="Mrs">Mrs.</option>
                  <option value="Ms">Ms.</option>
                  <option value="Dr">Dr.</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <Input
                  label="First & Given Name"
                  value={traveler.firstName}
                  onChange={(e) => setTraveler({ ...traveler, firstName: e.target.value })}
                  placeholder="e.g. Tanvir"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Last Name / Surname"
                value={traveler.lastName}
                onChange={(e) => setTraveler({ ...traveler, lastName: e.target.value })}
                placeholder="e.g. Ahmed"
                required
              />

              <Input
                label="Date of Birth"
                type="date"
                value={traveler.dateOfBirth}
                onChange={(e) => setTraveler({ ...traveler, dateOfBirth: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Passport / National ID Number"
                value={traveler.passportNumber}
                onChange={(e) => setTraveler({ ...traveler, passportNumber: e.target.value })}
                placeholder="e.g. A08291048"
              />

              <Input
                label="Nationality"
                value={traveler.nationality}
                onChange={(e) => setTraveler({ ...traveler, nationality: e.target.value })}
                placeholder="e.g. Bangladeshi"
              />
            </div>

            <h4 className="text-sm font-bold text-slate-900 pt-2">Contact & E-ticket Delivery</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Email Address (for ticket)"
                type="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                required
              />

              <Input
                label="Mobile Number"
                type="tel"
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                required
              />
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep(2)}
                className="font-bold px-6"
              >
                Proceed to Payment
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Payment Simulation */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Promo Code section */}
            <div className="p-4 bg-brand-50/50 rounded-2xl border border-brand-100 space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-brand-600" />
                <span>Have a Promo Code? (Try &quot;TRAVEL20&quot;)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl uppercase font-bold focus:outline-none focus:border-brand-500"
                />
                <Button size="sm" variant="outline" onClick={handleApplyPromo}>
                  Apply
                </Button>
              </div>
              {promoMessage && (
                <p className={`text-xs font-semibold ${discountPercent > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {promoMessage}
                </p>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900">Choose Payment Method</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {['Credit/Debit Card', 'bKash / Mobile Wallet', 'Internet Banking'].map((method) => (
                  <div
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                      paymentMethod === method
                        ? 'border-brand-500 bg-brand-50/60 font-bold text-brand-700 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span className="text-xs block">{method}</span>
                  </div>
                ))}
              </div>
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
                <span>Taxes & Carrier Surcharges</span>
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
              <Button
                variant="accent"
                onClick={handleCreateBooking}
                loading={loading}
                className="font-bold px-8 shadow-md hover:shadow-lg"
              >
                Pay & Confirm Booking
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Booking Confirmation Screen */}
        {step === 3 && confirmedBooking && (
          <div className="space-y-6 text-center py-4">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900">Booking Submitted!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your reservation has been received and is <strong>pending confirmation</strong> by our operations team.
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
      </div>
    </Modal>
  );
};
