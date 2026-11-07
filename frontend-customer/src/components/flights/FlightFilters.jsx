import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';

export const FlightFilters = ({
  filters,
  onChange,
  onReset,
  availableAirlines = [],
}) => {
  const { currency, exchangeRates } = useAuth();

  const handleStopChange = (stopValue) => {
    onChange({ ...filters, stops: stopValue });
  };

  const handleAirlineToggle = (airlineName) => {
    const current = filters.airlines || [];
    const updated = current.includes(airlineName)
      ? current.filter((a) => a !== airlineName)
      : [...current, airlineName];
    onChange({ ...filters, airlines: updated });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-brand-600" />
          <h3 className="font-bold text-sm text-slate-900">Filter Flights</h3>
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

      {/* Stops Filter */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
          Number of Stops
        </label>
        <div className="space-y-1.5 text-xs text-slate-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="filterStops"
              checked={filters.stops === 'all' || !filters.stops}
              onChange={() => handleStopChange('all')}
              className="text-brand-500 focus:ring-brand-500 h-3.5 w-3.5"
            />
            <span>All Flights</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="filterStops"
              checked={filters.stops === '0'}
              onChange={() => handleStopChange('0')}
              className="text-brand-500 focus:ring-brand-500 h-3.5 w-3.5"
            />
            <span>Non-stop Only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="filterStops"
              checked={filters.stops === '1'}
              onChange={() => handleStopChange('1')}
              className="text-brand-500 focus:ring-brand-500 h-3.5 w-3.5"
            />
            <span>1 Stop</span>
          </label>
        </div>
      </div>

      {/* Max Price Range Slider */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Max Price
          </label>
          <span className="text-xs font-bold text-brand-600">
            {formatCurrency(filters.maxPrice || 1500, currency, exchangeRates)}
          </span>
        </div>
        <input
          type="range"
          min="50"
          max="1500"
          step="25"
          value={filters.maxPrice || 1500}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-brand-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
          <span>{formatCurrency(50, currency, exchangeRates)}</span>
          <span>{formatCurrency(1500, currency, exchangeRates)}</span>
        </div>
      </div>

      {/* Airlines Filter */}
      {availableAirlines.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Airlines
          </label>
          <div className="space-y-1.5 text-xs text-slate-700 max-h-48 overflow-y-auto">
            {availableAirlines.map((airline) => {
              const isChecked = (filters.airlines || []).includes(airline);
              return (
                <label key={airline} className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleAirlineToggle(airline)}
                    className="rounded text-brand-500 focus:ring-brand-500 h-3.5 w-3.5"
                  />
                  <span>{airline}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
