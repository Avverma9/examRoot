import React from 'react';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import { Screen } from '../types';

interface AboutScreenProps {
  onNavigate: (s: Screen) => void;
}

export function AboutScreen({ onNavigate }: AboutScreenProps) {
  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className="bg-white border-b border-slate-100 p-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => onNavigate('settings')} className="p-1 -ml-1 text-slate-700 active:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">About Us</h1>
      </div>

      <div className="p-6 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-600/20 transform rotate-3">
          <GraduationCap size={48} className="text-white transform -rotate-3" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2">ExamRoot</h2>
        <p className="text-slate-500 mb-8">Version 1.0.0</p>
        
        <p className="text-slate-600 leading-relaxed mb-6">
          ExamRoot is India's most trusted learning platform for government exam preparation. 
          We provide high-quality mock tests, practice sessions, video lectures, and live quizzes 
          to help you achieve your goals.
        </p>

        <p className="text-slate-600 leading-relaxed">
          Founded in Patna, Bihar, our mission is to make quality education accessible and 
          affordable to every aspirant in the country.
        </p>
      </div>
    </div>
  );
}
