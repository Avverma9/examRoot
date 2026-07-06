import React from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { Screen } from '../types';
import { mockTestsList } from '../data';

interface MockTestScreenProps {
  onNavigate: (s: Screen) => void;
}

export function MockTestScreen({ onNavigate }: MockTestScreenProps) {
  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className="bg-white border-b border-slate-100 p-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => onNavigate('home')} className="p-1 -ml-1 text-slate-700 active:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">History</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-purple-50 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-purple-600 shadow-sm">
            <Clock size={20} />
          </div>
          <div>
            <h2 className="font-bold text-purple-900">History</h2>
            <p className="text-sm text-purple-600/80">45 tests</p>
          </div>
        </div>

        <div className="space-y-3">
          {mockTestsList.map((test, index) => (
            <div key={test.id} className="border border-slate-100 rounded-2xl p-4 bg-white flex gap-3 shadow-sm items-center">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center shrink-0 text-purple-600 font-bold text-lg">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-sm truncate">{test.title}</h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">{test.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="text-slate-400">⏱</span> {test.questions} Qs
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-slate-400">⏱</span> {test.timeMin} min
                  </span>
                  <span className="font-bold text-green-600 bg-green-50 px-1.5 rounded">{test.price}</span>
                </div>
              </div>
              <button className="bg-purple-500 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm active:bg-purple-600 transition-colors">
                Start
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
