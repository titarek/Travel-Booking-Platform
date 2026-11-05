import { Routes, Route, useLocation } from 'react-router-dom';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import { Navbar } from './components/layout/Navbar.jsx';
import { Footer } from './components/layout/Footer.jsx';
import { AuthModal } from './components/auth/AuthModal.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { FlightsPage } from './pages/FlightsPage.jsx';
import { HotelsPage } from './pages/HotelsPage.jsx';
import { PackagesPage } from './pages/PackagesPage.jsx';
import { MyBookingsPage } from './pages/MyBookingsPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

export default function App() {
  const location = useLocation();
  const isLocalDevClient = typeof window !== 'undefined'
    && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    && window.location.port === '5173';

  const isAdminPort = typeof window !== 'undefined' && window.location.port === '5174';
  const isAdminPath = location.pathname.startsWith('/admin');

  // Dedicated Admin Portal (Running on Port 5174 in dev, or on /admin in production)
  const isDedicatedAdmin = isAdminPort || (!isLocalDevClient && isAdminPath);

  if (isDedicatedAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 selection:bg-indigo-600 selection:text-white">
        <Routes>
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="*" element={<AdminPage />} />
        </Routes>
        <AuthModal />
      </div>
    );
  }

  // Client Portal (Running on Port 5173)
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
      {!isAdminPath && <Navbar />}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/flights" element={<FlightsPage />} />
          <Route path="/hotels" element={<HotelsPage />} />
          <Route path="/packages" element={<PackagesPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route
            path="/admin/*"
            element={(
              <div className="min-h-[75vh] flex items-center justify-center py-16 px-4">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl space-y-5 text-center">
                  <div className="h-16 w-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 px-3 py-1 bg-indigo-50 rounded-full">
                      Dedicated Admin Environment
                    </span>
                    <h2 className="text-2xl font-black text-slate-900">Admin Console on Port 5174</h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      To ensure security and session isolation, the administrator console runs on a dedicated management port (<strong>http://localhost:5174</strong>). This keeps admin sessions completely decoupled from customer bookings.
                    </p>
                  </div>
                  <div className="pt-2">
                    <a
                      href="http://localhost:5174"
                      className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 transition-all"
                    >
                      <span>Open Admin Portal (Port 5174)</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {!isAdminPath && <Footer />}
      <AuthModal />
    </div>
  );
}
