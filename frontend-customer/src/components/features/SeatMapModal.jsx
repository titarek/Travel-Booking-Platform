import { useState } from 'react';
import { Plane, Check, X, ShieldAlert } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';

export const SeatMapModal = ({ isOpen, onClose, flight, onConfirmSeat }) => {
  const [selectedSeat, setSelectedSeat] = useState('12A');

  // Simulated 6-row aircraft cabin layout (A B C - D E F)
  const rows = [
    { rowNum: 10, category: 'Extra Legroom', extraCost: 1500 },
    { rowNum: 11, category: 'Extra Legroom', extraCost: 1500 },
    { rowNum: 12, category: 'Standard', extraCost: 0 },
    { rowNum: 14, category: 'Standard', extraCost: 0 },
    { rowNum: 15, category: 'Standard', extraCost: 0 },
    { rowNum: 16, category: 'Standard', extraCost: 0 },
  ];

  const occupiedSeats = ['10B', '10C', '11A', '12C', '14D', '15B', '16F'];

  const getSeatStatus = (seatId) => {
    if (occupiedSeats.includes(seatId)) return 'occupied';
    if (selectedSeat === seatId) return 'selected';
    return 'available';
  };

  const handleSeatClick = (seatId) => {
    if (!occupiedSeats.includes(seatId)) {
      setSelectedSeat(seatId);
    }
  };

  const getSeatCost = () => {
    if (!selectedSeat) return 0;
    const rowNum = parseInt(selectedSeat, 10);
    const row = rows.find((r) => r.rowNum === rowNum);
    return row ? row.extraCost : 0;
  };

  const handleSave = () => {
    if (onConfirmSeat) {
      onConfirmSeat(selectedSeat, getSeatCost());
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Aircraft Seat Selection Preview" size="lg">
      <div className="space-y-6">
        {/* Header flight indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-black">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-900">
                {flight?.airline || 'Biman Bangladesh'} • {flight?.flightNumber || 'BG-047'}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {flight?.originCity || 'Dhaka'} ({flight?.origin || 'DAC'}) → {flight?.destinationCity || 'Dubai'} ({flight?.destination || 'DXB'}) • Boeing 787-8
              </p>
            </div>
          </div>
          <Badge variant="accent" className="font-bold">
            Interactive Seat Map
          </Badge>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600 py-1 border-y border-slate-100">
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-md bg-brand-600 border border-brand-700 text-white flex items-center justify-center text-[10px]">
              <Check className="h-3 w-3" />
            </div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-md bg-white border border-slate-300" />
            <span>Available (Standard)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-md bg-amber-50 border border-amber-300 text-amber-700 font-bold flex items-center justify-center text-[9px]">
              +৳
            </div>
            <span>Extra Legroom (+৳1,500)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-md bg-slate-200 text-slate-400 flex items-center justify-center text-[10px]">
              <X className="h-3 w-3" />
            </div>
            <span>Occupied</span>
          </div>
        </div>

        {/* Aircraft Cabin Fuselage Layout */}
        <div className="max-w-md mx-auto bg-slate-100/70 p-5 rounded-3xl border border-slate-200">
          {/* Cockpit Indicator */}
          <div className="text-center pb-4 text-xs font-black uppercase text-slate-400 tracking-widest flex items-center justify-center gap-2">
            <span>Cockpit / Front</span>
          </div>

          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.rowNum} className="flex items-center justify-between gap-1">
                {/* Left Side: A, B, C */}
                <div className="flex items-center gap-1.5">
                  {['A', 'B', 'C'].map((col) => {
                    const seatId = `${row.rowNum}${col}`;
                    const status = getSeatStatus(seatId);
                    const isExtra = row.category === 'Extra Legroom';

                    let seatStyle = 'bg-white border-slate-300 hover:border-brand-500 text-slate-800';
                    if (status === 'occupied') {
                      seatStyle = 'bg-slate-200/90 border-slate-200 text-slate-400 cursor-not-allowed';
                    } else if (status === 'selected') {
                      seatStyle = 'bg-brand-600 border-brand-700 text-white shadow-md shadow-brand-500/30 scale-105';
                    } else if (isExtra) {
                      seatStyle = 'bg-amber-50 border-amber-300 text-amber-900 hover:border-amber-500';
                    }

                    return (
                      <button
                        key={seatId}
                        type="button"
                        disabled={status === 'occupied'}
                        onClick={() => handleSeatClick(seatId)}
                        className={`h-9 w-9 rounded-lg border text-xs font-bold transition-all flex items-center justify-center ${seatStyle}`}
                        title={`${seatId} - ${row.category}`}
                      >
                        {seatId}
                      </button>
                    );
                  })}
                </div>

                {/* Central Aisle */}
                <div className="w-8 text-center text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  {row.rowNum}
                </div>

                {/* Right Side: D, E, F */}
                <div className="flex items-center gap-1.5">
                  {['D', 'E', 'F'].map((col) => {
                    const seatId = `${row.rowNum}${col}`;
                    const status = getSeatStatus(seatId);
                    const isExtra = row.category === 'Extra Legroom';

                    let seatStyle = 'bg-white border-slate-300 hover:border-brand-500 text-slate-800';
                    if (status === 'occupied') {
                      seatStyle = 'bg-slate-200/90 border-slate-200 text-slate-400 cursor-not-allowed';
                    } else if (status === 'selected') {
                      seatStyle = 'bg-brand-600 border-brand-700 text-white shadow-md shadow-brand-500/30 scale-105';
                    } else if (isExtra) {
                      seatStyle = 'bg-amber-50 border-amber-300 text-amber-900 hover:border-amber-500';
                    }

                    return (
                      <button
                        key={seatId}
                        type="button"
                        disabled={status === 'occupied'}
                        onClick={() => handleSeatClick(seatId)}
                        className={`h-9 w-9 rounded-lg border text-xs font-bold transition-all flex items-center justify-center ${seatStyle}`}
                        title={`${seatId} - ${row.category}`}
                      >
                        {seatId}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Seat Summary & Action */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Your Selected Seat</p>
            <p className="text-lg font-black text-slate-900">
              Seat {selectedSeat}
              {getSeatCost() > 0 ? (
                <span className="text-xs font-bold text-amber-600 ml-2">(+৳{getSeatCost().toLocaleString()})</span>
              ) : (
                <span className="text-xs font-bold text-emerald-600 ml-2">(Complimentary)</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} className="font-bold px-5">
              Confirm Seat {selectedSeat}
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80">
          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Seat assignments are transmitted directly to the airline reservation system. Bassinet or emergency exit seats may require airline ground staff approval at check-in counter.
          </span>
        </div>
      </div>
    </Modal>
  );
};
