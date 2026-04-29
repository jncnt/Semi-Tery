import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, MapPin, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPlots: 0,
    occupiedPlots: 0,
    availablePlots: 0,
    recentBurials: [] as any[],
  });

  useEffect(() => {
    const fetchStats = async () => {
      // For now, let's try to fetch real counts if tables exist
      const { count: total } = await supabase.from('plots').select('*', { count: 'exact', head: true });
      const { count: occupied } = await supabase.from('plots').select('*', { count: 'exact', head: true }).eq('status', 'occupied');
      const { data: recent } = await supabase.from('burial_records').select('*, plots(plot_number)').order('burial_date', { ascending: false }).limit(5);

      setStats({
        totalPlots: total || 0,
        occupiedPlots: occupied || 0,
        availablePlots: (total || 0) - (occupied || 0),
        recentBurials: recent || [],
      });
    };

    fetchStats();
  }, []);

  const StatCard = ({ icon: Icon, label, value, bgClass, textClass }: any) => (
    <div className="card flex items-center gap-5">
      <div className={`p-4 rounded-2xl ${bgClass} ${textClass} shadow-inner`}>
        <Icon size={26} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-3xl font-black text-gray-800 tracking-tight">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">System Overview</h1>
        <p className="text-gray-500 text-lg">Bird's-eye view of cemetery operations and capacity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={MapPin} label="Total Plots" value={stats.totalPlots} bgClass="bg-blue-500/10" textClass="text-blue-600" />
        <StatCard icon={CheckCircle} label="Occupied Plots" value={stats.occupiedPlots} bgClass="bg-blue-600/10" textClass="text-blue-600" />
        <StatCard icon={Clock} label="Available Plots" value={stats.availablePlots} bgClass="bg-blue-400/10" textClass="text-blue-600" />
        <StatCard icon={Users} label="Total Records" value={stats.occupiedPlots} bgClass="bg-blue-700/10" textClass="text-blue-600" />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-lg">Recent Burials</h3>
          <button className="text-primary text-sm font-semibold hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Deceased Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Burial Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Plot Number</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentBurials.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No recent burials found.</td>
                </tr>
              ) : (
                stats.recentBurials.map((burial, i) => (
                  <tr key={burial.id || i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{burial.full_name}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {burial.burial_date ? format(new Date(burial.burial_date), 'MMM d, yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-sm">{burial.plots?.plot_number || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
