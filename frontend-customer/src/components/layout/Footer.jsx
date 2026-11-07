import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plane, Mail, Phone, MapPin, ShieldCheck, Headphones, Award, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

export const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Proposition Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-slate-800">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-500/10 rounded-2xl text-brand-400 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Secure & Verified Bookings</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Bank-grade 256-bit encrypted transactions and 100% verified airline & hotel inventory.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-500/10 rounded-2xl text-brand-400 shrink-0">
              <Headphones className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">24/7 Priority Travel Concierge</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Dedicated support specialists ready around the clock to assist your journey.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-500/10 rounded-2xl text-brand-400 shrink-0">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Best Rate Guarantee</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Transparent pricing with no hidden charges, plus flexible cancellation options.
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 py-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-brand-500 flex items-center justify-center text-white">
                <Plane className="h-5 w-5 -rotate-45" />
              </div>
              <span className="text-2xl font-black text-white">
                Travel<span className="text-brand-400">.</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Travel is an advanced online travel agency platform offering seamless bookings for domestic and international flights, luxury hotels, and curated holiday tour packages.
            </p>
            <div className="space-y-2 text-xs text-slate-400 pt-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-400" />
                <span>+880 9617-888888 (24/7 Hotline)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-400" />
                <span>support@travel-booking.demo</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-400" />
                <span>Gulshan-2, Dhaka 1212, Bangladesh</span>
              </div>
            </div>
          </div>

          {/* Travel Services */}
          <div className="space-y-3">
            <h5 className="text-white text-xs font-bold uppercase tracking-wider">Book Services</h5>
            <ul className="space-y-2 text-xs">
              <li><Link to="/flights" className="hover:text-white transition-colors">Domestic Flights</Link></li>
              <li><Link to="/flights" className="hover:text-white transition-colors">International Flights</Link></li>
              <li><Link to="/hotels" className="hover:text-white transition-colors">Hotels & Resorts</Link></li>
              <li><Link to="/packages" className="hover:text-white transition-colors">Holidays & Packages</Link></li>
              <li><Link to="/my-bookings" className="hover:text-white transition-colors">Manage My Booking</Link></li>
            </ul>
          </div>

          {/* Popular Destinations */}
          <div className="space-y-3">
            <h5 className="text-white text-xs font-bold uppercase tracking-wider">Top Destinations</h5>
            <ul className="space-y-2 text-xs">
              <li><Link to="/hotels?city=Cox's+Bazar" className="hover:text-white transition-colors">Cox&apos;s Bazar, Bangladesh</Link></li>
              <li><Link to="/hotels?city=Dubai" className="hover:text-white transition-colors">Dubai, UAE</Link></li>
              <li><Link to="/hotels?city=Bangkok" className="hover:text-white transition-colors">Bangkok, Thailand</Link></li>
              <li><Link to="/hotels?city=Singapore" className="hover:text-white transition-colors">Singapore City</Link></li>
              <li><Link to="/hotels?city=Maldives" className="hover:text-white transition-colors">Maldives Overwater</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-3">
            <h5 className="text-white text-xs font-bold uppercase tracking-wider">Exclusive Deals</h5>
            <p className="text-xs text-slate-400">
              Subscribe to receive flash flight sales and holiday discount promos directly.
            </p>
            {subscribed ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Thank you! You are now subscribed.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
                />
                <Button type="submit" variant="primary" size="sm" className="w-full">
                  Subscribe
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom copyright and payment logos */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Travel Technologies Ltd. Inspired by modern travel platforms.</p>
          <div className="flex items-center gap-3 font-semibold text-slate-400">
            <span className="px-2 py-1 bg-slate-800 rounded">VISA</span>
            <span className="px-2 py-1 bg-slate-800 rounded">Mastercard</span>
            <span className="px-2 py-1 bg-slate-800 rounded">AMEX</span>
            <span className="px-2 py-1 bg-slate-800 rounded">bKash</span>
            <span className="px-2 py-1 bg-slate-800 rounded">SSLCommerz</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
