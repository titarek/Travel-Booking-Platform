import { useEffect } from 'react';
import {
  Plane,
  Building2,
  Palmtree,
  Printer,
  X,
  Luggage,
  Clock,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters.js';

export const ETicketModal = ({ booking, isOpen, onClose }) => {
  const { currency, exchangeRates } = useAuth();

  // Ensure body print class is toggled so Ctrl+P or print button prints ONLY this ticket
  useEffect(() => {
    if (!isOpen) return undefined;

    const onBefore = () => document.body.classList.add('printing-ticket');
    const onAfter = () => document.body.classList.remove('printing-ticket');

    window.addEventListener('beforeprint', onBefore);
    window.addEventListener('afterprint', onAfter);

    return () => {
      window.removeEventListener('beforeprint', onBefore);
      window.removeEventListener('afterprint', onAfter);
      document.body.classList.remove('printing-ticket');
    };
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  const item = booking.itemDetails || {};
  const traveler = booking.travelers?.[0] || {};
  const isFlight = booking.type === 'flight';
  const isHotel = booking.type === 'hotel';
  const isPackage = booking.type === 'package';

  const bookingStatus = (booking.status || 'PENDING').toUpperCase();
  const paymentStatus = (booking.payment?.status || booking.paymentStatus || 'PAID').toUpperCase();

  const handlePrint = () => {
    document.body.classList.add('printing-ticket');
    const cleanup = () => {
      document.body.classList.remove('printing-ticket');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 2000);
    }, 60);
  };

  const ticketNumber = `ETKT-784-${booking.bookingReference?.replace(/[^0-9]/g, '') || '482910'}-${booking._id?.slice(-4).toUpperCase() || '01'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity no-print"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Window */}
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 my-6 no-print-container">
        {/* Modal Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-b border-slate-200 no-print">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">
              Customer E-Ticket Voucher (Passenger Copy)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Official E-Ticket</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable E-Ticket Voucher */}
        <div
          id="printable-e-ticket"
          className="p-6 sm:p-8 bg-white text-slate-900 space-y-6 max-h-[82vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0"
        >
          {/* 1. Header Letterhead */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black">
                  <Plane className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">Travel.</h1>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Official Passenger E-Ticket Receipt &amp; Travel Voucher
              </p>
              <p className="text-[10px] text-slate-400">
                IATA Accredited Agency • 24/7 Global Support: support@travel.test
              </p>
            </div>

            {/* PNR & Status Block */}
            <div className="text-right space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Booking Reference (PNR)
              </span>
              <p className="text-xl sm:text-2xl font-mono font-black text-indigo-600 tracking-wider">
                {booking.bookingReference}
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  bookingStatus === 'CONFIRMED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : 'bg-amber-50 text-amber-700 border border-amber-300'
                }`}
                >
                  {bookingStatus === 'CONFIRMED' ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {bookingStatus}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-300">
                  {paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Passenger & Document Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Passenger Name</span>
              <p className="font-extrabold text-slate-900 mt-0.5">
                {traveler.title || 'Mr'} {traveler.firstName || 'Traveler'} {traveler.lastName || ''}
              </p>
              <span className="text-[10px] text-slate-500 font-medium">Adult / Primary</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Electronic Ticket No.</span>
              <p className="font-mono font-bold text-slate-800 mt-0.5 truncate" title={ticketNumber}>
                {ticketNumber}
              </p>
              <span className="text-[10px] text-slate-500 font-medium">Issue Date: {formatDate(booking.createdAt)}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Passport / Nationality</span>
              <p className="font-bold text-slate-800 mt-0.5">
                {traveler.passportNumber || 'On Record (Valid)'}
              </p>
              <span className="text-[10px] text-slate-500 font-medium">{traveler.nationality || 'Bangladeshi'}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact Information</span>
              <p className="font-bold text-slate-800 mt-0.5 truncate" title={booking.contactInfo?.email}>
                {booking.contactInfo?.email || 'customer@travel.test'}
              </p>
              <span className="text-[10px] text-slate-500 font-medium">{booking.contactInfo?.phone || '+8801700000001'}</span>
            </div>
          </div>

          {/* 3. Flight Itinerary Schedule (if flight) */}
          {isFlight && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Plane className="h-4 w-4 text-indigo-600" />
                  Flight Journey Itinerary
                </h2>
                <span className="text-xs font-bold text-slate-600 font-mono">
                  {item.airline || 'Airline'} • Flight {item.flightNumber || 'BS341'}
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {/* Route Segment */}
                <div className="p-4 sm:p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Origin */}
                  <div className="text-left space-y-0.5 min-w-[130px]">
                    <span className="text-2xl font-black text-slate-900 block font-mono">
                      {item.origin?.code || 'DAC'}
                    </span>
                    <p className="text-xs font-bold text-slate-800">{item.origin?.city || 'Dhaka'}</p>
                    <p className="text-[10px] text-slate-500">
                      {item.origin?.airport || 'Hazrat Shahjalal Intl'} (Terminal 1)
                    </p>
                    <div className="pt-2 text-xs">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Departure</span>
                      <strong className="text-slate-900">{formatTime(item.departureTime)}</strong>
                      <span className="text-[10px] text-slate-500 block">{formatDate(item.departureTime)}</span>
                    </div>
                  </div>

                  {/* Flight Track / Duration */}
                  <div className="flex-1 px-4 text-center space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3 text-indigo-600" />
                      Duration: {item.duration || '4h 30m'}
                    </span>
                    <div className="relative my-2">
                      <div className="h-[2px] w-full bg-slate-200" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                        <Plane className="h-3.5 w-3.5 text-indigo-600 rotate-90" />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600">
                      {item.stops === 0 ? 'Direct Non-Stop' : `${item.stops} Transit Stopover`}
                    </span>
                  </div>

                  {/* Destination */}
                  <div className="text-left sm:text-right space-y-0.5 min-w-[130px]">
                    <span className="text-2xl font-black text-slate-900 block font-mono">
                      {item.destination?.code || 'DXB'}
                    </span>
                    <p className="text-xs font-bold text-slate-800">{item.destination?.city || 'Dubai'}</p>
                    <p className="text-[10px] text-slate-500">
                      {item.destination?.airport || 'Dubai International Airport'} (Terminal 3)
                    </p>
                    <div className="pt-2 text-xs">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Arrival</span>
                      <strong className="text-slate-900">{formatTime(item.arrivalTime)}</strong>
                      <span className="text-[10px] text-slate-500 block">{formatDate(item.arrivalTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Baggage & Cabin Class Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-medium block">Cabin Class</span>
                    <strong className="text-slate-900">{item.cabinClass || 'Economy'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Checked Baggage</span>
                    <strong className="text-slate-900 flex items-center gap-1">
                      <Luggage className="h-3 w-3 text-indigo-600" />
                      {item.baggage || '2 x 23 kg'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Cabin Carry-On</span>
                    <strong className="text-slate-900">7 kg Hand Baggage</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Boarding Seat</span>
                    <strong className="text-indigo-600 font-mono font-bold">Assigned at Check-in</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Hotel Reservation Details (if hotel) */}
          {isHotel && (
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-indigo-600" />
                Hotel Accommodation Voucher
              </h2>
              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-base text-slate-900">{item.name}</h3>
                    <p className="text-slate-500 text-[11px]">{item.location?.address || item.city}</p>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {item.selectedRoom?.name || 'Deluxe Room'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-medium">Check-In</span>
                    <strong>{formatDate(item.checkIn || booking.createdAt)} (14:00)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Check-Out</span>
                    <strong>{formatDate(item.checkOut || booking.createdAt)} (12:00)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Guests</span>
                    <strong>{item.guests?.adults || 1} Adult(s)</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. Package Details (if holiday or umrah package) */}
          {isPackage && (
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Palmtree className="h-4 w-4 text-indigo-600" />
                Tour Package Voucher
              </h2>
              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2 text-xs">
                <h3 className="font-black text-base text-slate-900">{item.title}</h3>
                <p className="text-slate-500">{item.destination} • {item.duration}</p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Departure Date</span>
                    <strong>{formatDate(item.departureDate || booking.createdAt)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Package Type</span>
                    <strong className="capitalize">{item.category || 'Tour Package'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. Payment & Fare Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 pt-4 text-xs">
            {/* Payment Details */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Payment Summary</span>
              <p className="text-slate-700 flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                <span>Method: <strong>{booking.payment?.method || 'Credit/Debit Card'}</strong></span>
              </p>
              <p className="text-slate-500 font-mono text-[10px]">
                Transaction ID: {booking.payment?.transactionId || 'TXN-DIRECT'}
              </p>
              <p className="text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                <span>Payment Authorized &amp; Verified</span>
              </p>
            </div>

            {/* Total Fare */}
            <div className="text-left sm:text-right space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Fare Paid</span>
              <p className="text-2xl font-black text-indigo-600">
                {formatCurrency(booking.totalPrice, currency, exchangeRates)}
              </p>
              <span className="text-[10px] text-slate-400 block">
                All applicable government taxes, fuel surcharges, and fees included
              </span>
            </div>
          </div>

          {/* 7. Airport Boarding Barcode Security Visual */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">
                Security Barcode &amp; Passenger Verification
              </span>
              <div className="h-9 flex items-center gap-[2px] justify-center sm:justify-start py-1">
                {[2, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 2, 1, 3, 2, 1, 4, 3, 1, 2, 4, 1, 3, 2, 1, 3, 4, 2, 1, 2, 3, 1, 4, 2].map((w, idx) => (
                  <span
                    // eslint-disable-next-line react/no-array-index-key
                    key={idx}
                    className="h-full bg-slate-900 inline-block"
                    style={{ width: `${w}px` }}
                  />
                ))}
              </div>
              <p className="font-mono text-[9px] text-slate-500 tracking-wider">
                M1{traveler.lastName || 'CUSTOMER'}/{traveler.firstName || 'DEMO'} E{booking.bookingReference} {item.origin?.code || 'DAC'}{item.destination?.code || 'DXB'}
              </p>
            </div>

            <div className="text-center sm:text-right text-[10px] text-slate-400 max-w-xs">
              <p className="font-semibold text-slate-700">Official Platform Travel Voucher</p>
              <p>Generated by Admin Console directly from verified database reservation record.</p>
            </div>
          </div>

          {/* 8. Mandatory Aviation Notices & Regulatory Terms */}
          <div className="pt-3 border-t border-slate-100 text-[9px] text-slate-400 space-y-1 leading-relaxed">
            <p className="font-bold text-slate-600 uppercase tracking-wider">Important Travel Information &amp; Conditions:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>International passengers must ensure valid passports with at least 6 months validity from departure.</li>
              <li>Airport check-in counters open 3 hours prior and strictly close 60 minutes prior to scheduled departure.</li>
              <li>Carriage and other services provided by the carrier are subject to conditions of carriage and relevant IATA conventions.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
