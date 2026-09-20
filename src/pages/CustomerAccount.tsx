import { useState } from 'react';
import { KeyRound, Mail, UserCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const CustomerAccount = () => {
  const { session, userProfile } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setPassword('');
    setConfirmPassword('');
    setMessage('Your password has been updated successfully.');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A6A2F]">Garden of Peace</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1F4035]">My Account</h1>
        <p className="mt-1 text-sm text-[#6B756F]">Your account details and access information.</p>
      </div>

      <section className="card space-y-5">
        <div className="flex items-center gap-4 border-b border-[#E1E7E2] pb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F0EA] text-[#2F5D50]"><UserCircle size={26} /></div>
          <div><h2 className="font-extrabold text-[#26332D]">{userProfile?.full_name || 'Garden of Peace User'}</h2><p className="text-sm text-[#6B756F]">Customer account</p></div>
        </div>
        <div className="flex items-center gap-3 text-sm text-[#526159]"><Mail size={17} className="text-[#2F5D50]" /><span>{session?.user?.email}</span></div>
      </section>

      <section className="card">
        <div className="flex items-center gap-3 border-b border-[#E1E7E2] pb-4">
          <KeyRound size={20} className="text-[#2F5D50]" />
          <div>
            <h2 className="font-extrabold text-[#26332D]">Change password</h2>
            <p className="text-sm text-[#6B756F]">Update the password you use to sign in.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#3D4A45]">New password</label>
            <input
              type="password"
              minLength={6}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-[#D8E3DA] bg-[#F7F9F6] px-4 py-3 text-sm outline-none focus:border-[#2F5D50] focus:ring-2 focus:ring-[#E8F0EA]"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#3D4A45]">Confirm new password</label>
            <input
              type="password"
              minLength={6}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-[#D8E3DA] bg-[#F7F9F6] px-4 py-3 text-sm outline-none focus:border-[#2F5D50] focus:ring-2 focus:ring-[#E8F0EA]"
            />
          </div>
          {error && <p className="rounded-xl border border-[#E7C9C1] bg-[#F3E1DC] px-4 py-3 text-sm text-[#8B3F32]">{error}</p>}
          {message && <p className="rounded-xl border border-[#C9DED2] bg-[#E8F0EA] px-4 py-3 text-sm text-[#1F4035]">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#2F5D50] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1F4035] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Updating password...' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default CustomerAccount;