import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Flex Centering Wrapper */}
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 text-center">
        {/* Modal Dialog Container */}
        <div
          role="dialog"
          aria-modal="true"
          className={`relative w-full ${maxWidth} bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all z-10 my-8 text-left`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content body */}
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
