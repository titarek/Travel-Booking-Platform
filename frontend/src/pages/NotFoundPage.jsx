import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';

export const NotFoundPage = () => (
  <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
    <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 text-center max-w-md w-full shadow-sm space-y-5">
      <div className="h-16 w-16 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mx-auto">
        <Compass className="h-8 w-8 animate-spin" style={{ animationDuration: '8s' }} />
      </div>
      <div>
        <h1 className="text-4xl font-black text-slate-900">404</h1>
        <h2 className="text-base font-bold text-slate-700 mt-1">Page Not Found</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          The flight route or page you are looking for has departed or does not exist.
        </p>
      </div>
      <Link to="/" className="inline-block w-full">
        <Button variant="primary" className="w-full font-bold">
          Back to Homepage
        </Button>
      </Link>
    </div>
  </div>
);
