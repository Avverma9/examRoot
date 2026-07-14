import { useGetAdminStatsQuery } from '../services/adminStatsApi';
import { Users, PlayCircle, FileText, CheckSquare, Activity } from 'lucide-react';

export function Dashboard() {
  const { data, isLoading, error } = useGetAdminStatsQuery();

  if (isLoading) return <div className="text-zinc-400">Loading...</div>;
  if (error) return <div className="text-red-400">Failed to load stats</div>;

  const stats = data?.data || {};

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers || 0, icon: Users, sub: '+12% vs last month', subColor: 'text-emerald-400' },
    { title: 'Videos Watched', value: stats.videosWatched || 0, icon: PlayCircle, sub: '203k unique watchers', subColor: 'text-zinc-500' },
    { title: 'Tests Attempted', value: stats.testsAttempted || 0, icon: FileText, sub: '2,871 active last 7 days', subColor: 'text-indigo-400' },
    { title: 'Practice Attempted', value: stats.practiceAttempted || 0, icon: CheckSquare, sub: 'Steady growth', subColor: 'text-zinc-500' },
    { title: 'Active Today', value: stats.activeToday || 0, icon: Activity, sub: 'Peaks at 8PM', subColor: 'text-zinc-500' },
    { title: 'Devices Active Now', value: stats.currentActiveDevices || 0, icon: Activity, sub: 'Foreground sessions right now', subColor: 'text-orange-400' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight mb-6 text-zinc-100">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
            <div className="text-zinc-500 text-xs font-medium mb-1">{stat.title}</div>
            <div className="text-2xl font-bold tracking-tight text-zinc-100">{stat.value.toLocaleString()}</div>
            <div className={`text-[10px] mt-2 font-bold ${stat.subColor}`}>{stat.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
