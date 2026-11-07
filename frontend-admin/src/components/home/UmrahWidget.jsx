import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, MapPin, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';

export const UmrahWidget = () => {
  const navigate = useNavigate();
  const [duration, setDuration] = useState('10 Days');

  const packages = [
    {
      id: 'economy-umrah',
      title: 'Economy Umrah Package (10 Days)',
      makkahHotel: 'Dar Al Eiman Grand (600m to Haram)',
      madinahHotel: 'Al Haram Hotel (350m to Prophet Mosque)',
      price: '৳ 1,45,000',
      duration: '10 Days / 9 Nights',
      includes: ['Umrah Visa & Health Insurance', 'Direct Return Flights', 'Makkah & Madinah AC Bus', 'Historical Ziyarah Tour'],
      badge: 'Best Value',
    },
    {
      id: 'vip-umrah',
      title: 'VIP 5-Star Haram Front Package (14 Days)',
      makkahHotel: 'Swissôtel Makkah (Clock Tower Haram View)',
      madinahHotel: 'The Oberoi Madinah (Direct Courtyard Entrance)',
      price: '৳ 2,65,000',
      duration: '14 Days / 13 Nights',
      includes: ['Express VIP Visa', 'Private GMC Airport Transfer', 'Breakfast Buffet Included', 'Dedicated Religious Muallim'],
      badge: 'Luxury 5★',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">Duration:</span>
          {['7 Days', '10 Days', '14 Days', '21 Days'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                duration === d ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="accent" className="font-bold flex items-center gap-1">
            <Moon className="h-3 w-3" />
            <span>Ministry of Hajj & Umrah Approved</span>
          </Badge>
        </div>
      </div>

      {/* Package Showcase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="p-5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-brand-500 rounded-2xl transition-all shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-brand-600 tracking-wider">
                  {pkg.duration}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  {pkg.badge}
                </span>
              </div>

              <h4 className="text-base font-black text-slate-900 leading-snug">{pkg.title}</h4>

              <div className="space-y-1.5 text-xs text-slate-600">
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                  <span>Makkah: <strong className="text-slate-800">{pkg.makkahHotel}</strong></span>
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Madinah: <strong className="text-slate-800">{pkg.madinahHotel}</strong></span>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/80 space-y-1">
                {pkg.includes.map((inc) => (
                  <p key={inc} className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>{inc}</span>
                  </p>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Starting from / person</span>
                <span className="text-lg font-black text-slate-900">{pkg.price}</span>
              </div>
              <Button
                variant="accent"
                size="sm"
                onClick={() => navigate('/packages?destination=Saudi+Arabia')}
                className="font-bold text-xs px-4"
              >
                Book Package
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
