import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Map, LogOut, Bell, BookmarkCheck, UserCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { isAdmin } = useAuth();
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    ...(isAdmin
      ? [
          { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/records', icon: Users, label: 'Burial Records' },
          { to: '/plots', icon: Map, label: 'Plot Management' },
          { to: '/vicinity-map', icon: Map, label: 'Vicinity Map' },
          { to: '/notifications', icon: Bell, label: 'Notifications' },
        ]
      : [
          { to: '/', icon: Map, label: 'Home' },
          { to: '/plots', icon: Map, label: 'Browse Available Plots' },
          { to: '/vicinity-map', icon: Map, label: 'Vicinity Map' },
          { to: '/reservations', icon: BookmarkCheck, label: 'My Reservations' },
          { to: '/account', icon: UserCircle, label: 'My Account' },
        ]),
  ];

  return (
    <aside className="w-68 border-r border-[#1F4035] flex flex-col h-screen sticky top-0 bg-[#1F4035] select-none z-20 max-md:w-[4.75rem]">
      <div className="p-6 border-b border-[#486F60] mb-4 flex items-center gap-3 max-md:px-3 max-md:justify-center">
        <img
          src="/garden-of-peace-favicon.svg"
          alt="Garden of Peace Memorial Park"
          className="w-10 h-10 rounded-2xl border border-[#d8ddca] shadow-sm shrink-0"
        />
        <div className="sidebar-wordmark max-md:hidden">
          <h1 className="text-base font-extrabold text-white tracking-tight leading-tight">
            GARDEN OF PEACE
          </h1>
          <p className="text-[11px] font-semibold text-[#D7C58F] tracking-wider uppercase mt-0.5">Memorial Park</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1.5 max-md:px-2">
        <div className="sidebar-label px-3 pb-2 text-[11px] font-bold text-[#A9C0B0] uppercase tracking-wider max-md:hidden">
          Main Navigation
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm ${
                isActive
                  ? 'bg-[#E8F0EA] text-[#1F4035] border border-[#E8F0EA] shadow-xs translate-x-0.5'
                  : 'text-[#E1E7E2] hover:bg-[#2F5D50] hover:text-white border border-transparent hover:translate-x-0.5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} className={isActive ? 'text-[#2F5D50] stroke-[2.2]' : 'text-[#A9C0B0]'} />
                <span className="sidebar-label max-md:hidden">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-[#486F60] max-md:px-2">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#E1E7E2] hover:bg-[#76534B]/30 hover:text-white transition-all duration-200 font-semibold text-sm border border-transparent hover:border-[#76534B]/40 max-md:justify-center max-md:px-2"
        >
          <LogOut size={18} className="text-[#A9C0B0]" />
          <span className="sidebar-label max-md:hidden">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
