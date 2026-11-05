export const Tabs = ({ tabs, activeTab, onChange, className = '' }) => (
  <div className={`inline-flex items-center space-x-1.5 p-1.5 bg-slate-100/90 rounded-2xl flex-wrap ${className}`}>
    {tabs.map((tab) => {
      const isActive = activeTab === tab.id;
      const Icon = tab.icon;
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 select-none ${
            isActive
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25 scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          {Icon && (
            <Icon
              className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`}
            />
          )}
          <span>{tab.label}</span>
          {tab.badge && (
            <span
              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                isActive
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {tab.badge}
            </span>
          )}
        </button>
      );
    })}
  </div>
);
