import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  ChevronDown,
  Plus,
  Minus,
  X,
  Globe,
  Building2,
  Sparkles,
  Navigation,
} from 'lucide-react';
import { POPULAR_HOTEL_DESTINATIONS } from '../../utils/constants.js';
import { Button } from '../ui/Button.jsx';

const getTodayStr = () => new Date().toISOString().split('T')[0];
const getDaysLaterStr = (days) => new Date(Date.now() + 86400000 * days).toISOString().split('T')[0];

export const HotelSearchWidget = ({ initialValues = {}, onSearch }) => {
  const navigate = useNavigate();

  const [city, setCity] = useState(initialValues.city || "Cox's Bazar");
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [cityOpen, setCityOpen] = useState(false);

  const [checkIn, setCheckIn] = useState(initialValues.checkIn || getDaysLaterStr(1));
  const [checkOut, setCheckOut] = useState(initialValues.checkOut || getDaysLaterStr(4));

  const [guests, setGuests] = useState(Number(initialValues.guests) || 2);
  const [rooms, setRooms] = useState(Number(initialValues.rooms) || 1);
  const [guestOpen, setGuestOpen] = useState(false);

  const cityBoxRef = useRef(null);
  const guestBoxRef = useRef(null);
  const checkInInputRef = useRef(null);
  const checkOutInputRef = useRef(null);

  // Sync state if initialValues changes (e.g. from URL navigation)
  useEffect(() => {
    if (initialValues.city) setCity(initialValues.city);
    if (initialValues.checkIn) setCheckIn(initialValues.checkIn);
    if (initialValues.checkOut) setCheckOut(initialValues.checkOut);
    if (initialValues.guests) setGuests(Number(initialValues.guests));
    if (initialValues.rooms) setRooms(Number(initialValues.rooms));
  }, [
    initialValues.city,
    initialValues.checkIn,
    initialValues.checkOut,
    initialValues.guests,
    initialValues.rooms,
  ]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cityBoxRef.current && !cityBoxRef.current.contains(e.target)) {
        setCityOpen(false);
      }
      if (guestBoxRef.current && !guestBoxRef.current.contains(e.target)) {
        setGuestOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplayDate = (dStr) => {
    if (!dStr) return { date: 'Select Date', day: '' };
    const dateObj = new Date(dStr);
    return {
      date: dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      day: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
    };
  };

  const inDate = formatDisplayDate(checkIn);
  const outDate = formatDisplayDate(checkOut);

  // Calculate nights dynamically
  const calcNights = () => {
    if (!checkIn || !checkOut) return 1;
    const diffTime = Math.abs(new Date(checkOut) - new Date(checkIn));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };
  const nights = calcNights();

  const handleCheckInChange = (newVal) => {
    setCheckIn(newVal);
    if (new Date(newVal) >= new Date(checkOut)) {
      const nextDay = new Date(new Date(newVal).getTime() + 86400000).toISOString().split('T')[0];
      setCheckOut(nextDay);
    }
  };

  const handleCheckOutChange = (newVal) => {
    if (new Date(newVal) <= new Date(checkIn)) {
      const nextDay = new Date(new Date(checkIn).getTime() + 86400000).toISOString().split('T')[0];
      setCheckOut(nextDay);
    } else {
      setCheckOut(newVal);
    }
  };

  const handleSelectCity = (chosenCity) => {
    setCity(chosenCity);
    setCitySearchQuery('');
    setCityOpen(false);
  };

  const handleCustomCitySubmit = (e) => {
    e.preventDefault();
    if (citySearchQuery.trim()) {
      handleSelectCity(citySearchQuery.trim());
    }
  };

  const filteredDestinations = POPULAR_HOTEL_DESTINATIONS.filter((d) => {
    const query = citySearchQuery.toLowerCase().trim();
    if (!query) return true;
    return d.city.toLowerCase().includes(query) || d.country.toLowerCase().includes(query);
  });

  const selectedDestinationMeta = POPULAR_HOTEL_DESTINATIONS.find(
    (d) => d.city.toLowerCase() === city.toLowerCase(),
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const queryParams = new URLSearchParams({
      city: city.trim(),
      checkIn,
      checkOut,
      guests: guests.toString(),
      rooms: rooms.toString(),
    });

    if (onSearch) {
      onSearch({
        city: city.trim(),
        checkIn,
        checkOut,
        guests,
        rooms,
      });
    } else {
      navigate(`/hotels?${queryParams.toString()}`);
    }
  };

  const handleFindNearby = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (onSearch) {
            onSearch({
              city,
              lat: latitude.toFixed(4),
              lng: longitude.toFixed(4),
              sort: 'distance',
              checkIn,
              checkOut,
              guests,
              rooms,
            });
          } else {
            navigate(`/hotels?city=${encodeURIComponent(city)}&lat=${latitude.toFixed(4)}&lng=${longitude.toFixed(4)}&sort=distance&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}`);
          }
        },
        () => {
          if (onSearch) {
            onSearch({ city, sort: 'distance', checkIn, checkOut, guests, rooms });
          } else {
            navigate(`/hotels?city=${encodeURIComponent(city)}&sort=distance&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}`);
          }
        },
      );
    } else if (onSearch) {
      onSearch({ city, sort: 'distance', checkIn, checkOut, guests, rooms });
    } else {
      navigate(`/hotels?city=${encodeURIComponent(city)}&sort=distance&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Search Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* 1. Dynamic Destination Input with Interactive Popover */}
        <div className="md:col-span-4 relative" ref={cityBoxRef}>
          <div
            onClick={() => {
              setCityOpen(true);
              setGuestOpen(false);
            }}
            className="p-3.5 bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-brand-500 rounded-2xl cursor-pointer transition-all shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                City or Destination
              </span>
              <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                Worldwide
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="h-4 w-4 text-brand-500 shrink-0" />
              <div className="overflow-hidden flex-1">
                <span className="text-base font-black text-slate-900 block leading-tight truncate">
                  {city}
                </span>
                <span className="text-[11px] text-slate-500 truncate block">
                  {selectedDestinationMeta
                    ? `${selectedDestinationMeta.country} • ${selectedDestinationMeta.badge}`
                    : 'Global Destination'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
            </div>
          </div>

          {/* Destination Search Dropdown Popover */}
          {cityOpen && (
            <div className="absolute left-0 top-full mt-2 w-full sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
              {/* Live search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type any city (e.g. Rome, Tokyo, Paris)..."
                  value={citySearchQuery}
                  onChange={(e) => setCitySearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (citySearchQuery.trim()) {
                        handleSelectCity(citySearchQuery.trim());
                      }
                    }
                  }}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
                {citySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCitySearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Custom input quick action if typed text */}
              {citySearchQuery.trim().length > 0 && (
                <button
                  type="button"
                  onClick={handleCustomCitySubmit}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-left transition-colors border border-brand-200/60"
                >
                  <Globe className="h-4 w-4 text-brand-600 shrink-0" />
                  <div className="overflow-hidden flex-1">
                    <span className="block text-xs font-black">
                      Search hotels in &ldquo;{citySearchQuery.trim()}&rdquo;
                    </span>
                    <span className="text-[10px] text-brand-600 font-medium">
                      Dynamically discovers resorts worldwide
                    </span>
                  </div>
                </button>
              )}

              {/* Popular Destinations List */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block px-1">
                  Popular Destinations
                </span>
                <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {filteredDestinations.map((d) => (
                    <button
                      key={d.city}
                      type="button"
                      onClick={() => handleSelectCity(d.city)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                        city.toLowerCase() === d.city.toLowerCase()
                          ? 'bg-brand-500 text-white font-bold'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Building2
                          className={`h-4 w-4 shrink-0 ${
                            city.toLowerCase() === d.city.toLowerCase() ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                        <div className="overflow-hidden">
                          <span className="block text-xs font-bold truncate">{d.city}</span>
                          <span
                            className={`block text-[10px] truncate ${
                              city.toLowerCase() === d.city.toLowerCase()
                                ? 'text-white/80'
                                : 'text-slate-400'
                            }`}
                          >
                            {d.country}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full shrink-0 font-bold ${
                          city.toLowerCase() === d.city.toLowerCase()
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {d.badge}
                      </span>
                    </button>
                  ))}
                  {filteredDestinations.length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-500">
                      No matching presets. Press Enter to search custom city.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Dynamic Check-in Date */}
        <div
          onClick={() => checkInInputRef.current?.showPicker()}
          className="md:col-span-2 p-3.5 bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-brand-500 rounded-2xl shadow-sm transition-all cursor-pointer relative group"
        >
          <div className="flex items-center justify-between">
            <span className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
              Check-In
            </span>
            <Calendar className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand-500 transition-colors" />
          </div>
          <div className="mt-1">
            <span className="text-sm font-black text-slate-900 block leading-tight">
              {inDate.date}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {inDate.day}
            </span>
          </div>
          <input
            ref={checkInInputRef}
            type="date"
            min={getTodayStr()}
            value={checkIn}
            onChange={(e) => handleCheckInChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            aria-label="Check-in Date"
          />
        </div>

        {/* 3. Dynamic Check-out Date */}
        <div
          onClick={() => checkOutInputRef.current?.showPicker()}
          className="md:col-span-2 p-3.5 bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-brand-500 rounded-2xl shadow-sm transition-all cursor-pointer relative group"
        >
          <div className="flex items-center justify-between">
            <span className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
              Check-Out
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/50">
              {nights} {nights === 1 ? 'Night' : 'Nights'}
            </span>
          </div>
          <div className="mt-1">
            <span className="text-sm font-black text-slate-900 block leading-tight">
              {outDate.date}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {outDate.day}
            </span>
          </div>
          <input
            ref={checkOutInputRef}
            type="date"
            min={checkIn || getTodayStr()}
            value={checkOut}
            onChange={(e) => handleCheckOutChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            aria-label="Check-out Date"
          />
        </div>

        {/* 4. Interactive Guests & Rooms Popover */}
        <div className="md:col-span-4 relative" ref={guestBoxRef}>
          <div
            onClick={() => {
              setGuestOpen(!guestOpen);
              setCityOpen(false);
            }}
            className="p-3.5 bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-brand-500 rounded-2xl shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                Guests & Rooms
              </span>
              <Users className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="flex items-center justify-between mt-1">
              <div>
                <span className="text-sm font-black text-slate-900 block leading-tight">
                  {guests} {guests === 1 ? 'Guest' : 'Guests'}, {rooms} {rooms === 1 ? 'Room' : 'Rooms'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Click to adjust occupancy
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
            </div>
          </div>

          {/* Guests Popover */}
          {guestOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="space-y-3">
                {/* Guests counter */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Total Guests</span>
                    <span className="text-[11px] text-slate-500">Adults and children</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={guests <= 1}
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-900">{guests}</span>
                    <button
                      type="button"
                      disabled={guests >= 8}
                      onClick={() => setGuests(Math.min(8, guests + 1))}
                      className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Rooms counter */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Rooms</span>
                    <span className="text-[11px] text-slate-500">Accommodation units</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={rooms <= 1}
                      onClick={() => setRooms(Math.max(1, rooms - 1))}
                      className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-900">{rooms}</span>
                    <button
                      type="button"
                      disabled={rooms >= 5}
                      onClick={() => setRooms(Math.min(5, rooms + 1))}
                      className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setGuestOpen(false)}
                className="w-full text-xs font-bold py-2 rounded-xl"
              >
                Apply Occupancy
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Prominent Action Button & Quick Preset Chips */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Quick Destinations:
          </span>
          <button
            type="button"
            onClick={handleFindNearby}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/70 flex items-center gap-1"
          >
            <Navigation className="h-3 w-3 text-emerald-600" />
            <span>Nearby / Near Me</span>
          </button>
          {['Cox’s Bazar', 'Dubai', 'Tokyo', 'Paris', 'Rome', 'Bali'].map((qCity) => (
            <button
              key={qCity}
              type="button"
              onClick={() => handleSelectCity(qCity)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                city.toLowerCase() === qCity.toLowerCase()
                  ? 'bg-brand-50 text-brand-600 border border-brand-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {qCity}
            </button>
          ))}
        </div>

        <Button
          type="submit"
          variant="accent"
          size="lg"
          className="w-full sm:w-auto px-10 py-3.5 rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 text-sm font-black flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.01]"
        >
          <Search className="h-4 w-4" />
          <span>Search Hotels</span>
        </Button>
      </div>
    </form>
  );
};
