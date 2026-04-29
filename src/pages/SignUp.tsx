import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const SignUp = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Force sign out so they have to manually log in
      await supabase.auth.signOut();
      setMessage('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-300/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-md card relative z-10 p-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">GARDEN OF PEACE<br />MEMORIAL PARK</h1>
          <p className="text-gray-500 mt-3 text-sm">Create a public account to browse records</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 transition-colors focus:outline-none focus:border-blue-400 shadow-none text-base"
              placeholder="E.g. John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 transition-colors focus:outline-none focus:border-blue-400 shadow-none text-base"
              placeholder="visitor@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 transition-colors focus:outline-none focus:border-blue-400 shadow-none text-base"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 transition-colors focus:outline-none focus:border-blue-400 shadow-none text-base"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg text-center animate-pulse">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-lg text-center font-medium">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold transition-colors hover:bg-primary-hover focus:outline-none disabled:opacity-50 text-base shadow-sm"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
