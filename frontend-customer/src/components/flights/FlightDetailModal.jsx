import { useState } from 'react';
import { Clock, Luggage, Armchair } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatCurrency, formatTime, formatDate } from '../../utils/formatters.js';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { SeatMapModal } from '../features/SeatMapModal.jsx';
import { FlightRadarMap } from './FlightRadarMap.jsx';

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

          {/* Live Flight Route & Radar Map */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
              <span>Departure: {formatDate(flight.departureTime)} ({flight.origin.code} &rarr; {flight.destination.code})</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-brand-500" /> Total Flight Time: {flight.duration}</span>
            </div>
            <FlightRadarMap
              flight={flight}
              statusData={{
                origin: flight.origin.code,
                originCity: flight.origin.city,
                destination: flight.destination.code,
                destinationCity: flight.destination.city,
                flightNumber: flight.flightNumber,
                scheduledDep: formatTime(flight.departureTime),
                scheduledArr: formatTime(flight.arrivalTime),
                status: flight.status || 'In Flight',
              }}
              height="h-56 sm:h-64"
            />
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
