import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus, Search, Grid, List, Edit2, Archive, ArrowRightLeft, X,
  Map as MapIcon, Wrench, ChevronDown, Eye
} from 'lucide-react';

const PLOT_TYPES = ['Lawn Lot', 'Family Lot', 'Mausoleum', 'Bone Chamber', 'Columbarium', 'Cremation Niche'];
const STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'under_maintenance', label: 'Under Maintenance' },
];


const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium text-sm";

const PlotManagement = () => {
  const [plots, setPlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const { isAdmin } = useAuth();

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<any>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferPlot, setTransferPlot] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailPlot, setDetailPlot] = useState<any>(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    plot_number: '',
    block: '',
    section: '',
    row: '',
    type: 'Lawn Lot',
    status: 'available',
  });

  // Transfer Form
  const [transferData, setTransferData] = useState({
    to_owner: '',
    to_contact: '',
    notes: '',
  });

  // Maintenance Form
  const [maintenanceData, setMaintenanceData] = useState({
    description: '',
    performed_by: '',
    cost: '',
  });

  const fetchPlots = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('plots')
      .select('*')
      .order('plot_number');

    if (error) console.error('Error fetching plots:', error);
    else setPlots(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPlots(); }, []);

  const handleOpenModal = (plot: any = null) => {
    if (plot) {
      setEditingPlot(plot);
      setFormData({
        plot_number: plot.plot_number,
        block: plot.block || '',
        section: plot.section || '',
        row: plot.row || '',
        type: plot.type || 'Lawn Lot',
        status: plot.status || 'available',
      });
    } else {
      setEditingPlot(null);
      setFormData({
        plot_number: '',
        block: '',
        section: '',
        row: '',
        type: 'Lawn Lot',
        status: 'available',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };

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

  const handleArchive = async (plot: any) => {
    const action = plot.is_archived ? 'restore' : 'archive';
    if (confirm(`Are you sure you want to ${action} plot ${plot.plot_number}?`)) {
      const { error } = await supabase.from('plots').update({ is_archived: !plot.is_archived }).eq('id', plot.id);
      if (error) alert(error.message);
      else fetchPlots();
    }
  };

  const handleOpenTransfer = (plot: any) => {
    setTransferPlot(plot);
    setTransferData({ to_owner: '', to_contact: '', notes: '' });
    setIsTransferOpen(true);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferPlot) return;

    const { error: transferError } = await supabase.from('ownership_transfers').insert([{
      plot_id: transferPlot.id,
      from_owner: transferPlot.owner_name || 'N/A',
      to_owner: transferData.to_owner,
      to_contact: transferData.to_contact,
      notes: transferData.notes,
    }]);

    if (transferError) { alert(transferError.message); return; }

    const { error: updateError } = await supabase.from('plots').update({
      owner_name: transferData.to_owner,
      owner_contact: transferData.to_contact,
    }).eq('id', transferPlot.id);

    if (updateError) alert(updateError.message);

    setIsTransferOpen(false);
    fetchPlots();
  };

  const handleOpenDetail = async (plot: any) => {
    setDetailPlot(plot);
    setMaintenanceData({ description: '', performed_by: '', cost: '' });

    const { data } = await supabase
      .from('maintenance_history')
      .select('*')
      .eq('plot_id', plot.id)
      .order('performed_at', { ascending: false });

    setMaintenanceHistory(data || []);
    setIsDetailOpen(true);
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailPlot) return;

    const { error } = await supabase.from('maintenance_history').insert([{
      plot_id: detailPlot.id,
      description: maintenanceData.description,
      performed_by: maintenanceData.performed_by,
      cost: maintenanceData.cost ? parseFloat(maintenanceData.cost) : null,
    }]);

    if (error) { alert(error.message); return; }

    setMaintenanceData({ description: '', performed_by: '', cost: '' });
    // Refresh
    const { data } = await supabase
      .from('maintenance_history')
      .select('*')
      .eq('plot_id', detailPlot.id)
      .order('performed_at', { ascending: false });
    setMaintenanceHistory(data || []);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'occupied': return 'bg-blue-600 text-white border-blue-600';
      case 'reserved': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'under_maintenance': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    return STATUSES.find(s => s.value === status)?.label || status;
  };

  const filteredPlots = plots.filter(p => {
    const matchSearch =
      p.plot_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.section || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.block || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.owner_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchType = filterType === 'all' || p.type === filterType;
    const matchArchive = showArchived ? p.is_archived : !p.is_archived;
    return matchSearch && matchStatus && matchType && matchArchive;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700 font-sans pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Plot Management</h1>
          <p className="text-gray-500 mt-1 text-lg">Manage cemetery plots, ownership, and maintenance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-gray-100/80 rounded-xl border border-gray-200/60">
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
            <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2 whitespace-nowrap">
              <Plus size={20} className="stroke-[2.5]" />
              <span className="font-semibold">Create Plot</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by plot, block, section, or owner..."
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
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            className="appearance-none bg-white border border-gray-200 rounded-xl py-3 pl-4 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            {PLOT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all ${showArchived ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <Archive size={16} className="inline mr-2" />
            {showArchived ? 'Archived' : 'Active'}
          </button>
        )}
      </div>

      {/* Plot Grid / List */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 animate-pulse">Loading plots...</div>
      ) : filteredPlots.length === 0 ? (
        <div className="card p-16 text-center border-dashed">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapIcon className="text-primary/60" size={36} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{showArchived ? 'No Archived Plots' : 'No Plots Found'}</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {showArchived ? 'No archived plots yet.' : 'Start by creating your first plot.'}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" : "space-y-3"}>
          {filteredPlots.map((plot) => (
            <div
              key={plot.id}
              className={`group bg-white border border-gray-200/80 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-0.5 hover:border-blue-200 ${viewMode === 'grid' ? 'flex flex-col' : 'flex items-center justify-between p-4 px-6'
                } ${plot.is_archived ? 'opacity-60' : ''}`}
            >
              <div className={viewMode === 'grid' ? "p-5 flex-1" : "flex items-center gap-8 flex-1"}>
                {/* Header row */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">{plot.plot_number}</h3>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-0.5">
                      {[plot.block, plot.section, plot.row].filter(Boolean).join(' · ') || 'No Location'}
                    </p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(plot.status)}`}>
                    {getStatusLabel(plot.status)}
                  </div>
                </div>

                {viewMode === 'grid' && (
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type</span>
                      <span className="text-gray-900 font-semibold">{plot.type || '-'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className={`border-t border-gray-100 p-3 flex justify-end gap-1.5 ${viewMode === 'list' ? 'border-t-0 flex-none' : ''}`}>
                <button
                  onClick={() => handleOpenDetail(plot)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye size={16} />
                </button>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => handleOpenModal(plot)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Plot"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleArchive(plot)}
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title={plot.is_archived ? 'Restore' : 'Archive'}
                    >
                      <Archive size={16} />
                    </button>
                    <button
                      onClick={() => handleOpenTransfer(plot)}
                      className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Transfer Ownership"
                    >
                      <ArrowRightLeft size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========== CREATE / EDIT MODAL ========== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingPlot ? 'Edit Plot' : 'Create New Plot'}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Fill in the plot information below.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Row 1 — Plot Number & Block */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Plot Number *</label>
                  <input type="text" required className={inputClass} placeholder="e.g. P-001"
                    value={formData.plot_number} onChange={(e) => setFormData({ ...formData, plot_number: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Block</label>
                  <input type="text" className={inputClass} placeholder="e.g. Block A"
                    value={formData.block} onChange={(e) => setFormData({ ...formData, block: e.target.value })} />
                </div>
              </div>

              {/* Row 2 — Section & Row */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Section</label>
                  <input type="text" className={inputClass} placeholder="e.g. Section 1"
                    value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Row</label>
                  <input type="text" className={inputClass} placeholder="e.g. Row 5"
                    value={formData.row} onChange={(e) => setFormData({ ...formData, row: e.target.value })} />
                </div>
              </div>

              {/* Row 3 — Type & Status */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Plot Type</label>
                  <select className={inputClass + ' appearance-none'} value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {PLOT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                  <select className={inputClass + ' appearance-none'} value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingPlot ? 'Save Changes' : 'Create Plot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== TRANSFER OWNERSHIP MODAL ========== */}
      {isTransferOpen && transferPlot && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Transfer Ownership</h3>
                <p className="text-sm text-gray-500">Plot {transferPlot.plot_number}</p>
              </div>
              <button onClick={() => setIsTransferOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleTransfer} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                <strong>Current Owner:</strong> {transferPlot.owner_name || 'None'}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Owner Name *</label>
                <input type="text" required className={inputClass}
                  value={transferData.to_owner} onChange={(e) => setTransferData({ ...transferData, to_owner: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Owner Contact</label>
                <input type="text" className={inputClass} placeholder="Phone or email"
                  value={transferData.to_contact} onChange={(e) => setTransferData({ ...transferData, to_contact: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Transfer Notes</label>
                <textarea className={inputClass + ' min-h-[60px]'} placeholder="Reason for transfer..."
                  value={transferData.notes} onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })} />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsTransferOpen(false)}
                  className="px-5 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" className="btn-primary">Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== DETAIL / MAINTENANCE MODAL ========== */}
      {isDetailOpen && detailPlot && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Plot {detailPlot.plot_number}</h3>
                <p className="text-sm text-gray-500">{detailPlot.type} · {getStatusLabel(detailPlot.status)}</p>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 max-h-[75vh] overflow-y-auto space-y-6">
              {/* Details Grid */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 rounded-xl p-4">
                  <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Block</span>
                  <p className="font-bold text-gray-900 mt-1">{detailPlot.block || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Section</span>
                  <p className="font-bold text-gray-900 mt-1">{detailPlot.section || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Row</span>
                  <p className="font-bold text-gray-900 mt-1">{detailPlot.row || '-'}</p>
                </div>
              </div>

              {/* Maintenance History */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Wrench size={18} className="text-gray-500" />
                  <h4 className="font-bold text-gray-900">Maintenance History</h4>
                </div>

                {maintenanceHistory.length === 0 ? (
                  <p className="text-gray-400 text-sm py-4 text-center">No maintenance records yet.</p>
                ) : (
                  <div className="space-y-2 mb-4">
                    {maintenanceHistory.map((m) => (
                      <div key={m.id} className="bg-gray-50 rounded-xl p-4 text-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900">{m.description}</p>
                            {m.performed_by && <p className="text-gray-500 text-xs mt-0.5">By: {m.performed_by}</p>}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">{m.performed_at}</p>
                            {m.cost && <p className="text-blue-600 font-bold text-sm">₱{Number(m.cost).toLocaleString()}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Maintenance Form (admin only) */}
                {isAdmin && (
                  <form onSubmit={handleAddMaintenance} className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-600">Add Maintenance Record</p>
                    <input type="text" required className={inputClass} placeholder="Description of work..."
                      value={maintenanceData.description} onChange={(e) => setMaintenanceData({ ...maintenanceData, description: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" className={inputClass} placeholder="Performed by"
                        value={maintenanceData.performed_by} onChange={(e) => setMaintenanceData({ ...maintenanceData, performed_by: e.target.value })} />
                      <input type="text" className={inputClass} placeholder="Cost (₱)"
                        value={maintenanceData.cost} onChange={(e) => setMaintenanceData({ ...maintenanceData, cost: e.target.value })} />
                    </div>
                    <button type="submit" className="btn-primary text-sm py-2">Add Record</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlotManagement;
