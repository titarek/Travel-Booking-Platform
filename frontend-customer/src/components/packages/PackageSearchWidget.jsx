import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Search, MapPin } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

export const PackageSearchWidget = ({ initialValues = {}, onSearch }) => {
  const navigate = useNavigate();

  const [destination, setDestination] = useState(initialValues.destination || 'All');
  const [category, setCategory] = useState(initialValues.category || 'All');

  const destinations = ['All', 'Maldives', 'Dubai', "Cox's Bazar", 'Bangkok'];
  const categories = ['All', 'Family', 'Honeymoon', 'Adventure', 'Budget'];

  const handleSubmit = (e) => {
    e.preventDefault();
    const queryParams = new URLSearchParams({
      ...(destination !== 'All' ? { destination } : {}),
      ...(category !== 'All' ? { category } : {}),
    });

    if (onSearch) {
      onSearch({ destination, category });
    } else {
      navigate(`/packages?${queryParams.toString()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Destination Filter */}
        <div className="md:col-span-6 p-3.5 bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-brand-500 rounded-2xl shadow-sm transition-all">
          <span className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
            Dream Destination
          </span>
          <div className="flex items-center gap-2 mt-1">
            <MapPin className="h-4 w-4 text-brand-500 shrink-0" />
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full text-base font-black text-slate-900 border-none p-0 focus:outline-none focus:ring-0 bg-transparent cursor-pointer"
            >
              {destinations.map((d) => (
                <option key={d} value={d}>{d === 'All' ? 'All Global Destinations' : d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Filter */}
        <div className="md:col-span-6 p-3.5 bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-brand-500 rounded-2xl shadow-sm transition-all">
          <span className="block text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
            Holiday Experience Style
          </span>
          <div className="flex items-center gap-2 mt-1">
            <Compass className="h-4 w-4 text-brand-500 shrink-0" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-base font-black text-slate-900 border-none p-0 focus:outline-none focus:ring-0 bg-transparent cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === 'All' ? 'All Holiday Styles' : `${c} Holidays`}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Prominent Action Button */}
      <div className="flex justify-center pt-2">
        <Button
          type="submit"
          variant="accent"
          size="lg"
          className="px-10 py-3.5 rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 text-sm font-black flex items-center gap-2.5 transition-all transform hover:scale-[1.01]"
        >
          <Search className="h-4 w-4" />
          <span>Explore Holiday Packages</span>
        </Button>
      </div>
    </form>
  );
};
