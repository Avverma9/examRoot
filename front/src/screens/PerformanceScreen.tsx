import React from 'react';
import { ArrowLeft, RefreshCw, ClipboardList, Target, Zap, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Screen } from '../types';
import { mockStats } from '../data';

interface PerformanceScreenProps {
  onNavigate: (s: Screen) => void;
}

const activityData = [
  { name: '06-23', mock: 0, practice: 0, video: 0 },
  { name: '06-24', mock: 0, practice: 0, video: 0 },
  { name: '06-25', mock: 0, practice: 0, video: 0 },
  { name: '06-26', mock: 0, practice: 0, video: 0 },
  { name: '06-27', mock: 2, practice: 1, video: 0 },
  { name: '06-28', mock: 12, practice: 3, video: 0 },
  { name: '06-29', mock: 0, practice: 0, video: 0 },
  { name: '06-30', mock: 1, practice: 0, video: 0 },
  { name: '07-01', mock: 1, practice: 0, video: 0 },
  { name: '07-02', mock: 2, practice: 0, video: 0 },
  { name: '07-03', mock: 2, practice: 0, video: 0 },
  { name: '07-04', mock: 0, practice: 0, video: 0 },
  { name: '07-05', mock: 1, practice: 0, video: 0 },
  { name: '07-06', mock: 0, practice: 0, video: 0 },
];

export function PerformanceScreen({ onNavigate }: PerformanceScreenProps) {
  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      <div className="bg-white border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('profile')} className="p-1 -ml-1 text-slate-700 active:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-slate-900">My Performance</h1>
        </div>
        <button className="text-slate-400 active:text-slate-600">
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Overview</span>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-col items-center justify-center">
            <ClipboardList size={24} className="text-indigo-600 mb-2" />
            <span className="text-2xl font-bold text-indigo-700 leading-tight">{mockStats.testsTaken}</span>
            <span className="text-[10px] font-medium text-slate-500 mt-0.5">Tests Taken</span>
          </div>
          <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 flex flex-col items-center justify-center">
            <Target size={24} className="text-green-500 mb-2" />
            <span className="text-2xl font-bold text-green-700 leading-tight">{mockStats.accuracy}%</span>
            <span className="text-[10px] font-medium text-slate-500 mt-0.5">Accuracy</span>
          </div>
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-col items-center justify-center">
            <Zap size={24} className="text-indigo-600 mb-2" />
            <span className="text-2xl font-bold text-indigo-800 leading-tight">{mockStats.streak}</span>
            <span className="text-[10px] font-medium text-slate-500 mt-0.5">Day Streak</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button className="px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">7d</button>
          <button className="px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">14d</button>
          <button className="px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">30d</button>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm mt-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={18} className="text-indigo-600" />
            <h2 className="font-bold text-slate-900">Activity — Last 14 Days</h2>
          </div>
          
          <div className="flex gap-4 mb-6 text-[10px] font-medium text-slate-500">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-orange-500"></div> Mock</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-green-500"></div> Practice</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-purple-500"></div> Video</span>
          </div>

          <div className="space-y-4">
            {activityData.map((data, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                  <span>{data.name}</span>
                  <span className="font-bold text-slate-900">{data.mock + data.practice + data.video}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  {data.mock > 0 && <div className="h-full bg-orange-500" style={{ width: `${(data.mock / 15) * 100}%` }}></div>}
                  {data.practice > 0 && <div className="h-full bg-green-500" style={{ width: `${(data.practice / 15) * 100}%` }}></div>}
                  {data.video > 0 && <div className="h-full bg-purple-500" style={{ width: `${(data.video / 15) * 100}%` }}></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
