import { NavLink, Link } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';
import { GearIcon } from './Icons';

// Desktop top navbar (mockup 3): blue bar, logo + Hebrew links.
export default function Navbar() {
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
        <NavLink
          to="/organizer"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-1.5 rounded-app text-sm font-medium transition-colors ${
              isActive ? 'bg-white/20' : 'hover:bg-white/10'
            }`
          }
        >
          <GearIcon className="w-4 h-4" />
          מארגן
        </NavLink>
      </div>
    </header>
  );
}
