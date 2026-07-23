import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';

// Mobile bottom tab bar (mockup 1): blue icons + Hebrew labels,
// active tab marked with a blue underline.
export default function TabBar() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex overflow-x-auto no-scrollbar">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 min-w-[64px] flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-medium border-b-2 ${
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
      </div>
    </nav>
  );
}
