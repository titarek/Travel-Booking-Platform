import { useState } from 'react';
import { Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';

export const PackageDetailModal = ({ pkg, isOpen, onClose, onBook }) => {
  const { currency, exchangeRates } = useAuth();
  const [activeDay, setActiveDay] = useState(1);

  if (!pkg) return null;

  const priceToUse = pkg.discountPrice || pkg.price;
  const formattedPrice = formatCurrency(priceToUse, currency, exchangeRates);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={pkg.title}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Cover image banner */}
        <div className="h-60 rounded-2xl overflow-hidden relative shadow-inner">
          <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-5">
            <div className="text-white">
              <span className="text-xs font-bold bg-brand-500 px-2.5 py-1 rounded-md mb-2 inline-block">
                {pkg.category} Package
              </span>
              <h3 className="text-xl font-black">{pkg.title}</h3>
              <p className="text-xs text-sky-200 flex items-center gap-2 mt-1">
                <span>{pkg.destination}, {pkg.country}</span>
                <span>•</span>
                <span>{pkg.durationDays} Days / {pkg.durationNights} Nights</span>
              </p>
            </div>
          </div>
        </div>

        {/* Day-by-day Itinerary */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand-500" />
            <span>Tour Itinerary Breakdown</span>
          </h4>

          {/* Day tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(pkg.itinerary || []).map((day) => (
              <button
                key={day.day}
                type="button"
                onClick={() => setActiveDay(day.day)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  activeDay === day.day
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Day {day.day}
              </button>
            ))}
          </div>

          {/* Active day description */}
          {pkg.itinerary?.find((d) => d.day === activeDay) && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <h5 className="font-extrabold text-sm text-slate-900">
                Day {activeDay}: {pkg.itinerary.find((d) => d.day === activeDay).title}
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                {pkg.itinerary.find((d) => d.day === activeDay).description}
              </p>
            </div>
          )}
        </div>

        {/* Inclusions & Exclusions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-50/60 border border-emerald-200/60 rounded-2xl space-y-2">
            <h5 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>What&apos;s Included</span>
            </h5>
            <ul className="space-y-1.5 text-xs text-emerald-800">
              {(pkg.inclusions || []).map((inc) => (
                <li key={inc} className="flex items-start gap-1.5">
                  <span>✓</span>
                  <span>{inc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-rose-50/60 border border-rose-200/60 rounded-2xl space-y-2">
            <h5 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-rose-600" />
              <span>What&apos;s Excluded</span>
            </h5>
            <ul className="space-y-1.5 text-xs text-rose-800">
              {(pkg.exclusions || []).map((exc) => (
                <li key={exc} className="flex items-start gap-1.5">
                  <span>✕</span>
                  <span>{exc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pricing & Booking Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Package Cost (per person)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-brand-600">{formattedPrice}</span>
              <span className="text-xs text-slate-500">all taxes included</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Close
            </Button>
            <Button
              variant="accent"
              onClick={() => {
                onClose();
                onBook({
                  ...pkg,
                  price: priceToUse,
                });
              }}
              className="w-full sm:w-auto font-bold px-6"
            >
              Book Holiday Package
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
