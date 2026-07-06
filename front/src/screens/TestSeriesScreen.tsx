import React from 'react';
import { User, Layers, Lock } from 'lucide-react';
import { Screen } from '../types';

interface TestSeriesScreenProps {
  onNavigate: (s: Screen) => void;
}

export function TestSeriesScreen({ onNavigate }: TestSeriesScreenProps) {
  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      <div className="bg-indigo-600 text-white p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold">Test Series</h1>
        <button onClick={() => onNavigate('profile')} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30">
          <User size={20} className="text-white" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-r from-indigo-600 to-orange-500 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase mb-2 inline-block">Premium</span>
            <h2 className="text-xl font-bold mb-1">SSC CGL Tier-1 2024</h2>
            <p className="text-white/80 text-sm mb-4">150+ Full Mock Tests • Video Solutions</p>
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">₹499</span>
              <button className="bg-white text-orange-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm active:bg-slate-50 transition-colors">
                Buy Now
              </button>
            </div>
          </div>
          <Layers size={100} className="absolute -right-4 -bottom-4 text-white/10" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">RRB NTPC CBT-1</h3>
              <p className="text-slate-500 text-sm mt-1">100 Full Mock Tests</p>
            </div>
            <div className="bg-slate-100 p-2 rounded-lg text-slate-400">
              <Lock size={20} />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <span className="font-bold text-slate-900">₹399</span>
            <button className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold active:bg-indigo-100 transition-colors">
              Unlock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
