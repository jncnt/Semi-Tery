import { useAuth } from '../contexts/AuthContext';
import { User } from 'lucide-react';

interface NavbarProps {
  user: any;
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const { userProfile } = useAuth();
  
  return (
    <header className="h-16 border-b border-gray-200 flex items-center justify-between px-8 bg-white sticky top-0 z-10 w-full">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          System Console
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{user.email}</p>
          <p className="text-xs text-blue-500 font-semibold uppercase tracking-wider">{userProfile?.role || 'Guest'}</p>
        </div>
        <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-gray-50 text-primary">
          <User size={20} />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
