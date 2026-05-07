import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Map, LogOut, CalendarClock } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Sidebar = () => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/records', icon: Users, label: 'Burial Records' },
    { to: '/plots', icon: Map, label: 'Plot Management' },
    { to: '/reservations', icon: CalendarClock, label: 'Reservations' },
  ];

  return (
    <aside className="w-64 border-r border-gray-200 flex flex-col h-screen sticky top-0 bg-white">
      <div className="p-6 border-b border-gray-100 mb-4">
        <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-blue-700 to-blue-400 tracking-tight leading-snug">GARDEN OF<br />PEACE</h1>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Management System</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-300 font-semibold ${isActive
                ? 'bg-gradient-to-r from-blue-50/80 to-blue-100/30 text-blue-700 shadow-sm shadow-blue-500/10 border border-blue-200/60 translate-x-1'
                : 'text-gray-500 hover:bg-gray-50/80 hover:text-gray-800 border border-transparent'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-gray-500 font-semibold hover:bg-red-50/80 hover:text-red-600 transition-all duration-300 border border-transparent hover:border-red-100"
        >
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
