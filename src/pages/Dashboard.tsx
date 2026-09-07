import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, MapPin, CheckCircle2, Clock, ArrowRight, BookmarkCheck } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { getDisplayName } from '../lib/nameUtils';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPlots: 0,
    occupiedPlots: 0,
    reservedPlotsCount: 0,
    availablePlots: 0,
    totalRecords: 0,
    recentBurials: [] as any[],
    reservedPlotsList: [] as any[],
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { count: total } = await supabase.from('plots').select('*', { count: 'exact', head: true });
      const { count: occupied } = await supabase.from('plots').select('*', { count: 'exact', head: true }).eq('status', 'occupied');
      const { count: reserved } = await supabase.from('plots').select('*', { count: 'exact', head: true }).eq('status', 'reserved');
      const { count: recordsCount } = await supabase.from('burial_records').select('*', { count: 'exact', head: true });
      const { data: recent } = await supabase.from('burial_records').select('*, plots(plot_number, status)').order('burial_date', { ascending: false }).limit(5);
      const { data: reservedList } = await supabase.from('plots').select('*').eq('status', 'reserved').order('plot_number').limit(5);

      const totalNum = total || 0;
      const occupiedNum = occupied || 0;
      const reservedNum = reserved || 0;

      setStats({
        totalPlots: totalNum,
        occupiedPlots: occupiedNum,
        reservedPlotsCount: reservedNum,
        availablePlots: Math.max(0, totalNum - occupiedNum - reservedNum),
        totalRecords: recordsCount || 0,
        recentBurials: recent || [],
        reservedPlotsList: reservedList || [],
      });
    };

    fetchStats();
  }, []);

  const StatCard = ({ icon: Icon, label, value, bgClass, iconColor, ringColor }: any) => (
    <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className={`p-3 rounded-2xl ${bgClass} ${iconColor} ${ringColor} ring-1 shrink-0`}>
        <Icon size={22} strokeWidth={2.2} />
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 font-sans bg-white">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm">Real-time overview of cemetery operations and plot reservations.</p>
        </div>
        <Link
          to="/plots"
          className="btn-primary flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 w-fit"
        >
          <BookmarkCheck size={18} strokeWidth={2.2} />
          <span>Browse & Reserve Plots</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={MapPin} label="Total Plots" value={stats.totalPlots} bgClass="bg-blue-50/80" iconColor="text-blue-600" ringColor="ring-blue-500/10" />
        <StatCard icon={CheckCircle2} label="Occupied Plots" value={stats.occupiedPlots} bgClass="bg-emerald-50/80" iconColor="text-emerald-600" ringColor="ring-emerald-500/10" />
        <StatCard icon={BookmarkCheck} label="Reserved Plots" value={stats.reservedPlotsCount} bgClass="bg-amber-50/80" iconColor="text-amber-600" ringColor="ring-amber-500/10" />
        <StatCard icon={Clock} label="Available Plots" value={stats.availablePlots} bgClass="bg-sky-50/80" iconColor="text-sky-600" ringColor="ring-sky-500/10" />
        <StatCard icon={Users} label="Total Records" value={stats.totalRecords} bgClass="bg-indigo-50/80" iconColor="text-indigo-600" ringColor="ring-indigo-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Burials Table (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Recent Burials</h3>
              <p className="text-xs text-slate-400 mt-0.5">Most recently updated deceased records</p>
            </div>
            <Link to="/records" className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1.5 hover:gap-2 transition-all">
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Deceased Name</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Burial Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Plot Number</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {stats.recentBurials.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">No recent burials found.</td>
                  </tr>
                ) : (
                  stats.recentBurials.map((burial, i) => (
                    <tr key={burial.id || i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{getDisplayName(burial)}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {burial.burial_date ? format(new Date(burial.burial_date), 'MMM d, yyyy') : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60">
                          {burial.plots?.plot_number || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {burial.burial_date && new Date(burial.burial_date) > new Date() ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/70">
                            Scheduled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                            Buried
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reserved Plots Section (1 col) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Reserved Plots</h3>
              <p className="text-xs text-slate-400 mt-0.5">Currently reserved sanctuary plots</p>
            </div>
            <Link to="/plots" className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1 hover:gap-1.5 transition-all">
              <span>Manage</span>
              <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="p-4 flex-1 flex flex-col justify-between">
            {stats.reservedPlotsList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <BookmarkCheck size={32} className="mx-auto mb-2 opacity-40 text-slate-400" />
                No plots currently reserved.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.reservedPlotsList.map((plot) => (
                  <div key={plot.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{plot.plot_number}</h4>
                      <p className="text-xs text-slate-500 font-medium">{plot.section || 'Main Section'}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                      Reserved
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link
                to="/plots"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <BookmarkCheck size={16} />
                <span>Reserve A Plot Now</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
