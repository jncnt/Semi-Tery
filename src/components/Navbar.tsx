import { useAuth } from '../contexts/AuthContext';
import { Sparkles } from 'lucide-react';

interface NavbarProps {
  user: any;
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const { userProfile, isAdmin } = useAuth();
  const initial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';
  
  return (
    <header className="h-16 border-b border-slate-100 flex items-center justify-between px-8 bg-white sticky top-0 z-10 w-full shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-200/60">
          <Sparkles size={14} className="text-blue-600" />
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
            System Console
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="text-right">
          <p className="text-xs font-bold text-slate-800 tracking-tight">{user.email}</p>
          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider mt-0.5 ${
            isAdmin ? 'bg-blue-50 text-blue-700 border border-blue-200/60' : 'bg-slate-100 text-slate-600'
          }`}>
            {userProfile?.role || 'Visitor'}
          </span>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20 shrink-0">
          {initial}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
