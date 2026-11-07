import { useState } from 'react';
import {
  Plane,
  Building2,
  Palmtree,
  Moon,
  FileCheck2,
  Compass,
} from 'lucide-react';
import { Tabs } from '../ui/Tabs.jsx';
import { FlightSearchWidget } from '../flights/FlightSearchWidget.jsx';
import { HotelSearchWidget } from '../hotels/HotelSearchWidget.jsx';
import { PackageSearchWidget } from '../packages/PackageSearchWidget.jsx';
import { UmrahWidget } from '../home/UmrahWidget.jsx';
import { VisaWidget } from '../home/VisaWidget.jsx';
import { FlightTrackerWidget } from '../home/FlightTrackerWidget.jsx';

export const HeroSearch = () => {
  const [activeTab, setActiveTab] = useState('flights');

  const tabs = [
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'hotels', label: 'Hotels', icon: Building2 },
    { id: 'packages', label: 'Holidays', icon: Palmtree },
    { id: 'umrah', label: 'Umrah', icon: Moon, badge: 'New' },
    { id: 'visa', label: 'Visa Guide', icon: FileCheck2 },
    { id: 'tracker', label: 'Flight Status', icon: Compass, badge: 'Live' },
  ];

  return (
    <section className="relative overflow-hidden bg-slate-950 pt-8 pb-16 md:pt-14 md:pb-24">
      {/* Background Graphic & Travel Landscape Image */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Real scenic flight travel backdrop */}
        <img
          src="/hero-travel.jpg"
          alt="Scenic Flight Travel Background"
          className="w-full h-full object-cover object-center opacity-35 scale-105"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&auto=format&fit=crop&q=80';
          }}
        />
        {/* Deep rich contrast gradient overlay ensuring 100% crisp typography readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/70 to-slate-950/90" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Header & Value Props */}
        <div className="text-center pt-2 pb-8 max-w-3xl mx-auto space-y-3.5">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
            Book Flights, Hotels & <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-sky-200 to-amber-200">Holiday Packages</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-200 font-medium max-w-2xl mx-auto leading-relaxed drop-shadow">
            Search hundreds of airline routes, verified luxury resorts, Umrah packages, and real-time flight tracking at guaranteed best rates.
          </p>
        </div>

        {/* Floating Elevated Search Card (ShareTrip Style) */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-5 sm:p-7 relative max-w-5xl mx-auto">
          {/* Service Category Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-5 mb-5 border-b border-slate-100">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={setActiveTab}
              className="bg-slate-100 p-1 rounded-2xl"
            />
          </div>

          {/* Active Search / Service Engine */}
          {activeTab === 'flights' && <FlightSearchWidget />}
          {activeTab === 'hotels' && <HotelSearchWidget />}
          {activeTab === 'packages' && <PackageSearchWidget />}
          {activeTab === 'umrah' && <UmrahWidget />}
          {activeTab === 'visa' && <VisaWidget />}
          {activeTab === 'tracker' && <FlightTrackerWidget />}
        </div>
      </div>
    </section>
  );
};
