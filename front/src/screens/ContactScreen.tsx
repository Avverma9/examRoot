import React from 'react';
import { ArrowLeft, Phone, Mail, MapPin } from 'lucide-react';
import { Screen } from '../types';

interface ContactScreenProps {
  onNavigate: (s: Screen) => void;
}

export function ContactScreen({ onNavigate }: ContactScreenProps) {
  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      <div className="bg-white border-b border-slate-100 p-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => onNavigate('profile')} className="p-1 -ml-1 text-slate-700 active:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Contact Us</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col items-center text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
            <MapPin size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Our Corporate Address</h2>
          <p className="text-slate-500">Patna, Bihar - 803212</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col items-center text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
            <Phone size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Call Support</h2>
          <p className="text-indigo-600 font-medium">+91 7004198258</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col items-center text-center shadow-sm">
          <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
            <Mail size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Official Email</h2>
          <p className="text-green-600 font-medium">examrootofficial@gmail.com</p>
        </div>
      </div>
    </div>
  );
}
