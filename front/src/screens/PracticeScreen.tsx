import React from 'react';
import { User, BookOpen } from 'lucide-react';
import { Screen } from '../types';

interface PracticeScreenProps {
  onNavigate: (s: Screen) => void;
}

export function PracticeScreen({ onNavigate }: PracticeScreenProps) {
  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      <div className="bg-green-500 text-white p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold">Practice</h1>
        <button onClick={() => onNavigate('profile')} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30">
          <User size={20} className="text-white" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
          <BookOpen size={40} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Practice Mode</h2>
        <p className="text-slate-500 mb-6">Select a topic to start practicing questions chapter-wise without any time limit.</p>
        <button className="bg-green-500 text-white px-8 py-3 rounded-xl font-semibold shadow-sm active:bg-green-600 transition-colors">
          Browse Topics
        </button>
      </div>
    </div>
  );
}
