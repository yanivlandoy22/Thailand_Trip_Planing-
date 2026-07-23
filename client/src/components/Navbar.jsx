import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS, MORE_ITEMS } from './navItems';
import { DotsIcon } from './Icons';

// Desktop top navbar (mockup 3): blue bar, logo + Hebrew links; טיפים and
// אזור מארגן sit in a small "עוד" dropdown.
export default function Navbar() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const moreActive = MORE_ITEMS.some((item) => item.to === pathname);

  return (
    <header className="hidden md:block sticky top-0 z-40 bg-ocean text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <span>🇹🇭</span>
          <span className="font-serif">תאילנד</span>
        </Link>
        <nav className="flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-app text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/20' : 'hover:bg-white/10'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="relative">
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-app text-sm font-medium transition-colors ${
              moreActive || moreOpen ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            <DotsIcon className="w-4 h-4" />
            עוד
          </button>
          {moreOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
              <div className="absolute z-50 left-0 top-full mt-1 card p-1.5 min-w-[160px]">
                {MORE_ITEMS.map(({ to, label, Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-app text-sm font-semibold ${
                        isActive ? 'bg-sky-50 text-ocean' : 'text-slate-700 hover:bg-slate-50'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </NavLink>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
