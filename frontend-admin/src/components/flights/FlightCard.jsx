import {
  Plane,
  Clock,
  Luggage,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatCurrency, formatTime } from '../../utils/formatters.js';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';

export const FlightCard = ({
  flight,
  onSelect,
  onViewDetails,
  isSelected = false,
}) => {
  const { currency, exchangeRates } = useAuth();

  const formattedPrice = formatCurrency(flight.price, currency, exchangeRates);

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 p-5 group relative ${
      isSelected
        ? 'border-brand-500 ring-2 ring-brand-500/30 bg-brand-50/15 shadow-md'
        : 'border-slate-200/80 shadow-sm hover:shadow-md'
    }`}
    >
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
        {/* Left Airline Info */}
        <div className="flex items-center gap-3.5 min-w-[200px]">
          <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-center text-brand-600 font-extrabold text-xs shadow-inner">
            {flight.airlineCode}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-brand-600 transition-colors">
                {flight.airline}
              </h4>
              {isSelected && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-brand-600 text-white flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Selected
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Flight {flight.flightNumber} • {flight.cabinClass}
            </span>
          </div>
        </div>

        {/* Center Flight Time & Route Track */}
        <div className="flex-1 flex items-center justify-between max-w-lg mx-auto w-full px-2 sm:px-6">
          {/* Departure */}
          <div className="text-left min-w-[70px]">
            <span className="text-lg sm:text-xl font-black text-slate-900 block leading-tight">
              {formatTime(flight.departureTime)}
            </span>
            <span className="text-xs font-bold text-slate-600 block">{flight.origin.code}</span>
            <span className="text-[11px] text-slate-400 block truncate max-w-[100px]">{flight.origin.city}</span>
          </div>

          {/* Duration Graphic */}
          <div className="flex-1 px-4 text-center">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              {flight.duration}
            </span>
            <div className="relative my-2">
              <div className="h-[2px] w-full bg-slate-200" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                <Plane className="h-3.5 w-3.5 text-brand-500 rotate-90" />
              </div>
            </div>
            <span className={`text-[11px] font-bold ${flight.stops === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop (${flight.stopoverCities?.join(', ') || 'Transit'})`}
            </span>
          </div>

          {/* Arrival */}
          <div className="text-right min-w-[70px]">
            <span className="text-lg sm:text-xl font-black text-slate-900 block leading-tight">
              {formatTime(flight.arrivalTime)}
            </span>
            <span className="text-xs font-bold text-slate-600 block">{flight.destination.code}</span>
            <span className="text-[11px] text-slate-400 block truncate max-w-[100px]">{flight.destination.city}</span>
          </div>
        </div>

        {/* Right Pricing & Actions */}
        <div className="flex sm:flex-row lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 min-w-[170px]">
          <div className="text-left lg:text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Price per traveler</span>
            <div className="flex items-baseline gap-1 lg:justify-end">
              <span className="text-2xl font-black text-brand-600 tracking-tight">{formattedPrice}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 lg:justify-end">
              <Badge variant={flight.refundable ? 'success' : 'neutral'} size="xs">
                {flight.refundable ? 'Refundable' : 'Non-refundable'}
              </Badge>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Luggage className="h-3 w-3 text-slate-400" />
                {flight.baggage}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 w-full sm:w-auto lg:w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(flight)}
              className="text-xs flex-1 lg:flex-none"
            >
              Details
            </Button>
            <Button
              variant={isSelected ? 'primary' : 'accent'}
              size="sm"
              onClick={() => onSelect(flight)}
              className={`text-xs font-bold flex-1 ${
                isSelected ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-md' : ''
              }`}
            >
              {isSelected ? 'Flight Selected' : 'Select Flight'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
