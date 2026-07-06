import React from 'react';
import { Bookmark, Clock, Settings, HelpCircle, LogOut } from 'lucide-react';
import { Screen, User } from '../types';
import { mockStats } from '../data';

interface ProfileScreenProps {
  onNavigate: (s: Screen) => void;
  onLogout: () => void;
  user: User;
}

export function ProfileScreen({ onNavigate, onLogout, user }: ProfileScreenProps) {
  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className="bg-indigo-600 text-white pt-8 pb-10 px-4 rounded-b-[2.5rem] flex flex-col items-center">
        <div className="w-24 h-24 rounded-full border-4 border-white/20 overflow-hidden mb-4">
          <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
        </div>
        <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
        <p className="text-white/80 text-sm mb-6">{user.email}</p>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl w-full p-4 flex justify-between items-center border border-white/10">
          <div className="flex flex-col items-center flex-1">
            <span className="text-sm font-bold flex items-center gap-1.5"><span className="text-indigo-400">📋</span> {mockStats.testsTaken}</span>
            <span className="text-[10px] text-white/70 mt-0.5">Tests</span>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div className="flex flex-col items-center flex-1">
            <span className="text-sm font-bold flex items-center gap-1.5"><span className="text-indigo-400">🎯</span> {mockStats.accuracy}%</span>
            <span className="text-[10px] text-white/70 mt-0.5">Accuracy</span>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div className="flex flex-col items-center flex-1">
            <span className="text-sm font-bold flex items-center gap-1.5"><span className="text-indigo-400">⚡</span> {mockStats.streak} 🔥</span>
            <span className="text-[10px] text-white/70 mt-0.5">Streak</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3 -mt-4">
        <button className="w-full bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm active:bg-slate-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Bookmark size={20} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 text-sm">Saved Questions</h3>
              <p className="text-xs text-slate-500 mt-0.5">Review bookmarked questions</p>
            </div>
          </div>
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        </button>

        <button onClick={() => onNavigate('performance')} className="w-full bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm active:bg-slate-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 text-sm">My Performance</h3>
              <p className="text-xs text-slate-500 mt-0.5">{mockStats.testsTaken} tests • {mockStats.accuracy}% accuracy</p>
            </div>
          </div>
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        </button>

        <button onClick={() => onNavigate('settings')} className="w-full bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm active:bg-slate-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Settings size={20} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 text-sm">Settings</h3>
              <p className="text-xs text-slate-500 mt-0.5">Language, notifications & more</p>
            </div>
          </div>
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        </button>

        <button onClick={() => onNavigate('contact')} className="w-full bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm active:bg-slate-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <HelpCircle size={20} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-900 text-sm">Help & Support</h3>
              <p className="text-xs text-slate-500 mt-0.5">FAQs, email & chat support</p>
            </div>
          </div>
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        </button>

        <button onClick={onLogout} className="w-full bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center justify-between active:bg-red-100 transition-colors mt-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-100 text-red-500 rounded-xl flex items-center justify-center">
              <LogOut size={20} />
            </div>
            <h3 className="font-bold text-red-600 text-sm">Logout</h3>
          </div>
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
    </div>
  );
}
