import React from 'react';
import { User, Screen } from '../types';
import { mockStats, mockTestsList } from '../data';
import { User as UserIcon, BookOpen, FileText, PlayCircle, Clock, Play } from 'lucide-react';

interface HomeScreenProps {
  onNavigate: (s: Screen) => void;
  user: User;
}

export function HomeScreen({ onNavigate, user }: HomeScreenProps) {
  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 flex justify-between items-center pb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-indigo-600 font-bold text-xs">ER</span>
          </div>
          <span className="font-semibold text-lg">ExamRoot</span>
        </div>
        <button onClick={() => onNavigate('profile')} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30">
          <UserIcon size={20} className="text-white" />
        </button>
      </div>

      <div className="px-4 -mt-4 z-10">
        {/* Stats Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex justify-between items-center">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider mb-1">TESTS TAKEN</span>
            <span className="text-2xl font-bold text-indigo-700">{mockStats.testsTaken}</span>
          </div>
          <div className="w-px h-10 bg-slate-100"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider mb-1">ACCURACY</span>
            <span className="text-2xl font-bold text-green-500">{mockStats.accuracy}%</span>
          </div>
          <div className="w-px h-10 bg-slate-100"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider mb-1">STREAK</span>
            <span className="text-2xl font-bold text-indigo-600 flex items-center gap-1">{mockStats.streak} 🔥</span>
          </div>
        </div>
      </div>

      <div className="p-4 mt-2">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Explore Categories</h2>
        <div className="grid grid-cols-4 gap-3">
          <div onClick={() => onNavigate('mock')} className="flex flex-col items-center gap-2 cursor-pointer">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <FileText size={24} />
            </div>
            <span className="text-xs font-medium text-slate-700 text-center">Mock Tests</span>
          </div>
          <div onClick={() => onNavigate('practice')} className="flex flex-col items-center gap-2 cursor-pointer">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-500">
              <BookOpen size={24} />
            </div>
            <span className="text-xs font-medium text-slate-700 text-center">Practice</span>
          </div>
          <div onClick={() => onNavigate('videos')} className="flex flex-col items-center gap-2 cursor-pointer">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
              <PlayCircle size={24} />
            </div>
            <span className="text-xs font-medium text-slate-700 text-center">Video Class</span>
          </div>
          <div onClick={() => onNavigate('testSeries')} className="flex flex-col items-center gap-2 cursor-pointer">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500">
              <Clock size={24} />
            </div>
            <span className="text-xs font-medium text-slate-700 text-center">PYQ Papers</span>
          </div>
        </div>

        <div className="flex justify-between items-center mt-8 mb-4">
          <h2 className="text-lg font-bold text-slate-900">Continue Learning</h2>
          <span className="text-sm font-semibold text-indigo-700 cursor-pointer">See All</span>
        </div>

        <div className="space-y-4">
          {/* Continue Learning items */}
          <div className="border border-slate-100 rounded-2xl p-4 bg-white shadow-sm">
            <div className="flex gap-3 mb-3">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                <FileText size={20} className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-700 tracking-wider">MOCK TEST</span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">Geography Page 05</h3>
                  </div>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">Q 1/80</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 w-[0%] rounded-full"></div>
              </div>
              <span className="text-[10px] text-slate-400 font-medium w-10 text-right">0% done</span>
            </div>
            <button className="w-full bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:bg-indigo-800 transition-colors">
              <Play size={16} fill="currentColor" /> Resume
            </button>
          </div>

          <div className="border border-slate-100 rounded-2xl p-4 bg-white shadow-sm">
            <div className="flex gap-3 mb-3">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                <FileText size={20} className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-700 tracking-wider">MOCK TEST</span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">History Test Page 45</h3>
                  </div>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">Q 2/77</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 w-[1%] rounded-full"></div>
              </div>
              <span className="text-[10px] text-slate-400 font-medium w-10 text-right">1% done</span>
            </div>
            <button className="w-full bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:bg-indigo-800 transition-colors">
              <Play size={16} fill="currentColor" /> Resume
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
