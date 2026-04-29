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
    <aside className="w-64 border-r border-gray-200 flex flex-col h-screen sticky top-0 bg-white">
      <div className="p-6 border-b border-gray-100 mb-4">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-snug">GARDEN OF PEACE<br />MEMORIAL PARK</h1>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Management System</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-primary border border-blue-100'
                  : 'text-gray-500 hover:bg-gray-50 border border-transparent'
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
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-transparent"
        >
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
