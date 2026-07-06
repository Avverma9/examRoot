import React, { useState } from 'react';
import { ArrowLeft, Globe, Bell, Shield, FileText, Info, Save } from 'lucide-react';
import { Screen, User } from '../types';

interface SettingsScreenProps {
  onNavigate: (s: Screen) => void;
  user: User;
}

export function SettingsScreen({ onNavigate, user }: SettingsScreenProps) {
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      <div className="bg-white border-b border-slate-100 p-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => onNavigate('profile')} className="p-1 -ml-1 text-slate-700 active:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <span className="text-xs font-bold text-slate-400 tracking-wider mb-2 block uppercase">Account</span>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-50">
              <span className="text-xs text-slate-400 block mb-1">Full Name</span>
              <span className="text-sm font-semibold text-slate-900">{user.name}</span>
            </div>
            <div className="p-4">
              <span className="text-xs text-slate-400 block mb-1">Email</span>
              <span className="text-sm font-medium text-slate-600">{user.email}</span>
            </div>
          </div>
        </div>

        <div>
          <span className="text-xs font-bold text-slate-400 tracking-wider mb-2 block uppercase">Preferences</span>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-slate-400" />
                <span className="text-sm font-semibold text-slate-900">Language</span>
              </div>
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button 
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${language === 'en' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}
                >
                  English
                </button>
                <button 
                  onClick={() => setLanguage('hi')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${language === 'hi' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}
                >
                  हिंदी
                </button>
              </div>
            </div>
            <div className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-slate-400" />
                <span className="text-sm font-semibold text-slate-900">Notifications</span>
              </div>
              <button 
                onClick={() => setNotifications(!notifications)}
                className={`w-11 h-6 rounded-full p-1 transition-colors relative flex items-center ${notifications ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${notifications ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>
        </div>

        <div>
          <span className="text-xs font-bold text-slate-400 tracking-wider mb-2 block uppercase">Legal</span>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <button className="w-full p-4 border-b border-slate-50 flex justify-between items-center active:bg-slate-50">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-slate-400" />
                <span className="text-sm font-semibold text-slate-900">Privacy Policy</span>
              </div>
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
            </button>
            <button onClick={() => onNavigate('terms')} className="w-full p-4 flex justify-between items-center active:bg-slate-50">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-slate-400" />
                <span className="text-sm font-semibold text-slate-900">Terms of Service</span>
              </div>
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
            </button>
          </div>
        </div>

        <div>
          <span className="text-xs font-bold text-slate-400 tracking-wider mb-2 block uppercase">App</span>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <button onClick={() => onNavigate('about')} className="w-full p-4 border-b border-slate-50 flex justify-between items-center active:bg-slate-50">
              <div className="flex items-center gap-3">
                <Info size={18} className="text-slate-400" />
                <span className="text-sm font-semibold text-slate-900">About ExamRoot</span>
              </div>
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
            <div className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Info size={18} className="text-transparent" />
                <span className="text-sm font-semibold text-slate-900">Version</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">1.0.0</span>
            </div>
          </div>
        </div>

        <button className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 mt-4 active:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20">
          <Save size={18} /> Save Changes
        </button>
      </div>
    </div>
  );
}
