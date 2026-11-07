import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookmarkCheck,
  Plane,
  Building2,
  Palmtree,
  Printer,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { ETicketModal } from '../components/booking/ETicketModal.jsx';
import api from '../api/axios.js';

export const MyBookingsPage = () => {
  const navigate = useNavigate();
  const { user, currency, exchangeRates, openAuthModal } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [selectedTicketBooking, setSelectedTicketBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings');
      if (res.data?.data) {
        setBookings(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchBookings();
  }, [user]);

  const handleCancelBooking = async (bookingId) => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this booking? This action cannot be reversed.');
    if (!confirmCancel) return;

    setActionLoading(bookingId);
    setError('');

    try {
      const res = await api.patch(`/bookings/${bookingId}/cancel`);
      if (res.data?.data) {
        setBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, status: 'CANCELLED' } : b)));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel booking.');
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md w-full shadow-sm space-y-4">
          <div className="h-14 w-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
            <BookmarkCheck className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Sign in to view your bookings</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Please log in to your Travel account to view your confirmed flights, hotel stays, and e-tickets.
          </p>
          <Button
            variant="primary"
            onClick={() => openAuthModal('login')}
            className="w-full font-bold"
          >
            Sign In / Register
          </Button>
        </div>
      </div>
    );
  }

  const filteredBookings = bookings.filter((b) => {
    if (filterType === 'all') return true;
    return b.type === filterType;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Travel Bookings
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage your upcoming trips, download e-tickets, and review past journeys.
            </p>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            {['all', 'flight', 'hotel', 'package'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors capitalize ${
                  filterType === type
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {type === 'all' ? 'All Bookings' : `${type}s`}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 space-y-4">
            <BookmarkCheck className="h-12 w-12 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-base text-slate-900">No bookings found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven&apos;t booked any flights, hotels, or packages yet. Plan your next adventure now!
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button size="sm" variant="primary" onClick={() => navigate('/flights')}>
                Explore Flights
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/hotels')}>
                Browse Hotels
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((b) => {
              const item = b.itemDetails || {};
              const traveler = b.travelers?.[0] || {};
              const isFlight = b.type === 'flight';
              const isHotel = b.type === 'hotel';
              const isCancelled = b.status === 'CANCELLED';

              return (
                <div
                  key={b._id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
                >
                  {/* Top Bar: Reference + Status + Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                        {isFlight ? <Plane className="h-4 w-4" /> : isHotel ? <Building2 className="h-4 w-4" /> : <Palmtree className="h-4 w-4" />}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Booking Reference (PNR)
                        </span>
                        <span className="text-sm font-black text-slate-900 tracking-wider">
                          {b.bookingReference}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">
                        Booked on {formatDate(b.createdAt)}
                      </span>
                      <Badge variant={isCancelled ? 'danger' : 'success'} size="sm">
                        {b.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Booking content detail */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        {item.title || item.name || `${item.airline} (${item.origin?.code} → ${item.destination?.code})`}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.selectedRoom?.name || (item.cabinClass && `${item.cabinClass} Class`) || item.destination}
                      </p>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <p>
                        <span className="text-slate-400 font-medium">Primary Traveler:</span>{' '}
                        <strong>{traveler.title} {traveler.firstName} {traveler.lastName}</strong>
                      </p>
                      <p>
                        <span className="text-slate-400 font-medium">Contact:</span>{' '}
                        {b.contactInfo?.email} • {b.contactInfo?.phone}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Amount</span>
                      <span className="text-xl font-black text-brand-600">
                        {formatCurrency(b.totalPrice, currency, exchangeRates)}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold block">
                        Paid via {b.payment?.method || 'Card'}
                      </span>
                    </div>
                  </div>

                  {/* Actions bar */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Transaction: {b.payment?.transactionId}
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTicketBooking(b)}
                        className="text-xs gap-1.5"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Print E-ticket
                      </Button>

                      {!isCancelled && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={actionLoading === b._id}
                          onClick={() => handleCancelBooking(b._id)}
                          className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        >
                          Cancel Booking
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Official Printable E-Ticket & Boarding Pass Voucher Modal */}
        <ETicketModal
          booking={selectedTicketBooking}
          isOpen={Boolean(selectedTicketBooking)}
          onClose={() => setSelectedTicketBooking(null)}
        />
      </div>
    </div>
  );
};
