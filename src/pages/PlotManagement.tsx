import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getDisplayName } from '../lib/nameUtils';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Map as MapIcon, Grid, List, Leaf, Droplets, Sun, Mountain, Edit2, Trash2, X, ChevronDown, BookmarkCheck, Bell, Check, XCircle } from 'lucide-react';

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  'Tree Shaded': <Leaf size={14} />,
  'Waterfront': <Droplets size={14} />,
  'Morning Sun': <Sun size={14} />,
  'Hilltop View': <Mountain size={14} />,
};

const PLOT_TYPES = [
  'Bone Chamber Unit (Basic)',
  'Bone Chamber Unit (Standard/Mid-range)',
  'Bone Chamber Unit (Premium/Sealed)'
];

const PLOT_PRICES: Record<string, number> = {
  'Bone Chamber Unit (Basic)': 28000,
  'Bone Chamber Unit (Standard/Mid-range)': 45000,
  'Bone Chamber Unit (Premium/Sealed)': 65000,
};

const PLOT_DIMENSIONS: Record<string, string> = {
  'Bone Chamber Unit (Basic)': '0.4m x 0.4m x 0.45m',
  'Bone Chamber Unit (Standard/Mid-range)': '0.4m x 0.4m x 0.85m to 0.5m x 0.5m x 0.9m',
  'Bone Chamber Unit (Premium/Sealed)': 'Multi-layered vault or larger family compartment',
};

const AVAILABLE_FEATURES = ['Tree Shaded', 'Waterfront', 'Morning Sun', 'Hilltop View', 'Roadside Access', 'Private Pathway'];
const PLOT_BLOCKS = [
  { number: 1, section: 'St. Therese' },
  { number: 2, section: 'St. Monica' },
  { number: 3, section: 'St. Anne' },
];
const LEVELS_PER_BLOCK = 5;
const gcashQrUrl = import.meta.env.VITE_GCASH_QR_URL || '';

const PlotManagement = () => {
  const [plots, setPlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const { isAdmin, session } = useAuth();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<any>(null);

  // Customer Reservation Modal State
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [isQrZoomOpen, setIsQrZoomOpen] = useState(false);
  const [reservingPlot, setReservingPlot] = useState<any>(null);
  const [reserveContact, setReserveContact] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    payment_method: 'Cash',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [reservationRequests, setReservationRequests] = useState<any[]>([]);

  const handleOpenReserveModal = (plot: any) => {
    setReservingPlot(plot);
    setIsQrZoomOpen(false);
    setReceiptFile(null);
    setReserveContact({ name: '', phone: '', email: '', notes: '', payment_method: 'Cash' });
    setIsReserveModalOpen(true);
  };

  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservingPlot) return;

    const { data: currentPlot, error: availabilityError } = await supabase
      .from('plots')
      .select('status')
      .eq('id', reservingPlot.id)
      .maybeSingle();

    if (availabilityError || !currentPlot || currentPlot.status !== 'available') {
      alert('This plot is already reserved or occupied and cannot be requested.');
      fetchPlots();
      return;
    }

    const { data: existingRequests } = await supabase
      .from('reservation_requests')
      .select('id')
      .eq('plot_id', reservingPlot.id)
      .eq('user_id', session?.user?.id)
      .eq('status', 'pending')
      .limit(1);

    if (existingRequests && existingRequests.length > 0) {
      alert('You already have a pending reservation request for this plot.');
      return;
    }

    if (reserveContact.payment_method === 'GCash' && !receiptFile) {
      alert('Please upload your GCash payment receipt before submitting.');
      return;
    }

    let receiptUrl: string | null = null;
    if (receiptFile && session?.user?.id) {
      const filePath = `${session.user.id}/${Date.now()}-${receiptFile.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, receiptFile, { contentType: receiptFile.type, upsert: false });

      if (uploadError) {
        alert('Error uploading receipt: ' + uploadError.message);
        return;
      }

      const { data: receiptLink } = supabase.storage.from('payment-receipts').getPublicUrl(filePath);
      receiptUrl = receiptLink.publicUrl;
    }

    const { error } = await supabase.from('reservation_requests').insert([{
      plot_id: reservingPlot.id,
      user_id: session?.user?.id,
      requester_name: reserveContact.name,
      requester_phone: reserveContact.phone,
      requester_email: reserveContact.email || null,
      notes: reserveContact.notes || null,
      payment_method: reserveContact.payment_method,
      payment_status: 'pending',
      plot_price: reservingPlot.price || 0,
      reservation_fee: reservingPlot.reservation_fee || 0,
      total_amount: (reservingPlot.price || 0) + (reservingPlot.reservation_fee || 0),
      receipt_url: receiptUrl,
      status: 'pending',
    }]);

    if (error) {
      alert('Error submitting reservation request: ' + error.message);
    } else {
      alert(`Your reservation request for plot ${reservingPlot.plot_number} was submitted. You will be notified when it is approved or rejected.`);
      setIsReserveModalOpen(false);
      fetchReservationRequests();
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    plot_number: '',
    section: '',
    status: 'available',
    type: 'Bone Chamber Unit (Basic)',
    price: '28000',
    reservation_fee: '0',
    size: '',
    features: [] as string[]
  });

  const fetchPlots = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('plots')
      .select('*, burial_records(id, first_name, middle_name, last_name)')
      .order('plot_number');

    if (error) console.error('Error fetching plots:', error);
    else setPlots(data || []);
    setLoading(false);
  };

  const fetchReservationRequests = async () => {
    let query = supabase
      .from('reservation_requests')
      .select('*, plots(plot_number, section, status)')
      .order('created_at', { ascending: false });

    if (!isAdmin && session?.user?.id) query = query.eq('user_id', session.user.id);

    const { data, error } = await query;
    if (error) console.error('Error fetching reservation requests:', error);
    else setReservationRequests(data || []);
  };

  useEffect(() => {
    fetchPlots();
    fetchReservationRequests();
  }, [isAdmin, session?.user?.id]);

  const updateReservationRequest = async (request: any, status: 'approved' | 'rejected') => {
    if (status === 'approved') {
      if (request.payment_method === 'GCash' && request.payment_status !== 'paid') {
        alert('This reservation cannot be approved until the GCash payment is marked as paid.');
        return;
      }

      const { data: updatedPlot, error: plotError } = await supabase
        .from('plots')
        .update({ status: 'reserved' })
        .eq('id', request.plot_id)
        .eq('status', 'available')
        .select('id')
        .maybeSingle();

      if (plotError || !updatedPlot) {
        await supabase.from('reservation_requests').update({
          status: 'rejected',
          decision_note: 'This plot is no longer available because it was reserved or occupied.',
        }).eq('id', request.id);
        alert('This request was rejected because the plot is already reserved or occupied.');
        fetchPlots();
        fetchReservationRequests();
        return;
      }
    }

    const { error } = await supabase
      .from('reservation_requests')
      .update({ status, decision_note: status === 'approved' ? 'Reservation approved.' : 'Reservation request rejected.' })
      .eq('id', request.id);

    if (error) alert('Error updating reservation request: ' + error.message);
    else {
      if (status === 'approved') {
        await supabase
          .from('reservation_requests')
          .update({
            status: 'rejected',
            decision_note: 'This plot was awarded to another reservation request.',
          })
          .eq('plot_id', request.plot_id)
          .eq('status', 'pending')
          .neq('id', request.id);
      }
      alert(status === 'approved' ? 'Reservation approved.' : 'Reservation rejected.');
      fetchPlots();
      fetchReservationRequests();
    }
  };

  const markReservationPaid = async (request: any) => {
    const { error } = await supabase
      .from('reservation_requests')
      .update({ payment_status: 'paid' })
      .eq('id', request.id)
      .eq('payment_status', 'pending');

    if (error) alert('Error updating payment: ' + error.message);
    else fetchReservationRequests();
  };

  const moveReservationToTrash = async (request: any) => {
    if (!confirm('Move this pending reservation request to trash?')) return;

    const { error } = await supabase
      .from('reservation_requests')
      .delete()
      .eq('id', request.id)
      .eq('user_id', session?.user?.id)
      .eq('status', 'pending');

    if (error) alert('Error moving request to trash: ' + error.message);
    else fetchReservationRequests();
  };

  const handleOpenModal = (plot: any = null) => {
    if (plot) {
      setEditingPlot(plot);
      setFormData({
        plot_number: plot.plot_number,
        section: getSectionForPlot(plot.plot_number) || plot.section || '',
        status: plot.status || 'available',
        type: plot.type || 'Bone Chamber Unit (Basic)',
        price: plot.price?.toString() || '',
        reservation_fee: plot.reservation_fee?.toString() || '0',
        size: plot.size || PLOT_DIMENSIONS[plot.type] || '',
        features: plot.features || [],
      });
    } else {
      setEditingPlot(null);
      setFormData({
        plot_number: '',
        section: '',
        status: 'available',
        type: 'Bone Chamber Unit (Basic)',
        price: '28000',
        reservation_fee: '100',
        size: PLOT_DIMENSIONS['Bone Chamber Unit (Basic)'],
        features: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.status === 'reserved' && editingPlot?.status !== 'reserved') {
      const { data: pendingPayment } = await supabase
        .from('reservation_requests')
        .select('id, payment_method, payment_status')
        .eq('plot_id', editingPlot?.id)
        .eq('status', 'pending')
        .eq('payment_method', 'GCash')
        .eq('payment_status', 'pending')
        .maybeSingle();

      if (pendingPayment) {
        alert('This plot cannot be changed to reserved until the pending GCash payment is marked as paid.');
        return;
      }
    }

    const payload = {
      ...formData,
      price: formData.price ? parseFloat(formData.price) : null,
      reservation_fee: formData.reservation_fee ? parseFloat(formData.reservation_fee) : 0,
    };

    if (editingPlot) {
      const { error } = await supabase.from('plots').update(payload).eq('id', editingPlot.id);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.from('plots').insert([payload]);
      if (error) alert(error.message);
    }

    setIsModalOpen(false);
    fetchPlots();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this plot?')) {
      const { error } = await supabase.from('plots').delete().eq('id', id);
      if (error) alert(error.message);
      else fetchPlots();
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm';
      case 'occupied': return 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm';
      case 'reserved': return 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const filteredPlots = plots.filter(p =>
    p.plot_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.section || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const plotNumberOptions = PLOT_BLOCKS.flatMap(block =>
    Array.from({ length: LEVELS_PER_BLOCK }, (_, levelIndex) => `BLK-${block.number} L${levelIndex + 1}`)
  );

  const getSectionForPlot = (plotNumber: string) => {
    const blockNumber = Number(plotNumber.match(/^BLK-(\d+)/)?.[1]);
    return PLOT_BLOCKS.find(block => block.number === blockNumber)?.section || '';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Prime Plots</h1>
          <p className="text-gray-500 mt-2 text-lg">Curate and manage idyllic resting sanctuaries.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200/60">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List size={18} />
            </button>
          </div>
          {isAdmin && (
            <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2 whitespace-nowrap shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all">
              <Plus size={20} className="stroke-[2.5]" />
              <span className="font-semibold">Curate New Plot</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by plot number or section..."
          className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 transition-all focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-300 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {reservationRequests.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Bell size={18} className="text-amber-600" />
            <h2 className="font-bold text-gray-900">{isAdmin ? 'Reservation Requests' : 'My Reservation Requests'}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {reservationRequests.map((request) => (
              <div key={request.id} className="px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">
                    Plot {request.plots?.plot_number || 'Unknown'}
                    {isAdmin && <span className="font-normal text-gray-500"> requested by {request.requester_name}</span>}
                  </p>
                  <p className="text-sm text-gray-500">{request.plots?.section || 'Main Section'}{request.requester_phone ? ` | ${request.requester_phone}` : ''}</p>
                  <p className="text-sm text-gray-500 mt-1">Payment: <span className="font-semibold text-gray-700">{request.payment_method || 'Not selected'}</span> ({request.payment_status || 'pending'})</p>
                  {request.receipt_url && <a href={request.receipt_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">View payment receipt</a>}
                  {request.decision_note && <p className="text-sm text-gray-600 mt-1">{request.decision_note}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    request.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                    request.status === 'rejected' ? 'bg-rose-50 text-rose-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {request.status}
                  </span>
                  {isAdmin && request.status === 'pending' && (
                    <>
                      {request.payment_method === 'GCash' && request.payment_status !== 'paid' && (
                        <button onClick={() => markReservationPaid(request)} className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg" title="Mark GCash payment as paid">
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => updateReservationRequest(request, 'approved')}
                        disabled={request.payment_method === 'GCash' && request.payment_status !== 'paid'}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                        title="Approve reservation"
                      >
                        <Check size={18} />
                      </button>
                      <button onClick={() => updateReservationRequest(request, 'rejected')} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg" title="Reject reservation">
                        <XCircle size={18} />
                      </button>
                    </>
                  )}
                  {!isAdmin && request.status === 'pending' && (
                    <button
                      onClick={() => moveReservationToTrash(request)}
                      className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Move request to trash"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <div className="py-20 text-center text-gray-400 animate-pulse">Summoning sanctuaries...</div>
      ) : plots.length === 0 ? (
        <div className="bg-gradient-to-b from-white to-gray-50/50 border border-dashed border-gray-300 rounded-3xl p-16 text-center transform transition-all hover:scale-[1.01]">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapIcon className="text-primary/60" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No Sanctuaries Defined</h3>
          <p className="text-gray-500 max-w-md mx-auto text-lg mb-8">Begin curating peaceful resting places by adding your first plot, complete with unique idealistic features.</p>
          <button onClick={() => handleOpenModal()} className="text-primary font-bold hover:text-blue-700 text-lg underline underline-offset-4 decoration-2">Curate First Plot</button>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
          {filteredPlots.map((plot) => (
            <div
              key={plot.id}
              className={`group bg-white border border-gray-200/80 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 hover:border-blue-200 ${viewMode === 'grid' ? 'flex flex-col' : 'flex items-center justify-between p-4 px-6'
                }`}
            >
              <div className={viewMode === 'grid' ? "p-6 flex-1" : "flex items-center gap-8 flex-1"}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{plot.plot_number}</h3>
                    <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mt-1">{plot.section || 'Unassigned Section'}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusStyle(plot.status)}`}>
                    {plot.status}
                  </div>
                </div>

                {viewMode === 'grid' && (
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium">Type</span>
                      <span className="text-gray-900 font-semibold">{plot.type || 'Bone Chamber Unit'}</span>
                    </div>
                    {plot.size && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 font-medium">Dimensions</span>
                        <span className="text-gray-900 font-semibold">{plot.size}</span>
                      </div>
                    )}
                    {plot.burial_records && plot.burial_records.length > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 font-medium">Occupant</span>
                        <span className="text-blue-600 font-semibold">{getDisplayName(plot.burial_records[0])}</span>
                      </div>
                    )}
                    {plot.price && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 font-medium">Value</span>
                        <span className="text-emerald-600 font-bold">₱{plot.price.toLocaleString()}</span>
                      </div>
                    )}
                    {plot.reservation_fee > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 font-medium">Reservation Fee</span>
                        <span className="text-amber-600 font-bold">₱{plot.reservation_fee.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {plot.features && plot.features.length > 0 && viewMode === 'grid' && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                    {plot.features.map((f: string) => (
                      <span key={f} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 text-gray-600 text-xs py-1 px-2.5 rounded-md font-medium">
                        {FEATURE_ICONS[f] || <span className="w-1 h-1 rounded-full bg-gray-400" />} {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {isAdmin ? (
                <div className={`bg-gray-50/50 border-t border-gray-100 p-3 flex justify-end gap-2 ${viewMode === 'grid' ? '' : 'border-t-0 bg-transparent flex-none'}`}>
                  <button
                    onClick={() => handleOpenModal(plot)}
                    className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    title="Edit Plot"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(plot.id)}
                    className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete Plot"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ) : (
                <div className={`bg-gray-50/50 border-t border-gray-100 p-3 flex justify-end ${viewMode === 'grid' ? '' : 'border-t-0 bg-transparent flex-none'}`}>
                  {plot.status === 'available' ? (
                    <button
                      onClick={() => handleOpenReserveModal(plot)}
                      className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <BookmarkCheck size={16} />
                      Reserve Plot
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-gray-400 capitalize px-2 py-1">
                      {plot.status}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/20 transform animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {editingPlot ? 'Refine Plot Details' : 'Curate New Plot'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Specify layout, pricing, and idealistic features.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Plot Number *</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        required
                        className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium"
                        value={formData.plot_number}
                        onChange={(e) => setFormData({
                          ...formData,
                          plot_number: e.target.value,
                          section: getSectionForPlot(e.target.value),
                        })}
                      >
                        <option value="">Select plot number</option>
                        {plotNumberOptions.map(plotNumber => (
                          <option key={plotNumber} value={plotNumber}>{plotNumber}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">Each block includes L1 through L5.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Section / Garden</label>
                  <input
                    type="text"
                    readOnly
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl py-3 px-4 text-gray-600 font-medium cursor-not-allowed"
                    placeholder="Selected automatically"
                    value={formData.section}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Plot Type</label>
                  <div className="relative">
                    <select
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium appearance-none cursor-pointer"
                      value={formData.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setFormData({ 
                          ...formData, 
                          type: newType, 
                          price: PLOT_PRICES[newType] ? PLOT_PRICES[newType].toString() : formData.price,
                          size: PLOT_DIMENSIONS[newType] || formData.size,
                        });
                      }}
                    >
                      {PLOT_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <div className="relative">
                    <select
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium appearance-none cursor-pointer"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="reserved">Reserved</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Valuation (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium"
                    placeholder="e.g. 5000.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reservation Extra Charge (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium"
                    placeholder="e.g. 500"
                    value={formData.reservation_fee}
                    onChange={(e) => setFormData({ ...formData, reservation_fee: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Dimensions / Size</label>
                  <input
                    type="text"
                    readOnly
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl py-3 px-4 text-gray-600 font-medium cursor-not-allowed"
                    placeholder="Selected automatically"
                    value={formData.size}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Idealistic Features</label>
                <div className="flex flex-wrap gap-2.5">
                  {AVAILABLE_FEATURES.map(feature => {
                    const isSelected = formData.features.includes(feature);
                    return (
                      <button
                        key={feature}
                        type="button"
                        onClick={() => handleFeatureToggle(feature)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${isSelected
                            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {FEATURE_ICONS[feature] && (
                          <span className={isSelected ? 'text-blue-500' : 'text-gray-400'}>
                            {FEATURE_ICONS[feature]}
                          </span>
                        )}
                        {feature}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="pt-8 mt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all"
                >
                  {editingPlot ? 'Save Changes' : 'Curate Plot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isReserveModalOpen && reservingPlot && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl shadow-black/20 transform animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Reserve Sanctuary Plot
                </h3>
                <p className="text-sm text-gray-500 mt-1">Plot: <span className="font-semibold text-gray-900">{reservingPlot.plot_number}</span> ({reservingPlot.section || 'Main Section'})</p>
              </div>
              <button
                type="button"
                onClick={() => setIsReserveModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleConfirmReservation} className="p-8 space-y-4 overflow-y-auto min-h-0">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium"
                  placeholder="e.g. Juan Dela Cruz"
                  value={reserveContact.name}
                  onChange={(e) => setReserveContact({ ...reserveContact, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium"
                    placeholder="e.g. 09171234567"
                    value={reserveContact.phone}
                    onChange={(e) => setReserveContact({ ...reserveContact, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium"
                    placeholder="name@example.com"
                    value={reserveContact.email}
                    onChange={(e) => setReserveContact({ ...reserveContact, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Special Notes / Inquiries</label>
                <textarea
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium min-h-[80px]"
                  placeholder="Any preferences or questions..."
                  value={reserveContact.notes}
                  onChange={(e) => setReserveContact({ ...reserveContact, notes: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Method *</label>
                <div className="relative">
                  <select
                    required
                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium"
                    value={reserveContact.payment_method}
                    onChange={(e) => setReserveContact({ ...reserveContact, payment_method: e.target.value })}
                  >
                    <option value="Cash">Cash</option>
                    <option value="GCash">GCash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Payment remains pending until staff confirms the reservation.</p>
                {reserveContact.payment_method === 'GCash' && (
                  <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-center">
                    <p className="text-sm font-bold text-gray-800">Scan to pay with GCash</p>
                    {gcashQrUrl ? (
                      <button
                        type="button"
                        onClick={() => setIsQrZoomOpen(true)}
                        className="mx-auto mt-3 block cursor-zoom-in rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        title="Click to enlarge QR code"
                      >
                        <img
                          src={gcashQrUrl}
                          alt="GCash payment QR code. Click to enlarge."
                          className="h-48 w-48 rounded-xl border-4 border-white bg-white object-contain shadow-sm"
                        />
                      </button>
                    ) : (
                      <p className="mt-2 text-xs text-gray-500">GCash QR code is not configured yet.</p>
                    )}
                    <p className="mt-3 text-xs text-gray-500">Complete the payment, then submit your reservation request for staff confirmation.</p>
                  </div>
                )}
                {reserveContact.payment_method === 'GCash' && (
                  <div className="mt-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Upload GCash Receipt *</label>
                    <input
                      type="file"
                      required
                      accept="image/*,.pdf"
                      className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-gray-400 mt-1">Upload a screenshot or PDF after completing the payment.</p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Plot price</span>
                  <span>₱{(reservingPlot.price || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>Reservation extra charge</span>
                  <span>₱{(reservingPlot.reservation_fee || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 mt-3 pt-3">
                  <span>Total amount</span>
                  <span>₱{((reservingPlot.price || 0) + (reservingPlot.reservation_fee || 0)).toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReserveModalOpen(false)}
                  className="px-6 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isQrZoomOpen && gcashQrUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur-sm"
          onClick={() => setIsQrZoomOpen(false)}
        >
          <div className="relative max-w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsQrZoomOpen(false)}
              className="absolute -right-3 -top-3 rounded-full bg-white p-2 text-gray-600 shadow-lg hover:bg-gray-100"
              title="Close enlarged QR code"
            >
              <X size={20} />
            </button>
            <img
              src={gcashQrUrl}
              alt="Enlarged GCash payment QR code"
              className="max-h-[85vh] max-w-[min(90vw,32rem)] rounded-2xl bg-white p-3 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlotManagement;
