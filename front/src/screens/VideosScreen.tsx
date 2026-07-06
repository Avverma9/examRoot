import React from 'react';
import { User } from 'lucide-react';
import { Screen } from '../types';
import { videoLectures } from '../data';

interface VideosScreenProps {
  onNavigate: (s: Screen) => void;
}

export function VideosScreen({ onNavigate }: VideosScreenProps) {
  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className="bg-indigo-600 text-white p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold">Video Lectures</h1>
        <button onClick={() => onNavigate('profile')} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30">
          <User size={20} className="text-white" />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {videoLectures.map((video) => (
          <div key={video.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="relative aspect-video bg-slate-200">
              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="w-14 h-14 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/50">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-white ml-1" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                {video.duration}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-slate-900 leading-tight mb-1">{video.title}</h3>
              <p className="text-xs text-slate-500">
                {video.category} • {video.views.toLocaleString()} Views
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
