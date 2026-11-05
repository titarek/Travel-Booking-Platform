import { useState } from 'react';
import { FileText, Clock, CheckCircle2, Globe2, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';

export const VisaWidget = () => {
  const [selectedCountry, setSelectedCountry] = useState('UAE');
  const [successMessage, setSuccessMessage] = useState(false);

  const visaData = {
    UAE: {
      name: 'United Arab Emirates (Dubai)',
      type: 'Tourist E-Visa (30 or 60 Days)',
      processingTime: '3 - 5 Working Days',
      fee: '৳ 10,500',
      validity: '60 Days from issue',
      requirements: [
        'Scanned Color Passport Copy (Min 6 months validity)',
        'White background passport-size photo',
        'Confirmed return flight itinerary',
        'Hotel booking confirmation voucher',
      ],
    },
    THA: {
      name: 'Thailand',
      type: 'Single Entry Tourist E-Visa',
      processingTime: '5 - 7 Working Days',
      fee: '৳ 6,200',
      validity: '90 Days validity (60 Days stay)',
      requirements: [
        'Original Passport with minimum 6 months validity',
        'Recent 35mm x 45mm studio photograph',
        'Bank Statement (Last 6 months, min balance ৳60k)',
        'Bank Solvency Certificate & Company NOC',
      ],
    },
    MYS: {
      name: 'Malaysia',
      type: 'eVisa / Social Visit Pass',
      processingTime: '2 - 4 Working Days',
      fee: '৳ 4,800',
      validity: '3 Months (Single Entry 30 Days)',
      requirements: [
        'Clear bio-page passport scan',
        'Digital photograph as per ICAO specifications',
        'Round-trip flight booking',
        'Proof of accommodation in Malaysia',
      ],
    },
    SGP: {
      name: 'Singapore',
      type: 'Entry Visa (Level 1 E-Visa)',
      processingTime: '4 - 6 Working Days',
      fee: '৳ 5,500',
      validity: 'Up to 2 Years Multiple Entry',
      requirements: [
        'Form 14A duly completed and signed',
        'Passport valid for at least 6 months',
        'Letter of Introduction (LOI) / Local sponsor or agency',
        'Confirmed air ticket and itinerary',
      ],
    },
  };

  const current = visaData[selectedCountry] || visaData.UAE;

  const handleApply = (e) => {
    e.preventDefault();
    setSuccessMessage(true);
    setTimeout(() => setSuccessMessage(false), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Country selection tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { code: 'UAE', label: 'Dubai / UAE', flag: '🇦🇪' },
          { code: 'THA', label: 'Thailand', flag: '🇹🇭' },
          { code: 'MYS', label: 'Malaysia', flag: '🇲🇾' },
          { code: 'SGP', label: 'Singapore', flag: '🇸🇬' },
        ].map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => setSelectedCountry(item.code)}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shrink-0 ${
              selectedCountry === item.code
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>{item.flag}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Selected Country Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">{current.name}</h3>
              <p className="text-xs text-brand-600 font-bold">{current.type}</p>
            </div>
            <Badge variant="accent" className="font-bold">
              Fast Track Available
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Processing Time
              </span>
              <span className="font-extrabold text-slate-900 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-brand-600" />
                {current.processingTime}
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Fee</span>
              <span className="font-extrabold text-emerald-600 text-sm">{current.fee}</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              Document Checklist:
            </span>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {current.requirements.map((req) => (
                <li key={req} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action form */}
        <div className="md:col-span-5 bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <span className="text-xs font-extrabold text-slate-900 block">Fast Visa Application</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Submit your passport details for direct embassy & immigration processing. Our visa specialists review your documents within 2 business hours.
            </p>
          </div>

          {successMessage ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Inquiry received! Our visa officer will call you shortly.</span>
            </div>
          ) : (
            <form onSubmit={handleApply} className="space-y-2">
              <input
                type="tel"
                required
                placeholder="Your Contact Phone (e.g. +88017...)"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
              />
              <Button type="submit" variant="primary" size="sm" className="w-full font-bold text-xs py-2">
                Request Visa Assistance
              </Button>
            </form>
          )}

          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <Globe2 className="h-3.5 w-3.5 text-slate-400" />
            <span>Official embassy approved agent representation</span>
          </div>
        </div>
      </div>
    </div>
  );
};
