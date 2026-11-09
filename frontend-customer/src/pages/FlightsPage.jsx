import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plane, ArrowUpDown } from 'lucide-react';
import { FlightSearchWidget } from '../components/flights/FlightSearchWidget.jsx';
import { FlightCard } from '../components/flights/FlightCard.jsx';
import { FlightFilters } from '../components/flights/FlightFilters.jsx';
import { FlightDetailModal } from '../components/flights/FlightDetailModal.jsx';
import { SelectedFlightStatus } from '../components/flights/SelectedFlightStatus.jsx';
import { BookingModal } from '../components/booking/BookingModal.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import api from '../api/axios.js';

export const FlightsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('price_asc');

  // Filters state
  const [filters, setFilters] = useState({
    stops: searchParams.get('stops') || 'all',
    maxPrice: 1500,
    airlines: [],
  });

  // Modal & Selection states
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedFlightForStatus, setSelectedFlightForStatus] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [bookingFlight, setBookingFlight] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const origin = searchParams.get('origin') || 'DAC';
  const destination = searchParams.get('destination') || 'DXB';
  const departureDate = searchParams.get('departureDate') || '';
  const cabinClass = searchParams.get('cabinClass') || 'Economy';

  useEffect(() => {
    const fetchFlights = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          ...(origin ? { origin } : {}),
          ...(destination ? { destination } : {}),
          ...(departureDate ? { departureDate } : {}),
          ...(cabinClass ? { cabinClass } : {}),
          sort,
        });

        const res = await api.get(`/flights/search?${queryParams.toString()}`);
        if (res.data?.data) {
          setFlights(res.data.data);
        }
      } catch (err) {
        console.error('Flight search error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [origin, destination, departureDate, cabinClass, sort]);

  // Extract all distinct airlines available
  const availableAirlines = useMemo(() => {
    const set = new Set();
    flights.forEach((f) => { if (f.airline) set.add(f.airline); });
    return Array.from(set);
  }, [flights]);

  // Client-side filtering
  const filteredFlights = useMemo(() => flights.filter((flight) => {
    if (filters.stops !== 'all' && filters.stops !== '') {
      if (Number(filters.stops) !== flight.stops) return false;
    }
    if (filters.maxPrice && flight.price > filters.maxPrice) {
      return false;
    }
    if (filters.airlines && filters.airlines.length > 0) {
      if (!filters.airlines.includes(flight.airline)) return false;
    }
    return true;
  }), [flights, filters]);

  const handleSelectFlight = (flight) => {
    if (selectedFlightForStatus?._id === flight._id) {
      setSelectedFlightForStatus(null);
    } else {
      setSelectedFlightForStatus(flight);
    }
  };

  const handleBookFlight = (flight) => {
    setBookingFlight(flight);
    setBookingModalOpen(true);
  };

  const handleViewDetails = (flight) => {
    setSelectedFlight(flight);
    setDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Search Widget Header Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
          <FlightSearchWidget
            compact
            initialValues={{
              origin,
              destination,
              departureDate,
              cabinClass,
            }}
            onSearch={(params) => {
              const sp = new URLSearchParams(params);
              setSearchParams(sp);
            }}
          />
        </div>

        {/* Results layout: Filters sidebar + Flight listing */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left: Filters Sidebar */}
          <div className="lg:col-span-1">
            <FlightFilters
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters({ stops: 'all', maxPrice: 1500, airlines: [] })}
              availableAirlines={availableAirlines}
            />
          </div>

          {/* Right: Results Header & Listing */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  {origin} → {destination} Flights
                </h2>
                <p className="text-xs text-slate-500">
                  Showing {filteredFlights.length} available flight {filteredFlights.length === 1 ? 'fare' : 'fares'}
                </p>
              </div>

              {/* Sorting */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Sort by:
                </span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="bg-slate-100 hover:bg-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 border-none cursor-pointer"
                >
                  <option value="price_asc">Cheapest First</option>
                  <option value="price_desc">Highest Price First</option>
                  <option value="duration">Fastest Duration</option>
                </select>
              </div>
            </div>

            {/* Flight Cards List */}
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
              </div>
            ) : filteredFlights.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                <Plane className="h-10 w-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-base text-slate-800">
                  {flights.length === 0
                    ? `No flights found from ${origin} to ${destination}`
                    : 'No flights found matching your filters'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {flights.length === 0
                    ? `There are no scheduled direct commercial flights operating between ${origin} and ${destination} on ${departureDate || 'this date'}. Try selecting another travel date or nearby departure/arrival airport.`
                    : 'Try adjusting the maximum price or number of stops filter to view more airline fares.'}
                </p>
                {flights.length === 0 ? (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const sp = new URLSearchParams({
                          origin: 'DAC',
                          destination: 'DXB',
                          departureDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
                          cabinClass: 'Economy',
                        });
                        setSearchParams(sp);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors"
                    >
                      Search Popular Route: Dhaka (DAC) → Dubai (DXB)
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setFilters({ stops: 'all', maxPrice: 1500, airlines: [] })}
                    className="text-xs text-brand-600 font-bold hover:underline"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFlights.map((flight) => {
                  const isSelected = selectedFlightForStatus?._id === flight._id;
                  return (
                    <div key={flight._id} className="space-y-3">
                      <FlightCard
                        flight={flight}
                        isSelected={isSelected}
                        onSelect={() => handleSelectFlight(flight)}
                        onViewDetails={handleViewDetails}
                      />
                      {/* Live Flight Status Telemetry displayed directly under selected flight */}
                      {isSelected && (
                        <SelectedFlightStatus
                          flight={flight}
                          onProceedToBook={() => handleBookFlight(flight)}
                          onClose={() => setSelectedFlightForStatus(null)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <FlightDetailModal
        flight={selectedFlight}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onBook={handleBookFlight}
      />

      <BookingModal
        item={bookingFlight}
        type="flight"
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
      />
    </div>
  );
};
