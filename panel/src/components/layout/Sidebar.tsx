import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  FileText,
  PenTool,
  Layers,
  Image as ImageIcon,
  Smartphone,
  Sparkles,
  Activity,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const managementItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Videos', path: '/videos', icon: Video },
  { name: 'Mock Tests', path: '/mock-tests', icon: FileText },
  { name: 'Practice Sets', path: '/practice-sets', icon: PenTool },
  { name: 'Test Series', path: '/test-series', icon: Layers },
  { name: 'Banners', path: '/banners', icon: ImageIcon },
  { name: 'App Update', path: '/app-update', icon: Smartphone },
];

const toolItems = [
  { name: 'Generate AI', path: '/generate', icon: Sparkles },
];

const monitoringItems = [
  { name: 'Activity Log', path: '/activity-log', icon: Activity },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-900/40 flex flex-col h-full">
      <div className="p-6 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg">ER</div>
          <span className="text-xl font-bold tracking-tight">ExamRoot <span className="text-indigo-400">Pro</span></span>
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold px-3 py-2">Management</div>
        {managementItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm',
                isActive
                  ? 'bg-zinc-800/50 text-indigo-400 border border-zinc-700/50'
                  : 'text-zinc-400 hover:bg-zinc-800 border border-transparent'
              )
            }
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </NavLink>
        ))}

        <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold px-3 py-6 pb-2">Tools</div>
        {toolItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm',
                isActive
                  ? 'bg-zinc-800/50 text-indigo-400 border border-zinc-700/50 bg-indigo-500/5'
                  : 'text-zinc-400 hover:bg-zinc-800 border border-transparent'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-4 h-4', isActive && 'text-purple-400')} />
                {item.name}
              </>
            )}
          </NavLink>
        ))}

        <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold px-3 py-6 pb-2">Monitoring</div>
        {monitoringItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm',
                isActive
                  ? 'bg-zinc-800/50 text-orange-300 border border-orange-500/30'
                  : 'text-zinc-400 hover:bg-zinc-800 border border-transparent'
              )
            }
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 mt-auto">
        <div className="bg-zinc-800/80 p-3 rounded-lg border border-zinc-700">
          <div className="text-xs text-zinc-400 mb-1">Environment</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-mono text-emerald-400 tracking-tight">PROD: backend.examroot.cc</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
