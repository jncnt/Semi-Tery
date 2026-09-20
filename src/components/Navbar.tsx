import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  user: any;
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const { userProfile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const initial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  const customerFirstName = (() => {
    const fromFirstName = userProfile?.first_name?.trim();
    if (fromFirstName) return fromFirstName;

    const fromFullName = userProfile?.full_name?.trim();
    if (fromFullName) {
      return fromFullName.split(/\s+/).filter(Boolean)[0] || 'Visitor';
    }

    return 'Visitor';
  })();

  const statusLabel = isAdmin ? (userProfile?.role || 'Admin') : `Hai, ${customerFirstName}!`;

  const navigateTo = (destination: string) => {
    navigate(destination);
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    navigateTo(searchQuery.trim() ? `/plots?search=${encodeURIComponent(searchQuery.trim())}` : '/plots');
    setIsSearchOpen(false);
  };

  const dropdowns = isAdmin
    ? [
        { key: 'records', label: 'Records', items: [{ label: 'Burial Records', path: '/records' }, { label: 'Notifications', path: '/notifications' }] },
        { key: 'account', label: 'Account', items: [{ label: 'My Account', path: '/account' }, { label: 'Sign Out', path: '/logout' }] },
      ]
    : [
        { key: 'account', label: 'Account', items: [{ label: 'My Reservations', path: '/reservations' }, { label: 'My Account', path: '/account' }] },
      ];

  const handleDropdownItem = async (path: string) => {
    if (path === '/logout') {
      await supabase.auth.signOut();
      navigate('/login');
      return;
    }
    navigateTo(path);
  };
  
  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#345F50] bg-[#1F4035]/95 text-white shadow-md backdrop-blur-md">
      <div className="mx-auto flex h-[4.5rem] w-full max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
          <img src="/garden-of-peace-favicon.svg" alt="Garden of Peace Memorial Park" className="h-9 w-9 rounded-xl border border-white/25" />
          <div className="hidden sm:block">
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#F0D995]">Garden of Peace</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/65">Memorial Park</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 text-xs font-bold uppercase tracking-wider xl:flex">
          <button onClick={() => navigateTo('/')} className="rounded-lg px-3 py-2 text-[#F0D995] transition hover:bg-white/10">Home</button>
          <button onClick={() => navigateTo('/plots')} className="rounded-lg px-3 py-2 text-white/85 transition hover:bg-white/10 hover:text-white">{isAdmin ? 'Plot Management' : 'Browse Plots'}</button>
          {dropdowns.map((dropdown) => (
            <div className="relative" key={dropdown.key}>
              <button
                onClick={() => setActiveDropdown(activeDropdown === dropdown.key ? null : dropdown.key)}
                className={`flex items-center gap-1 rounded-lg px-3 py-2 transition hover:bg-white/10 ${activeDropdown === dropdown.key ? 'bg-white/10 text-[#F0D995]' : 'text-white/85'}`}
              >
                {dropdown.label}<ChevronDown size={14} className={activeDropdown === dropdown.key ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
              {activeDropdown === dropdown.key && (
                <div className="absolute left-0 top-full mt-2 w-52 rounded-xl border border-white/10 bg-[#1F4035]/98 p-2 shadow-2xl backdrop-blur-lg">
                  {dropdown.items.map((item) => (
                    <button key={item.path} onClick={() => handleDropdownItem(item.path)} className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold normal-case tracking-normal text-white/80 transition hover:bg-white/10 hover:text-[#F0D995]">
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            {isSearchOpen && (
              <form onSubmit={handleSearch} className="absolute right-10 top-1/2 -translate-y-1/2">
                <input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search plots..." className="w-44 rounded-lg border border-white/20 bg-[#10251f] px-3 py-2 text-xs text-white outline-none placeholder:text-white/45 focus:border-[#C6A15B] sm:w-56" />
              </form>
            )}
            <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="rounded-lg p-2 transition hover:bg-white/10" aria-label="Search plots">
              <Search size={18} className="text-white/85" />
            </button>
          </div>

          <div className="hidden items-center gap-2 border-l border-white/15 pl-3 sm:flex">
            <div className="text-right">
              <p className="max-w-40 truncate text-xs font-bold text-white">{user.email}</p>
              <span className={`mt-0.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${isAdmin ? 'bg-[#F5EEDB] text-[#8A6A2F]' : 'bg-white/10 text-white/70'}`}>
                {statusLabel}
              </span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F5D50] text-sm font-bold text-white">{initial}</div>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-lg p-2 transition hover:bg-white/10 xl:hidden" aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[#10251f] px-5 pb-5 pt-3 xl:hidden">
          <button onClick={() => navigateTo('/')} className="block w-full rounded-lg px-3 py-3 text-left text-sm font-bold uppercase tracking-wider text-[#F0D995] hover:bg-white/10">Home</button>
          <button onClick={() => navigateTo('/plots')} className="block w-full rounded-lg px-3 py-3 text-left text-sm font-bold uppercase tracking-wider text-white/85 hover:bg-white/10">{isAdmin ? 'Plot Management' : 'Browse Plots'}</button>
          {dropdowns.flatMap((dropdown) => dropdown.items).map((item) => (
            <button key={item.path} onClick={() => handleDropdownItem(item.path)} className="block w-full rounded-lg px-3 py-3 text-left text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-[#F0D995]">{item.label}</button>
          ))}
          <div className="mt-3 flex items-center gap-3 border-t border-white/10 pt-4 sm:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F5D50] text-sm font-bold">{initial}</div>
            <div><p className="text-xs font-bold text-white">{user.email}</p><p className="text-[10px] uppercase tracking-wider text-white/55">{statusLabel}</p></div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
