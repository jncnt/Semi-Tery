import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Filter, Edit2, Trash2, ExternalLink, Search, Plus, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const BurialRecords = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [plots, setPlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
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

  const fetchPlots = async () => {
    const { data, error } = await supabase
      .from('plots')
      .select('id, plot_number, section, status')
      .order('plot_number');

    if (error) console.error('Error fetching plots:', error);
    else setPlots(data || []);
  };

  useEffect(() => {
    fetchRecords();
    fetchPlots();
  }, []);

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

    if (payload.plot_id) {
      await supabase.from('plots').update({ status: 'occupied' }).eq('id', payload.plot_id);
    }
    if (editingRecord?.plot_id && editingRecord.plot_id !== payload.plot_id) {
      const { count } = await supabase
        .from('burial_records')
        .select('*', { count: 'exact', head: true })
        .eq('plot_id', editingRecord.plot_id);
      if (!count) {
        await supabase.from('plots').update({ status: 'available' }).eq('id', editingRecord.plot_id);
      }
    }

    setIsModalOpen(false);
    fetchRecords();
    fetchPlots();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      const { error } = await supabase.from('burial_records').delete().eq('id', id);
      if (error) alert(error.message);
      else fetchRecords();
    }
  };

  const filteredRecords = records.filter(r => 
    r.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.plots?.plot_number || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 font-sans bg-white">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Burial Records</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage and view all registered deceased records.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 hover:shadow-blue-500/30"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Add New Record</span>
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by deceased name or plot number..."
            className="input-field pl-11 h-12 shadow-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-5 h-12 border border-slate-200/80 rounded-xl flex items-center gap-2 text-slate-600 hover:bg-slate-50 font-semibold text-sm transition-all shadow-xs">
          <Filter size={16} />
          <span>Filters</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Full Name</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Dates</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Plot / Section</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">Loading records...</td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">No records found.</td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-base">{record.full_name}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex flex-col text-xs font-medium space-y-0.5">
                        <span>Birth: {record.birth_date ? format(new Date(record.birth_date), 'MMM d, yyyy') : 'N/A'}</span>
                        <span>Death: {record.death_date ? format(new Date(record.death_date), 'MMM d, yyyy') : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60 w-fit">
                          {record.plots?.plot_number || 'Unassigned'}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-1">{record.plots?.section || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Link
                          to={`/memorial/${record.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          title="View Memorial"
                        >
                          <ExternalLink size={18} />
                        </Link>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenModal(record)}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Plot / Section</label>
                <div className="relative">
                  <select
                    className="input-field pr-10 appearance-none cursor-pointer"
                    value={formData.plot_id}
                    onChange={(e) => setFormData({ ...formData, plot_id: e.target.value })}
                  >
                    <option value="">-- Select Plot / Section (Optional) --</option>
                    {plots.map((plot) => (
                      <option key={plot.id} value={plot.id}>
                        {plot.plot_number} {plot.section ? `(${plot.section})` : ''} - {plot.status.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
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
