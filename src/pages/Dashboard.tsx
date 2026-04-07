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
      const { data: recent } = await supabase.from('burial_records').select('*').order('burial_date', { ascending: false }).limit(5);

      setStats({
        totalPlots: total || 1200, // Fallback for demo
        occupiedPlots: occupied || 850,
        availablePlots: (total || 1200) - (occupied || 850),
        recentBurials: recent || [
          { full_name: 'John Doe', burial_date: '2024-03-20', plot_number: 'A-102' },
          { full_name: 'Jane Smith', burial_date: '2024-03-18', plot_number: 'B-44' },
          { full_name: 'Mary Johnson', burial_date: '2024-03-15', plot_number: 'C-21' },
          { full_name: 'Robert Brown', burial_date: '2024-03-10', plot_number: 'A-55' },
        ],
      });
    };

    fetchStats();
  }, []);

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white border border-gray-200 p-6 rounded-xl flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Overview of cemetery operations and records.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={MapPin} label="Total Plots" value={stats.totalPlots} color="bg-blue-500" />
        <StatCard icon={CheckCircle} label="Occupied Plots" value={stats.occupiedPlots} color="bg-green-500" />
        <StatCard icon={Clock} label="Available Plots" value={stats.availablePlots} color="bg-primary" />
        <StatCard icon={Users} label="Total Records" value={stats.occupiedPlots} color="bg-purple-500" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
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
              {stats.recentBurials.map((burial, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{burial.full_name}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {format(new Date(burial.burial_date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-sm">{burial.plot_number || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
