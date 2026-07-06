import React from 'react';
import { Home, FileText, BookOpen, PlayCircle, Layers, User } from 'lucide-react';
import { Screen } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  const navItems: { id: Screen; label: string; icon: React.FC<any> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'mock', label: 'Mock Test', icon: FileText },
    { id: 'practice', label: 'Practice', icon: BookOpen },
    { id: 'videos', label: 'Videos', icon: PlayCircle },
    { id: 'testSeries', label: 'Test Series', icon: Layers },
  ];

  return (
    <div className="absolute bottom-0 w-full bg-white border-t border-slate-100 flex justify-between items-center px-4 py-3 pb-safe z-50">
      {navItems.map((item) => {
        const isActive = currentScreen === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 min-w-[50px] transition-colors duration-200 ${
              isActive ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <Icon size={22} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
