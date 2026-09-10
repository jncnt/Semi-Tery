import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Map, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Sidebar = () => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/records', icon: Users, label: 'Burial Records' },
    { to: '/plots', icon: Map, label: 'Plot Management' },
  ];

  return (
    <aside className="w-68 border-r border-slate-200/80 flex flex-col h-screen sticky top-0 bg-white select-none z-20">
      <div className="p-6 border-b border-slate-100 mb-4 flex items-center gap-3">
        <img
          src="/garden-of-peace-favicon.svg"
          alt="Garden of Peace Memorial Park"
          className="w-10 h-10 rounded-2xl border border-[#d8ddca] shadow-sm shrink-0"
        />
        <div>
          <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
            GARDEN OF PEACE
          </h1>
          <p className="text-[11px] font-semibold text-blue-600 tracking-wider uppercase mt-0.5">Memorial Park</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1.5">
        <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Main Navigation
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm ${
                isActive
                  ? 'bg-blue-50/80 text-blue-700 border border-blue-100 shadow-xs translate-x-0.5'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:translate-x-0.5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} className={isActive ? 'text-blue-600 stroke-[2.2]' : 'text-slate-400 group-hover:text-slate-600'} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-semibold text-sm border border-transparent hover:border-red-100"
        >
          <LogOut size={18} className="text-slate-400 group-hover:text-red-500" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
