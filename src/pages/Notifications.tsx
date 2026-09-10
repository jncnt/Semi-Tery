import { useEffect, useState } from 'react';
import { Bell, Mail, Phone, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Inquiry {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  message: string | null;
  plot_number: string;
  status: string;
  created_at: string;
}

const Notifications = () => {
  const { isAdmin } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInquiries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) alert('Unable to load notifications: ' + error.message);
    else setInquiries(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchInquiries();
    else setLoading(false);
  }, [isAdmin]);

  const deleteInquiry = async (id: string) => {
    if (!window.confirm('Delete this notification?')) return;

    const { error } = await supabase.from('inquiries').delete().eq('id', id);
    if (error) {
      alert('Unable to delete notification: ' + error.message);
      return;
    }
    setInquiries((current) => current.filter((inquiry) => inquiry.id !== id));
  };

  if (!isAdmin) {
    return <div className="p-8 text-center text-slate-500">You do not have permission to view notifications.</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-slate-500 mt-1 text-sm">Customer inquiries and reservation requests.</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Bell size={22} /></div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading notifications...</div>
      ) : inquiries.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-slate-400">
          <Bell size={36} className="mx-auto mb-3 opacity-40" />
          No customer inquiries yet.
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <article key={inquiry.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-extrabold text-slate-900">{inquiry.customer_name}</h2>
                    <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">Plot {inquiry.plot_number}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{format(new Date(inquiry.created_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
                <button onClick={() => deleteInquiry(inquiry.id)} title="Delete notification" aria-label="Delete notification" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-2"><Phone size={15} />{inquiry.phone}</span>
                {inquiry.email && <span className="flex items-center gap-2"><Mail size={15} />{inquiry.email}</span>}
              </div>
              {inquiry.message && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{inquiry.message}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;