import { useState } from 'react';
import { Clock, Luggage, Armchair } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatCurrency, formatTime, formatDate } from '../../utils/formatters.js';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { SeatMapModal } from '../features/SeatMapModal.jsx';

export const FlightDetailModal = ({ flight, isOpen, onClose, onBook }) => {
  const { currency, exchangeRates } = useAuth();
  const [seatMapOpen, setSeatMapOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);

  if (!flight) return null;

  const baseFare = Math.round(flight.price * 0.82);
  const taxesFees = flight.price - baseFare;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Flight & Fare Details"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Header summary */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-sm">
                {flight.airlineCode}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">{flight.airline}</h4>
                <p className="text-xs text-slate-500">Flight {flight.flightNumber} • {flight.cabinClass}</p>
              </div>
            </div>
            <Badge variant={flight.refundable ? 'success' : 'neutral'}>
              {flight.refundable ? 'Fully Refundable' : 'Non-refundable'}
            </Badge>
          </div>

          {/* Flight Route Timeline */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-3 font-semibold">
              <span>Departure: {formatDate(flight.departureTime)}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Total Flight Time: {flight.duration}</span>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-300">
              {/* Origin Node */}
              <div className="relative">
                <div className="absolute -left-[22px] top-1 h-3.5 w-3.5 rounded-full bg-brand-500 border-2 border-white" />
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-base font-extrabold text-slate-900 leading-tight">
                      {formatTime(flight.departureTime)}
                    </p>
                    <p className="text-xs font-bold text-slate-700">{flight.origin.city} ({flight.origin.code})</p>
                    <p className="text-[11px] text-slate-400">{flight.origin.airport}</p>
                  </div>
                </div>
              </div>

              {/* Stopover notice if any */}
              {flight.stops > 0 && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                  Transit Stop: {flight.stopoverCities?.join(', ') || 'Intermediate Airport'} • Layover duration approx. 1h 45m
                </div>
              )}

              {/* Destination Node */}
              <div className="relative">
                <div className="absolute -left-[22px] top-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-base font-extrabold text-slate-900 leading-tight">
                      {formatTime(flight.arrivalTime)}
                    </p>
                    <p className="text-xs font-bold text-slate-700">{flight.destination.city} ({flight.destination.code})</p>
                    <p className="text-[11px] text-slate-400">{flight.destination.airport}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Baggage & Fare Inclusions + Seat Map Teaser */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Luggage className="h-4 w-4 text-brand-500" />
                <span>Baggage Allowance</span>
              </div>
              <p className="text-xs text-slate-600">Check-in baggage: <strong>{flight.baggage}</strong></p>
              <p className="text-xs text-slate-600">Cabin baggage: <strong>1 x 7 kg</strong></p>
            </div>

            <div className="p-3.5 border border-slate-200 rounded-xl space-y-1.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Armchair className="h-4 w-4 text-brand-500" />
                  <span>Cabin Seating</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {selectedSeat ? (
                    <span className="text-brand-600 font-bold">Selected Seat: {selectedSeat}</span>
                  ) : (
                    <span>{flight.seatsAvailable} seats available</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSeatMapOpen(true)}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 self-start pt-1"
              >
                <span>Preview Seat Map</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Fare Breakdown & Checkout Action */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto text-left">
              <p className="text-xs text-slate-400 font-semibold">Total Fare (Taxes & Surcharges incl.)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-brand-600">
                  {formatCurrency(flight.price, currency, exchangeRates)}
                </span>
                <span className="text-xs text-slate-500">
                  (Base: {formatCurrency(baseFare, currency, exchangeRates)} + Tax: {formatCurrency(taxesFees, currency, exchangeRates)})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Close
              </Button>
              <Button
                variant="accent"
                onClick={() => { onClose(); onBook(flight); }}
                className="w-full sm:w-auto font-bold px-6"
              >
                Book This Flight
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Interactive Seat Selection Modal */}
      <SeatMapModal
        isOpen={seatMapOpen}
        onClose={() => setSeatMapOpen(false)}
        flight={{
          airline: flight.airline,
          flightNumber: flight.flightNumber,
          origin: flight.origin.code,
          originCity: flight.origin.city,
          destination: flight.destination.code,
          destinationCity: flight.destination.city,
        }}
        onConfirmSeat={(seat) => setSelectedSeat(seat)}
      />
    </>
  );
};
