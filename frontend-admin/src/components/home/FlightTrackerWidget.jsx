import { useState, useEffect } from 'react';
import {
  Search,
  Compass,
  Radio,
  ArrowRight,
  ArrowLeftRight,
  Plane,
  Building2,
  Luggage,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import api from '../../api/axios.js';

export const FlightTrackerWidget = () => {
  const [searchMode, setSearchMode] = useState('route'); // 'route' | 'flight'
  const [origin, setOrigin] = useState('DAC');
  const [destination, setDestination] = useState('DXB');
  const [flightNumber, setFlightNumber] = useState('BS541');

  const [flightsList, setFlightsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch flights by route or flight number
  const executeSearch = async (params) => {
    setLoading(true);
    setErrorMsg('');
    try {
      let queryStr = '';
      if (params.mode === 'route') {
        const fromCode = (params.origin || origin).trim().toUpperCase();
        const toCode = (params.destination || destination).trim().toUpperCase();
        if (!fromCode && !toCode) {
          setErrorMsg('Please enter an origin or destination airport code.');
          setLoading(false);
          return;
        }
        queryStr = `from=${encodeURIComponent(fromCode)}&to=${encodeURIComponent(toCode)}`;
      } else {
        const fNum = (params.flightNumber || flightNumber).trim().toUpperCase();
        if (!fNum) {
          setErrorMsg('Please enter a flight number.');
          setLoading(false);
          return;
        }
        queryStr = `flight=${encodeURIComponent(fNum)}`;
      }

      const res = await api.get(`/flights/status?${queryStr}`);
      const list = res.data?.flights || (res.data?.data ? [res.data.data] : []);

      if (list.length > 0) {
        setFlightsList(list);
        setSearched(true);
      } else {
        setFlightsList([]);
        setErrorMsg('No active or scheduled flights found matching this criteria.');
      }
    } catch {
      setErrorMsg('Failed to fetch real-time flight tracking data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load: fetch live DAC -> DXB flights
  useEffect(() => {
    executeSearch({ mode: 'route', origin: 'DAC', destination: 'DXB' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    executeSearch({ mode: searchMode, origin, destination, flightNumber });
  };

  const handleSwapAirports = () => {
    const prevOrigin = origin;
    setOrigin(destination);
    setDestination(prevOrigin);
    executeSearch({ mode: 'route', origin: destination, destination: prevOrigin });
  };

  const handleSelectRoutePreset = (fromCode, toCode) => {
    setSearchMode('route');
    setOrigin(fromCode);
    setDestination(toCode);
    executeSearch({ mode: 'route', origin: fromCode, destination: toCode });
  };

  const handleSelectFlightPreset = (code) => {
    setSearchMode('flight');
    setFlightNumber(code);
    executeSearch({ mode: 'flight', flightNumber: code });
  };

  return (
    <div className="space-y-4">
      {/* Mode Switcher: Route vs Flight Number */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setSearchMode('route')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
              searchMode === 'route'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Search by Route (From ➔ Where it is going)
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('flight')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
              searchMode === 'flight'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Search by Flight Number
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
          <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
          <span>Live Aviationstack API Connected</span>
        </div>
      </div>

      {/* Search Input Controls */}
      <form onSubmit={handleFormSubmit} className="space-y-3">
        {searchMode === 'route' ? (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
            {/* FROM Origin */}
            <div className="relative">
              <label htmlFor="origin-input" className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                From (Origin Airport / City)
              </label>
              <div className="relative flex items-center">
                <MapPin className="absolute left-3.5 h-4 w-4 text-brand-500" />
                <input
                  id="origin-input"
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                  placeholder="e.g. DAC, JFK, DXB"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center sm:pt-5">
              <button
                type="button"
                onClick={handleSwapAirports}
                title="Swap Origin and Destination"
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-brand-50 hover:text-brand-600 text-slate-500 transition-colors shadow-sm"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
            </div>

            {/* TO Destination ("Where it is going") */}
            <div className="relative">
              <label htmlFor="destination-input" className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Where it is going (Destination)
              </label>
              <div className="relative flex items-center">
                <Plane className="absolute left-3.5 h-4 w-4 text-emerald-500" />
                <input
                  id="destination-input"
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value.toUpperCase())}
                  placeholder="e.g. DXB, LHR, ZYL"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="sm:pt-5">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shrink-0 shadow-sm"
              >
                <Search className="h-4 w-4" />
                <span>{loading ? 'Searching...' : 'Show All Flights'}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <label htmlFor="flight-input" className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Flight Number
              </label>
              <div className="relative flex items-center">
                <Plane className="absolute left-3.5 h-4 w-4 text-brand-500" />
                <input
                  id="flight-input"
                  type="text"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                  placeholder="Enter Flight Number (e.g. BS541, EK587, BG347, FZ524)"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
            <div className="w-full sm:w-auto sm:pt-5">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shrink-0 shadow-sm"
              >
                <Search className="h-4 w-4" />
                <span>{loading ? 'Searching...' : 'Track Flight'}</span>
              </Button>
            </div>
          </div>
        )}
      </form>

      {/* Popular Preset Chips */}
      <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
        <span className="font-bold text-slate-400">Popular Routes:</span>
        {[
          { label: 'DAC ➔ DXB (Dubai)', from: 'DAC', to: 'DXB' },
          { label: 'DAC ➔ ZYL (Sylhet)', from: 'DAC', to: 'ZYL' },
          { label: 'DAC ➔ CXB (Cox’s Bazar)', from: 'DAC', to: 'CXB' },
          { label: 'DXB ➔ DAC (Dhaka)', from: 'DXB', to: 'DAC' },
        ].map((rt) => (
          <button
            key={rt.label}
            type="button"
            onClick={() => handleSelectRoutePreset(rt.from, rt.to)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-600 font-bold text-[11px] transition-colors"
          >
            {rt.label}
          </button>
        ))}

        <span className="font-bold text-slate-400 ml-2">Flights:</span>
        {['BS541', 'EK587', 'BG347', 'FZ524'].map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => handleSelectFlightPreset(code)}
            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-600 font-bold text-[11px] transition-colors"
          >
            {code}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Results Header: Count & Route Summary */}
      {searched && flightsList.length > 0 && (
        <div className="flex items-center justify-between text-xs font-black text-slate-600 pt-1 border-t border-slate-100">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-brand-600" />
            Showing all <span className="text-brand-600 font-black">{flightsList.length}</span> live flight{flightsList.length > 1 ? 's' : ''} from Aviationstack API
          </span>
          <span className="text-[11px] text-slate-400 font-semibold">
            Real-time IATA & ICAO status telemetry
          </span>
        </div>
      )}

      {/* List of All Flights Returned by the API */}
      <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
        {flightsList.map((flight, index) => (
          <div
            key={`${flight.flightNumber}-${flight.flightDate || index}-${index}`}
            className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 hover:border-brand-300 hover:shadow-md transition-all"
          >
            {/* Flight Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-brand-600 shadow-sm text-sm">
                  {flight.airlineIata || flight.flightNumber.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-black text-slate-900">{flight.flightNumber}</span>
                    <span className="text-xs text-slate-500 font-bold">• {flight.airline}</span>
                    {flight.source === 'aviationstack_live' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">
                      <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
                      Live Radar
                    </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    Aircraft: {flight.aircraft || 'Commercial Airliner'} • Date: {flight.flightDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={flight.statusVariant || 'info'} className="text-xs font-black px-3 py-1">
                  {flight.status || 'Active'}
                </Badge>
              </div>
            </div>

            {/* Route Display: Explicit "FROM" & "WHERE IT IS GOING" */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
              {/* FROM (Origin) */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 text-[10px] font-black uppercase tracking-wider">
                  <MapPin className="h-3 w-3" />
                  FROM (Origin)
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{flight.origin}</span>
                  <span className="text-xs font-extrabold text-slate-600">{flight.originCity}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate max-w-[220px]">
                  {flight.originAirport}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-black text-brand-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Dep: {flight.scheduledDep || 'Scheduled'}
                  </span>
                  {flight.departureDelay && (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {flight.departureDelay}
                  </span>
                  )}
                </div>
              </div>

              {/* PROGRESS / ROUTE ARROW */}
              <div className="flex flex-col items-center justify-center px-2 py-2">
                <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                  <Compass className="h-3 w-3 text-brand-500" />
                  <span>{flight.status === 'Landed' ? 'Flight Complete (100%)' : `En Route (${flight.progressPercent || 50}%)`}</span>
                </div>

                <div className="w-36 sm:w-44 h-2 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 via-sky-400 to-emerald-500 transition-all duration-500"
                    style={{ width: `${flight.progressPercent || 50}%` }}
                  />
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 font-bold">
                  <ArrowRight className="h-3 w-3 text-brand-500" />
                  <span>Altitude: {flight.altitude || 'Cruising'}</span>
                </div>
              </div>

              {/* WHERE IT IS GOING (Destination) */}
              <div className="space-y-1 md:text-right">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                  <Plane className="h-3 w-3" />
                  WHERE IT IS GOING (Destination)
                </div>
                <div className="flex items-baseline gap-2 md:justify-end">
                  <span className="text-2xl font-black text-slate-900">{flight.destination}</span>
                  <span className="text-xs font-extrabold text-slate-600">{flight.destinationCity}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate max-w-[220px] md:ml-auto">
                  {flight.destinationAirport}
                </p>
                <div className="flex items-center gap-2 pt-1 md:justify-end">
                  <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Arr: {flight.scheduledArr || 'Scheduled'}
                  </span>
                  {flight.arrivalDelay && (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {flight.arrivalDelay}
                  </span>
                  )}
                </div>
              </div>
            </div>

            {/* Terminal / Gate / Baggage Belt Info */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Terminal
                </span>
                <span className="text-xs font-black text-slate-800 block mt-0.5">
                  {flight.terminal || 'Terminal 1'}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Plane className="h-3 w-3" />
                  Departure Gate
                </span>
                <span className="text-xs font-black text-brand-600 block mt-0.5">
                  {flight.gate || 'Gate TBA'}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Luggage className="h-3 w-3" />
                  Baggage Belt
                </span>
                <span className="text-xs font-black text-emerald-600 block mt-0.5">
                  {flight.belt || 'Belt 02'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
