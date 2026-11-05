import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plane,
  Building2,
  Palmtree,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Headphones,
  CheckCircle,
  Tag,
  Smartphone,
} from 'lucide-react';
import { HeroSearch } from '../components/layout/HeroSearch.jsx';
import { FlightCard } from '../components/flights/FlightCard.jsx';
import { FlightDetailModal } from '../components/flights/FlightDetailModal.jsx';
import { HotelCard } from '../components/hotels/HotelCard.jsx';
import { HotelDetailModal } from '../components/hotels/HotelDetailModal.jsx';
import { PackageCard } from '../components/packages/PackageCard.jsx';
import { PackageDetailModal } from '../components/packages/PackageDetailModal.jsx';
import { BookingModal } from '../components/booking/BookingModal.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { Button } from '../components/ui/Button.jsx';
import { BankPartnersSection } from '../components/home/BankPartnersSection.jsx';
import { TripCoinsWidget } from '../components/home/TripCoinsWidget.jsx';
import api from '../api/axios.js';

export const HomePage = () => {
  const navigate = useNavigate();

  const [popularFlights, setPopularFlights] = useState([]);
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [featuredPackages, setFeaturedPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states for preview & booking
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [flightModalOpen, setFlightModalOpen] = useState(false);

  const [selectedHotel, setSelectedHotel] = useState(null);
  const [hotelModalOpen, setHotelModalOpen] = useState(false);

  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packageModalOpen, setPackageModalOpen] = useState(false);

  // Active checkout booking state
  const [bookingItem, setBookingItem] = useState(null);
  const [bookingType, setBookingType] = useState('flight');
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [flightsRes, hotelsRes, packagesRes] = await Promise.allSettled([
          api.get('/flights/popular'),
          api.get('/hotels/featured'),
          api.get('/packages/featured'),
        ]);

        if (flightsRes.status === 'fulfilled' && flightsRes.value.data?.data) {
          setPopularFlights(flightsRes.value.data.data.slice(0, 4));
        }
        if (hotelsRes.status === 'fulfilled' && hotelsRes.value.data?.data) {
          setFeaturedHotels(hotelsRes.value.data.data.slice(0, 4));
        }
        if (packagesRes.status === 'fulfilled' && packagesRes.value.data?.data) {
          setFeaturedPackages(packagesRes.value.data.data.slice(0, 3));
        }
      } catch (e) {
        console.error('Home page data error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBookFlight = (flight) => {
    setBookingItem(flight);
    setBookingType('flight');
    setBookingModalOpen(true);
  };

  const handleBookHotel = (hotel) => {
    setBookingItem(hotel);
    setBookingType('hotel');
    setBookingModalOpen(true);
  };

  const handleBookPackage = (pkg) => {
    setBookingItem(pkg);
    setBookingType('package');
    setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen space-y-16 pb-16">
      {/* 1. Hero Search Section */}
      <HeroSearch />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* 2. Special Promo Cards (ShareTrip inspired voucher slider cards) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Tag className="h-6 w-6 text-brand-500" />
              <span>Special Offers & Discounts</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-brand-600 to-sky-700 text-white relative overflow-hidden shadow-lg group">
              <div className="relative z-10 space-y-3">
                <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold uppercase tracking-wider">
                  Promo: TRAVEL20
                </span>
                <h3 className="text-xl font-black leading-snug">Flat 15% OFF on International Flights</h3>
                <p className="text-xs text-sky-100">Book Dubai, Singapore, Bangkok or London flights and save big.</p>
                <Button
                  size="sm"
                  variant="white"
                  onClick={() => navigate('/flights?destination=DXB')}
                  className="text-brand-600 hover:text-brand-700 font-extrabold px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <span>Book Now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Plane className="absolute -bottom-6 -right-6 h-36 w-36 text-white/10 group-hover:scale-110 transition-transform" />
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white relative overflow-hidden shadow-lg group">
              <div className="relative z-10 space-y-3">
                <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold uppercase tracking-wider">
                  Beach Escape
                </span>
                <h3 className="text-xl font-black leading-snug">Up to 30% OFF on Cox&apos;s Bazar Resorts</h3>
                <p className="text-xs text-orange-100">Complimentary buffet breakfast, pool access, and ocean views.</p>
                <Button
                  size="sm"
                  variant="white"
                  onClick={() => navigate('/hotels?city=Cox%27s+Bazar')}
                  className="text-orange-600 hover:text-orange-700 font-extrabold px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <span>View Resorts</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Building2 className="absolute -bottom-6 -right-6 h-36 w-36 text-white/10 group-hover:scale-110 transition-transform" />
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white relative overflow-hidden shadow-lg group">
              <div className="relative z-10 space-y-3">
                <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold uppercase tracking-wider">
                  Island Holiday
                </span>
                <h3 className="text-xl font-black leading-snug">Maldives Overwater Luxury Getaway</h3>
                <p className="text-xs text-emerald-100">Speedboat airport transfer, snorkeling, and sunset cruise included.</p>
                <Button
                  size="sm"
                  variant="white"
                  onClick={() => navigate('/packages?destination=Maldives')}
                  className="text-emerald-700 hover:text-emerald-800 font-extrabold px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <span>Explore Packages</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Palmtree className="absolute -bottom-6 -right-6 h-36 w-36 text-white/10 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </section>

        {/* Bank Partner & Lifestyle Card Promotions (ShareTrip Signature Feature) */}
        <BankPartnersSection />

        {/* 3. Popular Flight Fares */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Plane className="h-6 w-6 text-brand-500" />
                <span>Featured Flight Routes & Deals</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Direct flights from Dhaka with guaranteed verified fares</p>
            </div>
            <Link
              to="/flights"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
            >
              <span>View All Flights</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              {popularFlights.map((flight) => (
                <FlightCard
                  key={flight._id}
                  flight={flight}
                  onSelect={handleBookFlight}
                  onViewDetails={(f) => {
                    setSelectedFlight(f);
                    setFlightModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* TripCoins Loyalty Rewards Bar (ShareTrip Gamification) */}
        <TripCoinsWidget />

        {/* 4. Top Rated Hotels & Resorts */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="h-6 w-6 text-brand-500" />
                <span>Top Hotels & Luxury Resorts</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Handpicked properties with exceptional traveler ratings</p>
            </div>
            <Link
              to="/hotels"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
            >
              <span>Explore All Hotels</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredHotels.map((hotel) => (
                <HotelCard
                  key={hotel._id}
                  hotel={hotel}
                  onSelect={handleBookHotel}
                  onViewDetails={(h) => {
                    setSelectedHotel(h);
                    setHotelModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* 5. Trending Holiday Tour Packages */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Palmtree className="h-6 w-6 text-brand-500" />
                <span>Curated Holiday & Tour Packages</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Complete packages with hotels, guided tours, and airport transfers</p>
            </div>
            <Link
              to="/packages"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
            >
              <span>View All Packages</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredPackages.map((pkg) => (
                <PackageCard
                  key={pkg._id}
                  pkg={pkg}
                  onSelect={handleBookPackage}
                  onViewDetails={(p) => {
                    setSelectedPackage(p);
                    setPackageModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* 6. Why Book with Travel? */}
        <section className="bg-slate-100/80 rounded-3xl p-8 sm:p-12">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Why Travelers Choose Us</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Thousands of happy travelers book their flights, accommodations, and tours with Travel everyday.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 text-center">
              <div className="h-12 w-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">100% Safe & Secure</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Protected with modern industry-standard encryption protocols.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 text-center">
              <div className="h-12 w-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                <CreditCard className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Transparent Pricing</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                No hidden payment processing fees or surprise checkout surcharges.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 text-center">
              <div className="h-12 w-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                <Headphones className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">24/7 Dedicated Support</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Expert support team available anytime before, during, and after travel.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 text-center">
              <div className="h-12 w-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Instant Confirmation</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Instant digital e-tickets and confirmed PNR booking vouchers.
              </p>
            </div>
          </div>
        </section>

        {/* 7. App Download Teaser (ShareTrip inspired) */}
        <section className="bg-gradient-to-r from-brand-600 via-brand-500 to-sky-600 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
          <div className="max-w-xl space-y-4 relative z-10">
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
              Travel On The Go
            </span>
            <h2 className="text-2xl sm:text-4xl font-black leading-tight">
              Manage Your Itinerary Anywhere, Anytime
            </h2>
            <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
              Real-time flight gate updates, offline voucher downloads, and exclusive mobile-only promotions.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer hover:bg-slate-800 transition-colors">
                <Smartphone className="h-4 w-4" />
                <span>Download App</span>
              </div>
              <span className="text-xs text-sky-200">Available on iOS & Android</span>
            </div>
          </div>
        </section>
      </div>

      {/* Modals for Flight / Hotel / Package details & Booking */}
      <FlightDetailModal
        flight={selectedFlight}
        isOpen={flightModalOpen}
        onClose={() => setFlightModalOpen(false)}
        onBook={handleBookFlight}
      />

      <HotelDetailModal
        hotel={selectedHotel}
        isOpen={hotelModalOpen}
        onClose={() => setHotelModalOpen(false)}
        onBook={handleBookHotel}
      />

      <PackageDetailModal
        pkg={selectedPackage}
        isOpen={packageModalOpen}
        onClose={() => setPackageModalOpen(false)}
        onBook={handleBookPackage}
      />

      <BookingModal
        item={bookingItem}
        type={bookingType}
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
      />
    </div>
  );
};
