import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Map as MapIcon, Grid, List, Leaf, Droplets, Sun, Mountain, Edit2, Trash2, X, ChevronDown, BookmarkCheck } from 'lucide-react';

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

const AVAILABLE_FEATURES = ['Tree Shaded', 'Waterfront', 'Morning Sun', 'Hilltop View', 'Roadside Access', 'Private Pathway'];

const PlotManagement = () => {
  const [plots, setPlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const { isAdmin } = useAuth();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<any>(null);

  // Customer Reservation Modal State
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [reservingPlot, setReservingPlot] = useState<any>(null);
  const [reserveContact, setReserveContact] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  const handleOpenReserveModal = (plot: any) => {
    setReservingPlot(plot);
    setReserveContact({ name: '', phone: '', email: '', notes: '' });
    setIsReserveModalOpen(true);
  };

  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservingPlot) return;

    const { error } = await supabase
      .from('plots')
      .update({ status: 'reserved' })
      .eq('id', reservingPlot.id);

    if (error) {
      alert('Error processing reservation: ' + error.message);
    } else {
      alert(`Success! Sanctuary plot ${reservingPlot.plot_number} has been reserved. Our team will get in touch with you shortly.`);
      setIsReserveModalOpen(false);
      fetchPlots();
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    plot_number: '',
    section: '',
    status: 'available',
    type: 'Bone Chamber Unit (Basic)',
    price: '28000',
    size: '',
    features: [] as string[]
  });

  const fetchPlots = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('plots')
      .select('*, burial_records(id, full_name)')
      .order('plot_number');

    if (error) console.error('Error fetching plots:', error);
    else setPlots(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlots();
  }, []);

  const handleOpenModal = (plot: any = null) => {
    if (plot) {
      setEditingPlot(plot);
      setFormData({
        plot_number: plot.plot_number,
        section: plot.section || '',
        status: plot.status || 'available',
        type: plot.type || 'Bone Chamber Unit (Basic)',
        price: plot.price?.toString() || '',
        size: plot.size || '',
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
        size: '',
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
    const payload = {
      ...formData,
      price: formData.price ? parseFloat(formData.price) : null
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
      case 'available': return 'bg-white text-blue-600 border-blue-200 shadow-sm';
      case 'occupied': return 'bg-blue-600 text-white border-blue-600 shadow-sm';
      case 'reserved': return 'bg-blue-50 text-blue-800 border-blue-300 shadow-sm';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const filteredPlots = plots.filter(p =>
    p.plot_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.section || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                        <span className="text-blue-600 font-semibold">{plot.burial_records[0].full_name}</span>
                      </div>
                    )}
                    {plot.price && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 font-medium">Value</span>
                        <span className="text-emerald-600 font-bold">₱{plot.price.toLocaleString()}</span>
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
                  <input
                    type="text"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium"
                    placeholder="e.g. BLK-1 L-10"
                    value={formData.plot_number}
                    onChange={(e) => setFormData({ ...formData, plot_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Section / Garden</label>
                  <input
                    type="text"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium"
                    placeholder="e.g. Garden of Peace"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
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
                          price: PLOT_PRICES[newType] ? PLOT_PRICES[newType].toString() : formData.price 
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Dimensions / Size</label>
                  <input
                    type="text"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium"
                    placeholder="e.g. 1.0m x 2.5m"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
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
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl shadow-black/20 transform animate-in slide-in-from-bottom-4 duration-300">
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

            <form onSubmit={handleConfirmReservation} className="p-8 space-y-4">
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
    </div>
  );
};

export default PlotManagement;
