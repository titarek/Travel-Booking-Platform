import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Palmtree, ArrowUpDown } from 'lucide-react';
import { PackageSearchWidget } from '../components/packages/PackageSearchWidget.jsx';
import { PackageCard } from '../components/packages/PackageCard.jsx';
import { PackageDetailModal } from '../components/packages/PackageDetailModal.jsx';
import { BookingModal } from '../components/booking/BookingModal.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import api from '../api/axios.js';

export const PackagesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('featured');

  const destination = searchParams.get('destination') || 'All';
  const category = searchParams.get('category') || 'All';

  // Modals
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [bookingPackage, setBookingPackage] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const categories = ['All', 'Family', 'Honeymoon', 'Adventure', 'Budget'];

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          ...(destination && destination !== 'All' ? { destination } : {}),
          ...(category && category !== 'All' ? { category } : {}),
          sort,
        });

        const res = await api.get(`/packages?${queryParams.toString()}`);
        if (res.data?.data) {
          setPackages(res.data.data);
        }
      } catch (err) {
        console.error('Packages load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [destination, category, sort]);

  const handleBookPackage = (pkg) => {
    setBookingPackage(pkg);
    setBookingModalOpen(true);
  };

  const handleViewDetails = (pkg) => {
    setSelectedPackage(pkg);
    setDetailModalOpen(true);
  };

  const handleCategorySelect = (cat) => {
    const sp = new URLSearchParams(searchParams);
    if (cat === 'All') {
      sp.delete('category');
    } else {
      sp.set('category', cat);
    }
    setSearchParams(sp);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Search Header Widget */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
          <PackageSearchWidget
            compact
            initialValues={{ destination, category }}
            onSearch={(params) => {
              const sp = new URLSearchParams(params);
              setSearchParams(sp);
            }}
          />
        </div>

        {/* Category Filter Pills Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                  category === cat
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {cat === 'All' ? 'All Packages' : `${cat} Holidays`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
              <ArrowUpDown className="h-3.5 w-3.5" />
              Sort:
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 cursor-pointer"
            >
              <option value="featured">Featured First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="duration">Duration (Days)</option>
            </select>
          </div>
        </div>

        {/* Packages Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : packages.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <Palmtree className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-base text-slate-800">No holiday packages found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try selecting a different destination or category to browse tailor-made itineraries.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg._id}
                pkg={pkg}
                onSelect={handleBookPackage}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <PackageDetailModal
        pkg={selectedPackage}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onBook={handleBookPackage}
      />

      <BookingModal
        item={bookingPackage}
        type="package"
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
      />
    </div>
  );
};
