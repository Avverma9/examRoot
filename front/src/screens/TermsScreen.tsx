import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Screen } from '../types';

interface TermsScreenProps {
  onNavigate: (s: Screen) => void;
}

export function TermsScreen({ onNavigate }: TermsScreenProps) {
  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className="bg-white border-b border-slate-100 p-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => onNavigate('settings')} className="p-1 -ml-1 text-slate-700 active:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Terms of Service</h1>
      </div>

      <div className="p-5 text-sm text-slate-600 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">1. Introduction</h2>
        <p>Welcome to ExamRoot. By accessing or using our mobile application, you agree to be bound by these Terms of Service.</p>
        
        <h2 className="text-lg font-bold text-slate-900">2. User Accounts</h2>
        <p>You must create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials.</p>
        
        <h2 className="text-lg font-bold text-slate-900">3. Paid Content</h2>
        <p>Some test series and video lectures require payment. All payments are final and non-refundable unless stated otherwise.</p>
        
        <h2 className="text-lg font-bold text-slate-900">4. Intellectual Property</h2>
        <p>All content on this app, including text, graphics, and video, is the property of ExamRoot and is protected by copyright laws.</p>
      </div>
    </div>
  );
}
