import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';

export const HotelFilters = ({
  filters,
  onChange,
  onReset,
}) => {
  const { currency, exchangeRates } = useAuth();

  const handleStarRatingChange = (rating) => {
    onChange({ ...filters, minRating: filters.minRating === rating ? '' : rating });
  };

  const handleAmenityToggle = (amenity) => {
    const current = filters.amenities ? filters.amenities.split(',').filter(Boolean) : [];
    const updated = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    onChange({ ...filters, amenities: updated.join(',') });
  };

  const amenitiesList = [
    'Free WiFi',
    'Swimming Pool',
    'Beachfront Access',
    'Spa & Wellness',
    'Complimentary Breakfast',
    'Airport Shuttle',
    'Gym & Fitness',
  ];

  const currentAmenities = filters.amenities ? filters.amenities.split(',') : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-brand-600" />
          <h3 className="font-bold text-sm text-slate-900">Filter Hotels</h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      {/* Guest Rating / Star Rating */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
          Minimum Rating
        </label>
        <div className="flex flex-wrap gap-1.5">
          {['4.8', '4.5', '4.0'].map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => handleStarRatingChange(score)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filters.minRating === score
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              ★ {score}+
            </button>
          ))}
        </div>
      </div>

      {/* Max Price Slider */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Max Price / Night
          </label>
          <span className="text-xs font-bold text-brand-600">
            {formatCurrency(filters.maxPrice || 800, currency, exchangeRates)}
          </span>
        </div>
        <input
          type="range"
          min="50"
          max="800"
          step="25"
          value={filters.maxPrice || 800}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-brand-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
          <span>{formatCurrency(50, currency, exchangeRates)}</span>
          <span>{formatCurrency(800, currency, exchangeRates)}</span>
        </div>
      </div>

      {/* Free Cancellation Toggle */}
      <div className="pt-2 border-t border-slate-100">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-800 font-semibold">
          <input
            type="checkbox"
            checked={filters.freeCancellation === 'true'}
            onChange={(e) => onChange({ ...filters, freeCancellation: e.target.checked ? 'true' : '' })}
            className="rounded text-brand-500 focus:ring-brand-500 h-4 w-4"
          />
          <span>Free Cancellation Only</span>
        </label>
      </div>

      {/* Popular Amenities */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
          Hotel Amenities
        </label>
        <div className="space-y-1.5 text-xs text-slate-700">
          {amenitiesList.map((amenity) => (
            <label key={amenity} className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
              <input
                type="checkbox"
                checked={currentAmenities.includes(amenity)}
                onChange={() => handleAmenityToggle(amenity)}
                className="rounded text-brand-500 focus:ring-brand-500 h-3.5 w-3.5"
              />
              <span>{amenity}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
