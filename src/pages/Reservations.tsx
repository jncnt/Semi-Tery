import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Check, XCircle, Clock, Search, ChevronDown, X,
    AlertTriangle, Eye, Plus
} from 'lucide-react';
import { format, addDays, isPast } from 'date-fns';



const Reservations = () => {
    const [reservations, setReservations] = useState<any[]>([]);
    const [availablePlots, setAvailablePlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const { session, isAdmin, userProfile } = useAuth();

    // Modals
    const [isReserveOpen, setIsReserveOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [detailReservation, setDetailReservation] = useState<any>(null);

    // Reserve Form
    const [reserveForm, setReserveForm] = useState({
        plot_id: '',
        reservee_name: '',
        reservee_contact: '',
        reservee_email: '',
        notes: '',
    });

    const fetchReservations = async () => {
        setLoading(true);
        let query = supabase
            .from('reservations')
            .select('*, plots(plot_number, block, section, type, price)')
            .order('created_at', { ascending: false });

        // Visitors only see their own reservations
        if (!isAdmin && session?.user) {
            query = query.eq('user_id', session.user.id);
        }

        const { data, error } = await query;
        if (error) console.error('Error fetching reservations:', error);
        else setReservations(data || []);
        setLoading(false);
    };

    const fetchAvailablePlots = async () => {
        const { data } = await supabase
            .from('plots')
            .select('id, plot_number, block, section, type, price')
            .eq('status', 'available')
            .eq('is_archived', false)
            .order('plot_number');
        setAvailablePlots(data || []);
    };

    useEffect(() => {
        fetchReservations();
        fetchAvailablePlots();
    }, []);

    // Auto-expire check on load
    useEffect(() => {
        if (!isAdmin) return;
        const expireOld = async () => {
            const { data: pending } = await supabase
                .from('reservations')
                .select('id, expires_at')
                .eq('status', 'pending');

            if (pending) {
                for (const r of pending) {
                    if (r.expires_at && isPast(new Date(r.expires_at))) {
                        await supabase.from('reservations').update({ status: 'expired' }).eq('id', r.id);
                    }
                }
                fetchReservations();
            }
        };
        expireOld();
    }, [isAdmin]);

    const handleReserve = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user) return;

        const { error } = await supabase.from('reservations').insert([{
            plot_id: reserveForm.plot_id,
            user_id: session.user.id,
            reservee_name: reserveForm.reservee_name,
            reservee_contact: reserveForm.reservee_contact,
            reservee_email: reserveForm.reservee_email || session.user.email,
            notes: reserveForm.notes,
            status: 'pending',
            expires_at: addDays(new Date(), 7).toISOString(),
        }]);

        if (error) { alert(error.message); return; }

        // Mark plot as reserved
        await supabase.from('plots').update({ status: 'reserved' }).eq('id', reserveForm.plot_id);

        setIsReserveOpen(false);
        fetchReservations();
        fetchAvailablePlots();
    };

    const handleApprove = async (reservation: any) => {
        if (!confirm('Approve this reservation?')) return;
        const { error } = await supabase.from('reservations')
            .update({ status: 'approved', approved_at: new Date().toISOString() })
            .eq('id', reservation.id);
        if (error) alert(error.message);
        else fetchReservations();
    };

    const handleCancel = async (reservation: any) => {
        if (!confirm('Cancel this reservation? The plot will become available again.')) return;
        const { error } = await supabase.from('reservations')
            .update({ status: 'cancelled' })
            .eq('id', reservation.id);
        if (error) { alert(error.message); return; }

        // Release the plot
        await supabase.from('plots').update({ status: 'available' }).eq('id', reservation.plot_id);
        fetchReservations();
        fetchAvailablePlots();
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'pending': return { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, label: 'Pending' };
            case 'approved': return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Check, label: 'Approved' };
            case 'expired': return { color: 'bg-gray-100 text-gray-500 border-gray-200', icon: AlertTriangle, label: 'Expired' };
            case 'cancelled': return { color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle, label: 'Cancelled' };
            default: return { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: Clock, label: status };
        }
    };

    const filteredReservations = reservations.filter(r => {
        const matchSearch =
            (r.reservee_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.plots?.plot_number || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'all' || r.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const openReserveModal = () => {
        setReserveForm({
            plot_id: availablePlots[0]?.id || '',
            reservee_name: userProfile?.full_name || '',
            reservee_contact: '',
            reservee_email: session?.user?.email || '',
            notes: '',
        });
        setIsReserveOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700 font-sans pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Reservations</h1>
                    <p className="text-gray-500 mt-1 text-lg">
                        {isAdmin ? 'Manage all plot reservations and approvals.' : 'View and manage your plot reservations.'}
                    </p>
                </div>
                <button onClick={openReserveModal} className="btn-primary flex items-center gap-2 whitespace-nowrap">
                    <Plus size={20} className="stroke-[2.5]" />
                    <span className="font-semibold">Reserve a Plot</span>
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or plot number..."
                        className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 shadow-sm text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <select
                        className="appearance-none bg-white border border-gray-200 rounded-xl py-3 pl-4 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="expired">Expired</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Stats Cards (admin) */}
            {isAdmin && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Pending', count: reservations.filter(r => r.status === 'pending').length, color: 'text-amber-600 bg-amber-50' },
                        { label: 'Approved', count: reservations.filter(r => r.status === 'approved').length, color: 'text-emerald-600 bg-emerald-50' },
                        { label: 'Expired', count: reservations.filter(r => r.status === 'expired').length, color: 'text-gray-500 bg-gray-100' },
                        { label: 'Cancelled', count: reservations.filter(r => r.status === 'cancelled').length, color: 'text-red-600 bg-red-50' },
                    ].map(stat => (
                        <div key={stat.label} className="card flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition-transform"
                            onClick={() => setFilterStatus(stat.label.toLowerCase())}>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${stat.color}`}>
                                {stat.count}
                            </div>
                            <span className="text-sm font-semibold text-gray-600">{stat.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Reservations Table */}
            <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plot</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reservee</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expires</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 animate-pulse">Loading reservations...</td></tr>
                            ) : filteredReservations.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">No reservations found.</td></tr>
                            ) : (
                                filteredReservations.map((r) => {
                                    const statusConf = getStatusConfig(r.status);
                                    const isExpiringSoon = r.status === 'pending' && r.expires_at &&
                                        new Date(r.expires_at).getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000;

                                    return (
                                        <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{r.plots?.plot_number || 'N/A'}</div>
                                                <div className="text-xs text-gray-400">{r.plots?.type} · {r.plots?.section}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-800">{r.reservee_name}</div>
                                                <div className="text-xs text-gray-400">{r.reservee_contact}</div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusConf.color}`}>
                                                    <statusConf.icon size={12} />
                                                    {statusConf.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {r.expires_at ? (
                                                    <div className={`text-sm ${isExpiringSoon ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                                        {format(new Date(r.expires_at), 'MMM d, yyyy')}
                                                        {isExpiringSoon && (
                                                            <div className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5">
                                                                <AlertTriangle size={10} /> Expiring soon
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    <button onClick={() => { setDetailReservation(r); setIsDetailOpen(true); }}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                                                        <Eye size={16} />
                                                    </button>
                                                    {isAdmin && r.status === 'pending' && (
                                                        <>
                                                            <button onClick={() => handleApprove(r)}
                                                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Approve">
                                                                <Check size={16} />
                                                            </button>
                                                            <button onClick={() => handleCancel(r)}
                                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancel">
                                                                <XCircle size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {!isAdmin && r.status === 'pending' && (
                                                        <button onClick={() => handleCancel(r)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancel">
                                                            <XCircle size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ========== RESERVE MODAL ========== */}
            {isReserveOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Reserve a Plot</h3>
                                <p className="text-sm text-gray-500 mt-0.5">Select an available plot and fill in your details.</p>
                            </div>
                            <button onClick={() => setIsReserveOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleReserve} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            {/* Plot Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Plot *</label>
                                {availablePlots.length === 0 ? (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                                        No available plots at the moment.
                                    </div>
                                ) : (
                                    <select
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        value={reserveForm.plot_id}
                                        onChange={(e) => setReserveForm({ ...reserveForm, plot_id: e.target.value })}
                                    >
                                        {availablePlots.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.plot_number} — {p.type} ({p.block || 'N/A'}, {p.section || 'N/A'}) — ₱{Number(p.price || 0).toLocaleString()}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Reservee Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                                    <input type="text" required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        value={reserveForm.reservee_name} onChange={(e) => setReserveForm({ ...reserveForm, reservee_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact Number *</label>
                                    <input type="text" required placeholder="0917-XXX-XXXX"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        value={reserveForm.reservee_contact} onChange={(e) => setReserveForm({ ...reserveForm, reservee_contact: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                                <input type="email"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    value={reserveForm.reservee_email} onChange={(e) => setReserveForm({ ...reserveForm, reservee_email: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
                                <textarea
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[60px]"
                                    placeholder="Any special requests..."
                                    value={reserveForm.notes} onChange={(e) => setReserveForm({ ...reserveForm, notes: e.target.value })} />
                            </div>

                            <p className="text-xs text-gray-400">Reservation expires in 7 days if not approved.</p>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsReserveOpen(false)}
                                    className="px-5 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl">Cancel</button>
                                <button type="submit" className="btn-primary" disabled={availablePlots.length === 0}>
                                    Confirm Reservation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========== DETAIL MODAL ========== */}
            {isDetailOpen && detailReservation && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Reservation Details</h3>
                            <button onClick={() => setIsDetailOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <span className="text-gray-400 text-xs uppercase font-semibold">Plot</span>
                                    <p className="font-bold text-gray-900 mt-0.5">{detailReservation.plots?.plot_number}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <span className="text-gray-400 text-xs uppercase font-semibold">Type</span>
                                    <p className="font-bold text-gray-900 mt-0.5">{detailReservation.plots?.type}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <span className="text-gray-400 text-xs uppercase font-semibold">Reservee</span>
                                    <p className="font-bold text-gray-900 mt-0.5">{detailReservation.reservee_name}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <span className="text-gray-400 text-xs uppercase font-semibold">Contact</span>
                                    <p className="font-bold text-gray-900 mt-0.5">{detailReservation.reservee_contact || '-'}</p>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-3">
                                    <span className="text-gray-400 text-xs uppercase font-semibold">Expires</span>
                                    <p className="font-bold text-gray-900 mt-0.5">
                                        {detailReservation.expires_at ? format(new Date(detailReservation.expires_at), 'MMM d, yyyy') : '-'}
                                    </p>
                                </div>
                            </div>
                            {detailReservation.notes && (
                                <div className="bg-gray-50 rounded-xl p-3 text-sm">
                                    <span className="text-gray-400 text-xs uppercase font-semibold">Notes</span>
                                    <p className="text-gray-700 mt-1">{detailReservation.notes}</p>
                                </div>
                            )}
                            <div className="text-xs text-gray-400 text-center pt-2">
                                Created: {format(new Date(detailReservation.created_at), 'MMM d, yyyy h:mm a')}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reservations;
