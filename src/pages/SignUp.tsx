import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const SignUp = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');

    const trimmedName = fullName.trim();
    const nameParts = trimmedName.split(/\s+/).filter(Boolean);

    const hasThreeParts = nameParts.length >= 3;
    const firstNameValid = nameParts[0]?.length >= 2;
    const middleNameValid = nameParts[1]?.length >= 2;
    const lastNameValid = nameParts[nameParts.length - 1]?.length >= 2;

    if (!trimmedName || !hasThreeParts || !firstNameValid || !middleNameValid || !lastNameValid) {
      setNameError('Please enter your full name with first, middle, and last name.');
      return;
    }

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
            full_name: trimmedName,
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
    <div
      className="relative flex min-h-screen w-full flex-col justify-between bg-cover bg-center font-sans"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2200&q=85')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#10251f]/80 via-[#1f4035]/35 to-[#10251f]/85" />

      <header className="relative z-10 flex w-full items-center justify-between border-b border-white/15 bg-[#10251f]/30 px-6 py-4 backdrop-blur-md md:px-10">
        <Link to="/login" className="flex items-center gap-3">
          <img src="/garden-of-peace-favicon.svg" alt="Garden of Peace" className="h-10 w-10 rounded-xl border border-white/30" />
          <span className="text-sm font-extrabold uppercase tracking-[0.16em] text-white sm:text-base">Garden of Peace</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-white/85 md:flex">
          <a href="#home" className="transition-colors hover:text-[#E6CC8A]">Home</a>
          <a href="#about" className="transition-colors hover:text-[#E6CC8A]">About Us</a>
          <a href="#services" className="transition-colors hover:text-[#E6CC8A]">Services</a>
          <Link to="/login" className="transition-colors hover:text-[#E6CC8A]">Sign In</Link>
        </nav>
      </header>

      <main id="home" className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center justify-between gap-12 px-6 py-12 lg:px-10">
        <div className="hidden max-w-xl space-y-5 text-white lg:block">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#E6CC8A]">A lasting place of peace</p>
          <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight drop-shadow-lg xl:text-7xl">A better place to remember.</h1>
          <p className="max-w-lg text-lg font-medium leading-8 text-white/80">Secure a tranquil sanctuary and a beautiful legacy for the people who matter most.</p>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-white/40 bg-white/95 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A6A2F]">Garden of Peace</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1F4035]">Create Account</h2>
            <p className="mt-2 text-sm leading-6 text-[#6B756F]">Enter your details to begin exploring the memorial park.</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#526159]">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (nameError) setNameError('');
                }}
                className={`w-full rounded-xl border bg-[#F7F9F6] px-4 py-3 text-sm text-[#26332D] transition focus:outline-none focus:ring-2 ${nameError ? 'border-[#B97868] focus:border-[#B97868] focus:ring-[#F1E5E2]' : 'border-[#D8E3DA] focus:border-[#2F5D50] focus:ring-[#E8F0EA]'}`}
                placeholder="First and Last Name"
                required
              />
              {nameError && <p className="mt-1.5 text-xs font-semibold text-[#76534B]">{nameError}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#526159]">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-[#D8E3DA] bg-[#F7F9F6] px-4 py-3 text-sm text-[#26332D] transition focus:border-[#2F5D50] focus:outline-none focus:ring-2 focus:ring-[#E8F0EA]" placeholder="name@example.com" required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#526159]">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-[#D8E3DA] bg-[#F7F9F6] px-4 py-3 text-sm text-[#26332D] transition focus:border-[#2F5D50] focus:outline-none focus:ring-2 focus:ring-[#E8F0EA]" placeholder="Enter your password" required minLength={6} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#526159]">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-xl border border-[#D8E3DA] bg-[#F7F9F6] px-4 py-3 text-sm text-[#26332D] transition focus:border-[#2F5D50] focus:outline-none focus:ring-2 focus:ring-[#E8F0EA]" placeholder="Confirm your password" required minLength={6} />
            </div>

            {error && <div className="rounded-xl border border-[#E0C9C3] bg-[#F1E5E2] p-3 text-center text-sm font-semibold text-[#76534B]">{error}</div>}
            {message && <div className="rounded-xl border border-[#D2E0D5] bg-[#E8F0EA] p-3 text-center text-sm font-semibold text-[#2F5D50]">{message}</div>}

            <button type="submit" disabled={loading} className="mt-2 w-full rounded-xl bg-[#2F5D50] px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#2F5D50]/20 transition hover:bg-[#1F4035] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/60 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-7 border-t border-[#E1E7E2] pt-5 text-center text-sm text-[#6B756F]">Already have an account? <Link to="/login" className="font-extrabold text-[#2F5D50] hover:underline">Sign In</Link></p>
        </div>
      </main>

      <footer className="relative z-10 w-full border-t border-white/15 bg-[#10251f]/30 px-6 py-4 text-center text-xs text-white/65 backdrop-blur-md">© 2026 Garden of Peace Memorial Park. All rights reserved.</footer>
    </div>
  );
};

export default SignUp;
