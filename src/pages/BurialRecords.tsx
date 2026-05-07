import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Filter, Edit2, Trash2, ExternalLink, Search, Plus, MapPin, ChevronDown, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const BurialRecords = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [availablePlots, setAvailablePlots] = useState<any[]>([]);
  const [inlineAssignId, setInlineAssignId] = useState<string | null>(null);
  const [inlinePlotSearch, setInlinePlotSearch] = useState('');
  const inlineRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useAuth();

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    birth_date: '',
    death_date: '',
    burial_date: '',
    plot_id: '',
    notes: '',
  });

  const fetchPlots = async () => {
    const { data, error } = await supabase
      .from('plots')
      .select('id, plot_number, section, block, status')
      .order('plot_number');
    if (!error) setAvailablePlots(data || []);
  };

  const fetchRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('burial_records')
      .select('*, plots(plot_number, section)')
      .order('full_name');

    if (error) console.error('Error fetching records:', error);
    else setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
    fetchPlots();
  }, []);

  // Close inline dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (inlineRef.current && !inlineRef.current.contains(e.target as Node)) {
        setInlineAssignId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleInlineAssign = async (recordId: string, plotId: string) => {
    const { error } = await supabase
      .from('burial_records')
      .update({ plot_id: plotId })
      .eq('id', recordId);
    if (error) alert(error.message);
    else {
      setInlineAssignId(null);
      fetchRecords();
    }
  };

  const handleOpenModal = (record: any = null) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        full_name: record.full_name,
        birth_date: record.birth_date || '',
        death_date: record.death_date || '',
        burial_date: record.burial_date || '',
        plot_id: record.plot_id || '',
        notes: record.notes || '',
      });
    } else {
      setEditingRecord(null);
      setFormData({
        full_name: '',
        birth_date: '',
        death_date: '',
        burial_date: '',
        plot_id: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };

    // Convert empty strings to null for dates/plot_id
    if (!payload.birth_date) (payload as any).birth_date = null;
    if (!payload.death_date) (payload as any).death_date = null;
    if (!payload.burial_date) (payload as any).burial_date = null;
    if (!payload.plot_id) (payload as any).plot_id = null;

    if (editingRecord) {
      const { error } = await supabase
        .from('burial_records')
        .update(payload)
        .eq('id', editingRecord.id);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase
        .from('burial_records')
        .insert([payload]);
      if (error) alert(error.message);
    }

    setIsModalOpen(false);
    fetchRecords();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      const { error } = await supabase.from('burial_records').delete().eq('id', id);
      if (error) alert(error.message);
      else fetchRecords();
    }
  };

  // Collect plot IDs already assigned to burial records
  const assignedPlotIds = new Set(records.map(r => r.plot_id).filter(Boolean));

  const filteredRecords = records.filter(r =>
    r.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.plots?.plot_number || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Burial Records</h1>
          <p className="text-gray-500">Manage and view all deceased records.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Add New Record
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or plot number..."
            className="input-field pl-10 h-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2 text-gray-600 hover:bg-gray-50 h-12">
          <Filter size={18} />
          Filters
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Full Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Dates</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Plot / Section</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400">Loading records...</td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400">No records found.</td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{record.full_name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <div className="flex flex-col">
                        <span>Birth: {record.birth_date ? format(new Date(record.birth_date), 'MMM d, yyyy') : 'N/A'}</span>
                        <span>Death: {record.death_date ? format(new Date(record.death_date), 'MMM d, yyyy') : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {record.plots ? (
                        <div className="flex flex-col">
                          <span className="font-mono text-gray-900">{record.plots.plot_number}</span>
                          <span className="text-xs uppercase">{record.plots.section || '-'}</span>
                        </div>
                      ) : (
                        <div className="relative" ref={inlineAssignId === record.id ? inlineRef : undefined}>
                          {isAdmin ? (
                            <>
                              <button
                                onClick={() => {
                                  setInlineAssignId(inlineAssignId === record.id ? null : record.id);
                                  setInlinePlotSearch('');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 hover:border-amber-300 transition-all"
                              >
                                <MapPin size={13} />
                                Assign Plot
                                <ChevronDown size={13} className={`transition-transform ${inlineAssignId === record.id ? 'rotate-180' : ''}`} />
                              </button>
                              {inlineAssignId === record.id && (
                                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-40 overflow-hidden">
                                  <div className="p-2 border-b border-gray-100">
                                    <input
                                      type="text"
                                      placeholder="Search plots..."
                                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                      value={inlinePlotSearch}
                                      onChange={(e) => setInlinePlotSearch(e.target.value)}
                                      autoFocus
                                    />
                                  </div>
                                  <div className="max-h-48 overflow-y-auto">
                                    {availablePlots
                                      .filter(p =>
                                        (p.status === 'available') &&
                                        !assignedPlotIds.has(p.id) &&
                                        (p.plot_number.toLowerCase().includes(inlinePlotSearch.toLowerCase()) ||
                                        (p.section || '').toLowerCase().includes(inlinePlotSearch.toLowerCase()))
                                      )
                                      .map(plot => (
                                        <button
                                          key={plot.id}
                                          onClick={() => handleInlineAssign(record.id, plot.id)}
                                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 flex items-center justify-between transition-colors"
                                        >
                                          <div>
                                            <span className="font-semibold text-gray-900">{plot.plot_number}</span>
                                            <span className="text-gray-400 text-xs ml-2">{[plot.section, plot.block].filter(Boolean).join(' · ')}</span>
                                          </div>
                                          <Check size={14} className="text-blue-500 opacity-0 group-hover:opacity-100" />
                                        </button>
                                      ))
                                    }
                                    {availablePlots.filter(p => p.status === 'available' && !assignedPlotIds.has(p.id) && p.plot_number.toLowerCase().includes(inlinePlotSearch.toLowerCase())).length === 0 && (
                                      <p className="px-4 py-3 text-xs text-gray-400 text-center">No available plots found</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 italic text-xs">Unassigned</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/memorial/${record.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Memorial"
                        >
                          <ExternalLink size={18} />
                        </Link>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenModal(record)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-gray-200 w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingRecord ? 'Edit Burial Record' : 'Add New Record'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Death Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.death_date}
                    onChange={(e) => setFormData({ ...formData, death_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Burial Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.burial_date}
                  onChange={(e) => setFormData({ ...formData, burial_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Plot</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <select
                    className="input-field pl-10 appearance-none"
                    value={formData.plot_id}
                    onChange={(e) => setFormData({ ...formData, plot_id: e.target.value })}
                  >
                    <option value="">No Plot (Unassigned)</option>
                    {availablePlots
                      .filter(p => (p.status === 'available' && !assignedPlotIds.has(p.id)) || p.id === formData.plot_id)
                      .map(plot => (
                        <option key={plot.id} value={plot.id}>
                          {plot.plot_number} — {[plot.section, plot.block].filter(Boolean).join(' · ') || 'No location'}
                        </option>
                      ))
                    }
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="input-field min-h-[100px]"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg border border-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingRecord ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BurialRecords;
