import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b border-zinc-800 flex items-center px-8 justify-between bg-zinc-900/20 backdrop-blur-md">
          <h1 className="text-sm font-medium text-zinc-400">System / <span className="text-zinc-100">Overview</span></h1>
          <div className="flex items-center gap-6">
            <div className="relative">
              <input type="text" placeholder="Search content..." className="bg-zinc-800 border-none rounded-full px-4 py-1.5 text-xs w-64 focus:ring-1 focus:ring-indigo-500 outline-none text-zinc-100 placeholder-zinc-500" />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-bold">Admin User</div>
                <div className="text-[10px] text-zinc-500">Super Admin</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-600"></div>
            </div>
          </div>
        </header>
        <div className="p-8 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
