export const Card = ({ children, className = '', hover = false, ...props }) => (
  <div
    className={`bg-white rounded-2xl border border-slate-100 shadow-card transition-all duration-200 ${
      hover ? 'hover:shadow-float hover:-translate-y-0.5' : ''
    } ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={`p-5 border-b border-slate-100 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-bold text-slate-900 tracking-tight ${className}`}>
    {children}
  </h3>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`p-5 ${className}`}>
    {children}
  </div>
);
