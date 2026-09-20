import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const devBypassEnabled =
  import.meta.env.DEV &&
  String(import.meta.env.VITE_DEV_LOGIN_BYPASS ?? 'false').toLowerCase() === 'true';

const devBypassEmail = (import.meta.env.VITE_DEV_LOGIN_EMAIL || 'admin@local.test').toLowerCase();
const devBypassPassword = import.meta.env.VITE_DEV_LOGIN_PASSWORD || 'devpass123';

const getFriendlyAuthError = (message?: string) => {
  const lower = message?.toLowerCase() ?? '';

  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email before signing in. In Supabase, disable email confirmation in Auth settings or confirm the account first.';
  }

  if (lower.includes('invalid login credentials') || lower.includes('user not found')) {
    return 'Invalid login credentials.';
  }

  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many reset emails were requested. Please wait before trying again, or change your password from Account if you are already signed in.';
  }

  if (lower.includes('password')) {
    return 'The password is incorrect.';
  }

  return message || 'Unable to sign in. Please try again.';
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const trimmedEmail = email.trim();

    if (
      devBypassEnabled &&
      trimmedEmail.toLowerCase() === devBypassEmail &&
      password === devBypassPassword
    ) {
      const bypassSession = {
        user: {
          id: 'dev-bypass-user',
          email: trimmedEmail,
        },
      };

      localStorage.setItem('dev-bypass-session', JSON.stringify(bypassSession));
      setLoading(false);
      navigate('/');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        const rawDebug = {
          message: error.message,
          name: error.name,
          status: (error as any).status,
          code: (error as any).code,
          details: (error as any).details,
        };

        console.error('Supabase sign-in error:', rawDebug);
        setError(getFriendlyAuthError(error.message));
        setLoading(false);
        return;
      }

      navigate('/');
    } catch (err: unknown) {
      const rawError = err instanceof Error ? err : new Error('Unexpected sign-in error');
      console.error('Unexpected sign-in error:', rawError);
      setError(getFriendlyAuthError(rawError.message));
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const trimmedEmail = email.trim();
    setError(null);
    setResetMessage(null);

    if (!trimmedEmail) {
      setError('Enter your email address first.');
      return;
    }

    setResetLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);

    if (resetError) {
      setError(getFriendlyAuthError(resetError.message));
      return;
    }

    setResetMessage('Password reset instructions have been sent to your email.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F1EA] p-4 font-sans">
      <div className="w-full max-w-[480px] rounded-[18px] border border-[#D5DAD5] bg-[#F8F8F6] p-8 shadow-[0_8px_18px_rgba(31,64,53,0.05)] sm:p-10">
        <div className="mb-8 text-center">
          <h1 className="text-[2.05rem] font-black leading-[1.1] tracking-[-0.04em] text-[#2A2E2D]">
            GARDEN OF PEACE
            <br />
            MEMORIAL PARK
          </h1>
          <p className="mt-3 text-[0.98rem] text-[#6B756F]">Sign in to manage cemetery records</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="mb-2 block text-[1.02rem] font-medium text-[#3D4A45]">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[10px] border border-[#D9E0DB] bg-[#F7F7F5] px-4 py-3 text-[1.06rem] text-[#26332D] transition focus:border-[#2F5D50] focus:outline-none focus:ring-2 focus:ring-[#D7E5DF]"
              placeholder="admin@cemeterypro.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-[1.02rem] font-medium text-[#3D4A45]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[10px] border border-[#D9E0DB] bg-[#F7F7F5] px-4 py-3 text-[1.06rem] text-[#26332D] transition focus:border-[#2F5D50] focus:outline-none focus:ring-2 focus:ring-[#D7E5DF]"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={resetLoading}
              className="mt-2 text-sm font-semibold text-[#2F5D50] hover:underline disabled:opacity-60"
            >
              {resetLoading ? 'Sending reset email...' : 'Forgot password?'}
            </button>
          </div>

          {error && (
            <div className="rounded-[10px] border border-[#E0C9C3] bg-[#EADCD5] px-4 py-3 text-center text-[1.05rem] text-[#2F5D50] shadow-inner shadow-white/30">
              {error}
            </div>
          )}
          {resetMessage && (
            <div className="rounded-[10px] border border-[#C9DED2] bg-[#E8F0EA] px-4 py-3 text-center text-sm text-[#1F4035]">
              {resetMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[10px] bg-[#2F5D50] px-4 py-3 text-[1.05rem] font-semibold text-white transition hover:bg-[#24453D] focus:outline-none focus:ring-2 focus:ring-[#A7BFB1] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 border-t border-[#DFE5E0] pt-5 text-center">
          <p className="text-[1.02rem] text-[#6B756F]">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-[#2F5D50] hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
