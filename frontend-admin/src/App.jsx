import { Routes, Route } from 'react-router-dom';
import { AuthModal } from './components/auth/AuthModal.jsx';
import { AdminPage } from './pages/AdminPage.jsx';

export default function App() {
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
