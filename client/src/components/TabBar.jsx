import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NAV_ITEMS, MORE_ITEMS } from './navItems';
import { DotsIcon } from './Icons';

// Mobile bottom tab bar (mockup 1): blue icons + Hebrew labels, active tab
// marked with a blue underline. טיפים/מארגן live behind the "עוד" tab.
export default function TabBar() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const moreActive = MORE_ITEMS.some((item) => item.to === pathname);

  return (
    <>
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/30" />
          <div className="absolute bottom-16 left-3 right-3 card p-2" onClick={(e) => e.stopPropagation()}>
            {MORE_ITEMS.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-app text-sm font-semibold ${
                    isActive ? 'bg-sky-50 text-ocean' : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                `flex-1 min-w-[60px] flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-medium border-b-2 ${
                  isActive
                    ? 'text-ocean border-ocean'
                    : 'text-slate-500 border-transparent hover:text-ocean'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={`flex-1 min-w-[60px] flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-medium border-b-2 ${
              moreActive || moreOpen
                ? 'text-ocean border-ocean'
                : 'text-slate-500 border-transparent hover:text-ocean'
            }`}
          >
            <DotsIcon className="w-5 h-5" />
            <span>עוד</span>
          </button>
        </div>
      </nav>
    </>
  );
}
