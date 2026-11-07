import { Calendar, MapPin, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';

export const PackageCard = ({ pkg, onSelect, onViewDetails }) => {
  const { currency, exchangeRates } = useAuth();

  const formattedPrice = formatCurrency(pkg.discountPrice || pkg.price, currency, exchangeRates);
  const formattedOriginalPrice = pkg.discountPrice ? formatCurrency(pkg.price, currency, exchangeRates) : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group">
      {/* Cover Image & Ribbons */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={pkg.image}
          alt={pkg.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge variant="default" size="xs" className="bg-slate-900/80 text-white border-transparent backdrop-blur-sm font-bold">
            <Calendar className="h-3 w-3 mr-1" />
            {pkg.durationDays}D / {pkg.durationNights}N
          </Badge>
          {pkg.badge && (
            <Badge variant="accent" size="xs" className="font-bold shadow-sm">
              {pkg.badge}
            </Badge>
          )}
        </div>
        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-md text-slate-900 text-xs font-bold shadow-sm flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-brand-500" />
            {pkg.destination}
          </span>
        </div>
      </div>

      {/* Package Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
              {pkg.category} Holiday
            </span>
          </div>

          <h3
            onClick={() => onViewDetails(pkg)}
            className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors cursor-pointer line-clamp-1"
          >
            {pkg.title}
          </h3>

          <ul className="space-y-1.5 pt-1">
            {(pkg.highlights || []).slice(0, 3).map((highlight) => (
              <li key={highlight} className="text-xs text-slate-600 flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing and Action */}
        <div className="pt-3 border-t border-slate-100 flex items-end justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Starts from</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-brand-600">{formattedPrice}</span>
              {formattedOriginalPrice && (
                <span className="text-xs text-slate-400 line-through font-semibold">
                  {formattedOriginalPrice}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block">per person</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(pkg)}
              className="text-xs"
            >
              Itinerary
            </Button>
            <Button
              variant="accent"
              size="sm"
              onClick={() => onSelect(pkg)}
              className="text-xs font-bold"
            >
              Book Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
