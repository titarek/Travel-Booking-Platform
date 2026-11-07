import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar.jsx';
import { Footer } from './components/layout/Footer.jsx';
import { AuthModal } from './components/auth/AuthModal.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { FlightsPage } from './pages/FlightsPage.jsx';
import { HotelsPage } from './pages/HotelsPage.jsx';
import { PackagesPage } from './pages/PackagesPage.jsx';
import { MyBookingsPage } from './pages/MyBookingsPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/flights" element={<FlightsPage />} />
          <Route path="/hotels" element={<HotelsPage />} />
          <Route path="/packages" element={<PackagesPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <AuthModal />
    </div>
  );
}
