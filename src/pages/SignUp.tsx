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

    try {
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      // Log full response for debugging database / trigger errors
      // (Console output will show the server error details)
      console.debug('signUp response', response);

      const { error } = response;

      if (error) {
        const details = (error as any).details ? ` (${(error as any).details})` : '';
        setError(`${error.message}${details}`);
        console.error('Sign up error:', error);
        setLoading(false);
        return;
      }

      // Best-effort: try to create/update a profiles row for the new user.
      // Some Supabase projects rely on an auth trigger (on_auth_user_created) to create this row;
      // using upsert prevents duplicate key errors if the trigger ran already.
      try {
        const user = (response as any).data?.user;
        if (user?.id) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert([{ id: user.id, full_name: fullName }], { onConflict: 'id' });

          if (profileError) {
            console.warn('Profile creation/upsert notice:', profileError);
            const errMsg = (profileError as any).message || '';
            const isDuplicate = (profileError as any).code === '23505' || errMsg.includes('duplicate key');
            const isMissingTable = errMsg.includes('relation "profiles" does not exist');

            if (isMissingTable) {
              console.error(
                'Missing profiles table — run this SQL to create it:\n',
                `create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'visitor',
  avatar_url text,
  created_at timestamptz default now()
);`
              );
            }

            // If it's NOT a harmless duplicate key conflict, log it for debugging
            if (!isDuplicate && !isMissingTable) {
              console.info('User account was created, but profile update requires elevated policy or trigger.');
            }
          }
        }
      } catch (innerErr) {
        console.error('Non-fatal error creating profile:', innerErr);
      }

      // Force sign out so they have to manually log in
      await supabase.auth.signOut();
      setMessage('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      // Unexpected runtime error
      console.error('Unexpected error during sign up', err);
      setError('Unexpected error during registration. Check console for details.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white p-10 rounded-xl border border-gray-200 shadow-sm">
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
              placeholder="Enter your password"
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
              placeholder="Confirm your password"
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
