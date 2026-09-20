import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

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

    setMessage('Your password has been updated. You can now sign in.');
    setPassword('');
    setConfirmPassword('');
    setTimeout(() => navigate('/'), 1200);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F4EC] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[#D8E3DA] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1F4035]">Set a new password</h1>
        <p className="mt-2 text-sm text-[#526159]">Enter a new password for your Garden of Peace account.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
            className="w-full rounded-xl bg-[#2F5D50] px-4 py-3 font-bold text-white transition hover:bg-[#1F4035] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Updating password...' : 'Update password'}
          </button>
        </form>

        <Link to="/login" className="mt-6 block text-center text-sm font-semibold text-[#2F5D50] hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
