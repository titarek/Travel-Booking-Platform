import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Map, List, ArrowUpDown } from 'lucide-react';
import { HotelSearchWidget } from '../components/hotels/HotelSearchWidget.jsx';
import { HotelCard } from '../components/hotels/HotelCard.jsx';
import { HotelFilters } from '../components/hotels/HotelFilters.jsx';
import { HotelMap } from '../components/hotels/HotelMap.jsx';
import { HotelDetailModal } from '../components/hotels/HotelDetailModal.jsx';
import { BookingModal } from '../components/booking/BookingModal.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { Button } from '../components/ui/Button.jsx';
import api from '../api/axios.js';

export const HotelsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState(searchParams.get('sort') || 'rating');
  const [showMap, setShowMap] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    minRating: searchParams.get('minRating') || '',
    maxPrice: 800,
    freeCancellation: '',
    amenities: '',
  });

  // Modal states
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [bookingHotel, setBookingHotel] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const city = searchParams.get('city') || "Cox's Bazar";
  const lat = searchParams.get('lat') || '';
  const lng = searchParams.get('lng') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = searchParams.get('guests') || 2;
  const rooms = searchParams.get('rooms') || 1;

  useEffect(() => {
    const urlSort = searchParams.get('sort');
    if (urlSort && urlSort !== sort) {
      setSort(urlSort);
    }
  }, [searchParams, sort]);

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          city,
          ...(lat ? { lat } : {}),
          ...(lng ? { lng } : {}),
          ...(filters.minRating ? { minRating: filters.minRating } : {}),
          ...(filters.freeCancellation ? { freeCancellation: 'true' } : {}),
          ...(filters.amenities ? { amenities: filters.amenities } : {}),
          sort,
        });

        const res = await api.get(`/hotels?${queryParams.toString()}`);
        if (res.data?.data) {
          setHotels(res.data.data);
        }
      } catch (err) {
        console.error('Hotel search error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [city, lat, lng, filters.minRating, filters.freeCancellation, filters.amenities, sort]);

  // Client-side filtering for price
  const filteredHotels = useMemo(() => hotels.filter((hotel) => {
    if (filters.maxPrice && hotel.pricePerNight > filters.maxPrice) {
      return false;
    }
    return true;
  }), [hotels, filters.maxPrice]);

  const handleBookHotel = (hotel) => {
    setBookingHotel({
      ...hotel,
      checkIn: checkIn || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      checkOut: checkOut || new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
      guests,
      rooms,
    });
    setBookingModalOpen(true);
  };

  const handleViewDetails = (hotel) => {
    setSelectedHotel(hotel);
    setDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Search Bar Header */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
          <HotelSearchWidget
            compact
            initialValues={{
              city,
              lat,
              lng,
              checkIn,
              checkOut,
              guests,
              rooms,
            }}
            onSearch={(params) => {
              const sp = new URLSearchParams(params);
              setSearchParams(sp);
            }}
          />
        </div>

        {/* Results layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left: Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <HotelFilters
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters({ minRating: '', maxPrice: 800, freeCancellation: '', amenities: '' })}
            />

            {/* Map toggle card on desktop */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center space-y-3 shadow-sm hidden lg:block">
              <h4 className="font-bold text-xs text-slate-800">Map View Available</h4>
              <p className="text-[11px] text-slate-500">
                Explore hotels geographically across {city} with real prices.
              </p>
              <Button
                variant={showMap ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowMap(!showMap)}
                className="w-full text-xs font-bold gap-1.5"
              >
                {showMap ? <List className="h-4 w-4" /> : <Map className="h-4 w-4" />}
                <span>{showMap ? 'Show List View Only' : 'Toggle Interactive Map'}</span>
              </Button>
            </div>
          </div>

          {/* Right: Results Listing + Optional Map View */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  {sort === 'distance' || (lat && lng) ? `Nearby Hotels around ${city}` : `Hotels in ${city}`}
                </h2>
                <p className="text-xs text-slate-500">
                  {filteredHotels.length} luxury & boutique {filteredHotels.length === 1 ? 'property' : 'properties'} found
                  {(sort === 'distance' || (lat && lng)) && ' • Live Geoapify Nearby Radar'}
                  {checkIn && checkOut && ` • Stay dates: ${checkIn} to ${checkOut}`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Mobile map toggle */}
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="lg:hidden px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl flex items-center gap-1.5"
                >
                  <Map className="h-3.5 w-3.5 text-brand-600" />
                  <span>{showMap ? 'Hide Map' : 'Map View'}</span>
                </button>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    Sort:
                  </span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="bg-slate-100 hover:bg-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 border-none cursor-pointer"
                  >
                    <option value="rating">Top Rated First</option>
                    <option value="distance">Nearby / Closest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Interactive Leaflet Map when toggled */}
            {showMap && (
              <div className="h-96 w-full rounded-2xl overflow-hidden shadow-md border border-slate-200 animate-in fade-in">
                <HotelMap
                  hotels={filteredHotels}
                  onSelectHotel={handleViewDetails}
                  zoom={12}
                />
              </div>
            )}

            {/* Hotel Cards List */}
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-56 w-full" />
                <Skeleton className="h-56 w-full" />
              </div>
            ) : filteredHotels.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                <Building2 className="h-10 w-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-base text-slate-800">No hotels matched your criteria in {city}</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting the minimum rating or price filter to browse more properties.
                </p>
                <button
                  type="button"
                  onClick={() => setFilters({ minRating: '', maxPrice: 800, freeCancellation: '', amenities: '' })}
                  className="text-xs text-brand-600 font-bold hover:underline"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHotels.map((hotel) => (
                  <HotelCard
                    key={hotel._id}
                    hotel={hotel}
                    onSelect={handleBookHotel}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <HotelDetailModal
        hotel={selectedHotel}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onBook={handleBookHotel}
      />

      <BookingModal
        item={bookingHotel}
        type="hotel"
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
      />
    </div>
  );
};
