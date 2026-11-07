import { useState } from 'react';
import { Star, MapPin, CheckCircle2, BedDouble, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { HotelMap } from './HotelMap.jsx';

export const HotelDetailModal = ({ hotel, isOpen, onClose, onBook }) => {
  const { currency, exchangeRates } = useAuth();
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);
  const [activePhoto, setActivePhoto] = useState(0);

  if (!hotel) return null;

  const roomTypes = hotel.roomTypes || [
    { name: 'Standard Room', bed: '1 King Bed', maxGuests: 2, price: hotel.pricePerNight, refundable: true, breakfastIncluded: true },
  ];

  const selectedRoom = roomTypes[selectedRoomIndex] || roomTypes[0];
  const photos = hotel.images?.length > 0 ? hotel.images : [hotel.thumbnail];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={hotel.name}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Photo Gallery */}
        <div className="space-y-2">
          <div className="h-72 sm:h-80 w-full rounded-2xl overflow-hidden shadow-inner">
            <img
              src={photos[activePhoto]}
              alt={hotel.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActivePhoto(i)}
                  className={`h-16 w-24 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    activePhoto === i ? 'border-brand-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hotel Header Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-1.5 text-amber-400 mb-1">
              {Array.from({ length: hotel.starRating || 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
              <span className="text-xs font-bold text-slate-700 ml-1">
                {hotel.starRating}-Star Luxury Property
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-brand-500" />
              <span>{hotel.address}, {hotel.city}, {hotel.country}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="text-xs font-bold text-slate-800 block">
                {hotel.reviewScore >= 4.7 ? 'Superb Guest Rating' : 'Excellent'}
              </span>
              <span className="text-[11px] text-slate-400">Based on {hotel.reviewCount} verified reviews</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-brand-500 text-white font-black text-sm flex items-center justify-center">
              {hotel.reviewScore?.toFixed(1) || '4.5'}
            </div>
          </div>
        </div>

        {/* Description & Amenities */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Property Overview</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{hotel.description}</p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2">Featured Amenities</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {(hotel.amenities || []).map((amenity) => (
                <div key={amenity} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl text-xs text-slate-700">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Room Types Selection */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-900">Choose Room Type</h4>
          <div className="space-y-2.5">
            {roomTypes.map((room, idx) => {
              const isSelected = selectedRoomIndex === idx;
              const formattedRoomPrice = formatCurrency(room.price, currency, exchangeRates);
              return (
                <div
                  key={room.name}
                  onClick={() => setSelectedRoomIndex(idx)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{room.name}</span>
                      {room.breakfastIncluded && (
                        <Badge variant="success" size="xs">
                          Breakfast Included
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {room.bed}</span>
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Max {room.maxGuests} Guests</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <span className="text-lg font-black text-brand-600 block">{formattedRoomPrice}</span>
                      <span className="text-[10px] text-slate-400">per night / room</span>
                    </div>
                    <input
                      type="radio"
                      name="selectedRoom"
                      checked={isSelected}
                      onChange={() => setSelectedRoomIndex(idx)}
                      className="text-brand-500 focus:ring-brand-500 h-4 w-4 cursor-pointer"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive Location Map */}
        {hotel.coordinates?.lat && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Location & Surroundings</h4>
            <div className="h-52 rounded-2xl overflow-hidden border border-slate-200">
              <HotelMap hotels={[hotel]} zoom={14} />
            </div>
          </div>
        )}

        {/* Booking Action Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Selected: {selectedRoom.name}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-brand-600">
                {formatCurrency(selectedRoom.price, currency, exchangeRates)}
              </span>
              <span className="text-xs text-slate-500">/ night</span>
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
                  ...hotel,
                  selectedRoom,
                  price: selectedRoom.price,
                });
              }}
              className="w-full sm:w-auto font-bold px-6"
            >
              Book Selected Room
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
