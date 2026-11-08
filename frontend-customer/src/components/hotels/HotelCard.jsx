import { Star, MapPin, Navigation } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';

export const HotelCard = ({ hotel, onSelect, onViewDetails }) => {
  const { currency, exchangeRates } = useAuth();

  const formattedPrice = formatCurrency(hotel.pricePerNight, currency, exchangeRates);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col md:flex-row group w-full">
      {/* Thumbnail with overlay badges */}
      <div className="relative md:w-72 h-52 md:h-auto shrink-0 overflow-hidden">
        <img
          src={hotel.thumbnail || hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80'}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {hotel.featured && (
          <div className="absolute top-3 left-3">
            <Badge variant="accent" size="xs" className="font-bold shadow-sm">
              Top Rated
            </Badge>
          </div>
        )}
        {hotel.freeCancellation && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2 py-0.5 rounded-md bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-bold">
              Free Cancellation
            </span>
          </div>
        )}
      </div>

      {/* Main Hotel Info */}
      <div className="p-5 flex-1 min-w-0 flex flex-col justify-between">
        <div className="space-y-2 min-w-0">
          {/* Star rating & city */}
          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1 text-amber-400 shrink-0">
              {Array.from({ length: hotel.starRating || 4 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-bold text-slate-800">
                {hotel.reviewScore >= 4.7 ? 'Superb' : 'Very Good'}
              </span>
              <span className="h-5 px-1.5 rounded-md bg-brand-500 text-white font-extrabold text-xs flex items-center justify-center">
                {hotel.reviewScore?.toFixed(1) || '4.5'}
              </span>
              <span className="text-[10px] text-slate-400">({hotel.reviewCount} reviews)</span>
            </div>
          </div>

          <h3
            onClick={() => onViewDetails(hotel)}
            className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors cursor-pointer line-clamp-1 break-words"
            title={hotel.name}
          >
            {hotel.name}
          </h3>

          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <p className="text-xs text-slate-500 flex items-center gap-1 min-w-0 max-w-full">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{hotel.address || hotel.city}</span>
            </p>
            {hotel.distanceKm !== undefined && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200/60 shrink-0">
                <Navigation className="h-2.5 w-2.5 text-brand-600 shrink-0" />
                <span>{hotel.distanceKm} km from center</span>
                {hotel.district && <span className="text-slate-400">• {hotel.district}</span>}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-1 break-words">
            {hotel.description}
          </p>

          {/* Amenities Badges */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {(hotel.amenities || []).slice(0, 4).map((amenity) => (
              <span
                key={amenity}
                className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing and CTAs */}
        <div className="pt-4 mt-3 border-t border-slate-100 flex items-end justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Starts from</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-brand-600">{formattedPrice}</span>
              <span className="text-[11px] text-slate-400">/ night</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold block truncate">Includes taxes and fees</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(hotel)}
              className="text-xs shrink-0"
            >
              Details
            </Button>
            <Button
              variant="accent"
              size="sm"
              onClick={() => onSelect(hotel)}
              className="text-xs font-bold shrink-0"
            >
              Book Room
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
