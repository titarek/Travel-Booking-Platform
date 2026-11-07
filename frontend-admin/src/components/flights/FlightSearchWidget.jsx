import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightLeft,
  Search,
  MapPin,
  ChevronDown,
  Plus,
  Minus,
} from 'lucide-react';
import { POPULAR_AIRPORTS } from '../../utils/constants.js';
import { Button } from '../ui/Button.jsx';
import api from '../../api/axios.js';

export const FlightSearchWidget = ({ initialValues = {}, onSearch }) => {
  const navigate = useNavigate();

  const [tripType, setTripType] = useState(initialValues.tripType || 'one_way');
  const [cabinClass, setCabinClass] = useState(initialValues.cabinClass || 'Economy');
  const [origin, setOrigin] = useState(initialValues.origin || 'DAC');
  const [destination, setDestination] = useState(initialValues.destination || 'DXB');
  const [departureDate, setDepartureDate] = useState(
    initialValues.departureDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
  );
  const [returnDate, setReturnDate] = useState(
    initialValues.returnDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
  );
  const [passengers, setPassengers] = useState(Number(initialValues.passengers) || 1);
  const [fareType, setFareType] = useState('regular'); // 'regular', 'student', 'umrah'
  const [directOnly, setDirectOnly] = useState(false);

  // Dropdown states
  const [originOpen, setOriginOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [passengerOpen, setPassengerOpen] = useState(false);
  const [airports, setAirports] = useState(POPULAR_AIRPORTS);
  const [searchQuery, setSearchQuery] = useState('');

  const originRef = useRef(null);
  const destRef = useRef(null);
  const passengerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (originRef.current && !originRef.current.contains(e.target)) setOriginOpen(false);
      if (destRef.current && !destRef.current.contains(e.target)) setDestOpen(false);
      if (passengerRef.current && !passengerRef.current.contains(e.target)) setPassengerOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchAirport = async (q) => {
    setSearchQuery(q);
    try {
      const res = await api.get(`/external/airports?q=${encodeURIComponent(q)}`);
      if (res.data?.data) {
        setAirports(res.data.data);
      }
    } catch (err) {
      setAirports(POPULAR_AIRPORTS.filter((a) => a.city.toLowerCase().includes(q.toLowerCase())));
    }
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const selectedOrigin = POPULAR_AIRPORTS.find(
    (a) => a.code.toLowerCase() === origin.toLowerCase() || a.city.toLowerCase() === origin.toLowerCase(),
  ) || {
    code: origin.slice(0, 3).toUpperCase(),
    city: origin,
    airport: `${origin} Airport`,
    country: 'International',
  };

  const selectedDest = POPULAR_AIRPORTS.find(
    (a) => a.code.toLowerCase() === destination.toLowerCase() || a.city.toLowerCase() === destination.toLowerCase(),
  ) || {
    code: destination.slice(0, 3).toUpperCase(),
    city: destination,
    airport: `${destination} Airport`,
    country: 'International',
  };

  const formatDisplayDate = (dStr) => {
    if (!dStr) return { date: '', day: '' };
    const dateObj = new Date(dStr);
    return {
      date: dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      day: dateObj.toLocaleDateString('en-US', { weekday: 'long' }),
    };
  };

  const depDateInfo = formatDisplayDate(departureDate);
  const retDateInfo = formatDisplayDate(returnDate);

  const handleSubmit = (e) => {
    e.preventDefault();
    const queryParams = new URLSearchParams({
      origin,
      destination,
      departureDate,
      tripType,
      cabinClass,
      passengers: passengers.toString(),
      fareType,
      ...(directOnly ? { directOnly: 'true' } : {}),
      ...(tripType === 'round_trip' && returnDate ? { returnDate } : {}),
    });

    if (onSearch) {
      onSearch({ origin, destination, departureDate, cabinClass, tripType, passengers, fareType, directOnly });
    } else {
      navigate(`/flights?${queryParams.toString()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Top Options: Trip Type, Cabin Class & Fare Type (ShareTrip Style) */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-700">
        <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setTripType('one_way')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tripType === 'one_way'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            One Way
          </button>
          <button
            type="button"
            onClick={() => setTripType('round_trip')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tripType === 'round_trip'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Round Trip
          </button>
        </div>

        {/* Fare Type Pill Selector (ShareTrip Signature Feature) */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFareType('regular')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              fareType === 'regular'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Regular Fare
          </button>
          <button
            type="button"
            onClick={() => setFareType('student')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
              fareType === 'student'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-brand-600 hover:bg-brand-50'
            }`}
          >
            <span>Student Fare</span>
            <span className="text-[9px] px-1 py-0.2 bg-amber-400 text-slate-900 rounded font-black">+10kg</span>
          </button>
          <button
            type="button"
            onClick={() => setFareType('umrah')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
              fareType === 'umrah'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <span>Umrah Fare</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900">
            <input
              type="checkbox"
              checked={directOnly}
              onChange={(e) => setDirectOnly(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500 h-3.5 w-3.5 accent-brand-600"
            />
            <span className="text-[11px] font-bold">Direct Flights</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Cabin:</span>
            <select
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value)}
              className="bg-slate-100 hover:bg-slate-200 border-none rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="Economy">Economy</option>
              <option value="Premium Economy">Premium Economy</option>
              <option value="Business">Business</option>
              <option value="First">First Class</option>
            </select>
          </div>
        </div>
      </div>

      {/* Special Fare Perk Notification Banner */}
      {fareType === 'student' && (
        <div className="px-3.5 py-2 bg-sky-50 border border-sky-200/80 rounded-xl text-sky-800 text-xs font-semibold flex items-center justify-between">
          <span>🎓 Student Special: Extra 10kg check-in baggage allowance & student visa discount applied.</span>
          <span className="text-[10px] font-bold uppercase text-sky-600">Valid Student ID Required</span>
        </div>
      )}
      {fareType === 'umrah' && (
        <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>🕋 Umrah Fare: Includes 5 Liters Zamzam water allowance & flexible date change flexibility.</span>
          <span className="text-[10px] font-bold uppercase text-emerald-600">Pilgrimage Verified</span>
        </div>
      )}

      {/* Main Search Inputs Grid (ShareTrip Information Hierarchy) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Origin / FROM Box */}
        <div className="relative md:col-span-3" ref={originRef}>
          <div
            onClick={() => { setOriginOpen(true); setDestOpen(false); }}
            className="p-3.5 bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-brand-500 rounded-2xl cursor-pointer transition-all shadow-sm"
          >
            <span className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
              From (Origin)
            </span>
            <div className="flex items-center justify-between mt-1">
              <div className="overflow-hidden">
                <span className="text-lg font-black text-slate-900 block leading-tight truncate">
                  {selectedOrigin.city}
                </span>
                <span className="text-xs text-slate-500 truncate block max-w-[160px]">
                  {selectedOrigin.airport}
                </span>
              </div>
              <span className="text-xs font-black px-2 py-1 bg-brand-50 text-brand-600 rounded-lg shrink-0 border border-brand-100">
                {selectedOrigin.code}
              </span>
            </div>
          </div>

          {originOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50 animate-in fade-in">
              <input
                type="text"
                placeholder="Search airport or city name..."
                value={searchQuery}
                onChange={(e) => handleSearchAirport(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl mb-2 focus:outline-none focus:border-brand-500"
              />
              <div className="max-h-56 overflow-y-auto space-y-1">
                {searchQuery.trim().length > 1 && (
                  <div
                    onClick={() => { setOrigin(searchQuery.trim()); setOriginOpen(false); setSearchQuery(''); }}
                    className="p-2 bg-brand-50 hover:bg-brand-100 rounded-xl cursor-pointer flex items-center justify-between text-xs font-bold text-brand-700 transition-colors"
                  >
                    <span>Use &ldquo;{searchQuery.trim()}&rdquo;</span>
                    <span className="text-[10px] uppercase font-black px-1.5 py-0.5 bg-brand-600 text-white rounded">Custom City</span>
                  </div>
                )}
                {airports.map((airport) => (
                  <div
                    key={airport.code}
                    onClick={() => { setOrigin(airport.code); setOriginOpen(false); setSearchQuery(''); }}
                    className="p-2 hover:bg-brand-50 rounded-xl cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{airport.city}, {airport.country}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[190px]">{airport.airport}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded">{airport.code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Swap Origin & Destination Button */}
        <div className="hidden md:flex md:col-span-1 justify-center -mx-4 z-10">
          <button
            type="button"
            onClick={handleSwap}
            className="h-9 w-9 rounded-full bg-white border border-slate-200 hover:border-brand-500 hover:bg-brand-50 text-slate-600 hover:text-brand-600 flex items-center justify-center shadow-md transition-all hover:rotate-180 duration-200"
            title="Swap Locations"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Destination / TO Box */}
        <div className="relative md:col-span-3" ref={destRef}>
          <div
            onClick={() => { setDestOpen(true); setOriginOpen(false); }}
            className="p-3.5 bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-brand-500 rounded-2xl cursor-pointer transition-all shadow-sm"
          >
            <span className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
              To (Destination)
            </span>
            <div className="flex items-center justify-between mt-1">
              <div className="overflow-hidden">
                <span className="text-lg font-black text-slate-900 block leading-tight truncate">
                  {selectedDest.city}
                </span>
                <span className="text-xs text-slate-500 truncate block max-w-[160px]">
                  {selectedDest.airport}
                </span>
              </div>
              <span className="text-xs font-black px-2 py-1 bg-brand-50 text-brand-600 rounded-lg shrink-0 border border-brand-100">
                {selectedDest.code}
              </span>
            </div>
          </div>

          {destOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50 animate-in fade-in">
              <input
                type="text"
                placeholder="Search destination city or airport..."
                value={searchQuery}
                onChange={(e) => handleSearchAirport(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl mb-2 focus:outline-none focus:border-brand-500"
              />
              <div className="max-h-56 overflow-y-auto space-y-1">
                {searchQuery.trim().length > 1 && (
                  <div
                    onClick={() => { setDestination(searchQuery.trim()); setDestOpen(false); setSearchQuery(''); }}
                    className="p-2 bg-brand-50 hover:bg-brand-100 rounded-xl cursor-pointer flex items-center justify-between text-xs font-bold text-brand-700 transition-colors"
                  >
                    <span>Use &ldquo;{searchQuery.trim()}&rdquo;</span>
                    <span className="text-[10px] uppercase font-black px-1.5 py-0.5 bg-brand-600 text-white rounded">Custom City</span>
                  </div>
                )}
                {airports.map((airport) => (
                  <div
                    key={airport.code}
                    onClick={() => { setDestination(airport.code); setDestOpen(false); setSearchQuery(''); }}
                    className="p-2 hover:bg-brand-50 rounded-xl cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{airport.city}, {airport.country}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[190px]">{airport.airport}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded">{airport.code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Departure & Return Dates Box */}
        <div className={`grid ${tripType === 'round_trip' ? 'grid-cols-2' : 'grid-cols-1'} gap-2 md:col-span-3`}>
          {/* Departure Date */}
          <div className="p-3.5 bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-brand-500 rounded-2xl shadow-sm transition-all relative">
            <span className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
              Departure
            </span>
            <div className="mt-1">
              <span className="text-sm font-black text-slate-900 block leading-tight">
                {depDateInfo.date || departureDate}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {depDateInfo.day}
              </span>
            </div>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>

          {/* Return Date (if Round Trip) */}
          {tripType === 'round_trip' ? (
            <div className="p-3.5 bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-brand-500 rounded-2xl shadow-sm transition-all relative">
              <span className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                Return
              </span>
              <div className="mt-1">
                <span className="text-sm font-black text-slate-900 block leading-tight">
                  {retDateInfo.date || returnDate}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {retDateInfo.day}
                </span>
              </div>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
          ) : (
            <div
              onClick={() => setTripType('round_trip')}
              className="hidden md:flex p-3.5 bg-slate-50/40 hover:bg-brand-50/40 border border-dashed border-slate-200 hover:border-brand-300 rounded-2xl cursor-pointer items-center justify-between transition-all"
            >
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Return Date</span>
                <span className="text-xs font-semibold text-brand-600 block mt-0.5">+ Add Return Trip</span>
              </div>
            </div>
          )}
        </div>

        {/* Travelers Selector */}
        <div className="relative md:col-span-2" ref={passengerRef}>
          <div
            onClick={() => setPassengerOpen(!passengerOpen)}
            className="p-3.5 bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-brand-500 rounded-2xl cursor-pointer shadow-sm transition-all"
          >
            <span className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
              Travelers
            </span>
            <div className="flex items-center justify-between mt-1">
              <div>
                <span className="text-sm font-black text-slate-900 block leading-tight">
                  {passengers} {passengers > 1 ? 'Travelers' : 'Traveler'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {cabinClass}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>

          {passengerOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-slate-800">Passengers</p>
                  <p className="text-[10px] text-slate-400">Age 12+ years</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={passengers <= 1}
                    onClick={() => setPassengers(Math.max(1, passengers - 1))}
                    className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-sm disabled:opacity-40"
                  >
                    <Minus className="h-3.5 w-3.5 text-slate-600" />
                  </button>
                  <span className="font-extrabold text-sm text-slate-900 w-4 text-center">{passengers}</span>
                  <button
                    type="button"
                    disabled={passengers >= 9}
                    onClick={() => setPassengers(passengers + 1)}
                    className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
                  >
                    <Plus className="h-3.5 w-3.5 text-slate-600" />
                  </button>
                </div>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setPassengerOpen(false)}
                className="w-full text-xs font-bold py-1.5"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Prominent Search Action Row (Clear and easy to understand) */}
      <div className="flex justify-center pt-2">
        <Button
          type="submit"
          variant="accent"
          size="lg"
          className="px-10 py-3.5 rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 text-sm font-black flex items-center gap-2.5 transition-all transform hover:scale-[1.01]"
        >
          <Search className="h-4 w-4" />
          <span>Search Flights</span>
        </Button>
      </div>
    </form>
  );
};
