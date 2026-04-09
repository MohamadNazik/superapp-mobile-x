
import React from 'react';
import { cn } from '../utils/cn';
import { Calendar as CalendarIcon, LayoutGrid, Shield, ClipboardCheck } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header = ({ title, subtitle }: HeaderProps) => (
  <header className="fixed top-0 left-0 right-0 h-[68px] bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 flex items-center animate-in fade-in z-50 max-w-md mx-auto">
    <div className="flex flex-col justify-center">
      <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">{title}</h1>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
    </div>
  </header>
);

interface BottomNavProps {
  activeTab: string;
  onTabChange: (t: string) => void;
  showAdmin: boolean;
}

export const BottomNav = ({ activeTab, onTabChange, showAdmin }: BottomNavProps) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 pb-safe pt-2 px-6 flex justify-around items-end h-[80px] z-40">
    <button
      onClick={() => onTabChange('calendar')}
      className={cn("flex flex-col items-center pb-4 w-16 transition-colors", activeTab === 'calendar' ? "text-primary-600" : "text-slate-400 hover:text-slate-600")}
    >
      <CalendarIcon size={24} className="mb-1" />
      <span className="text-[10px] font-medium">Schedule</span>
    </button>

    <button
      onClick={() => onTabChange('catalog')}
      className={cn("flex flex-col items-center pb-4 w-16 transition-colors", activeTab === 'catalog' ? "text-primary-600" : "text-slate-400 hover:text-slate-600")}
    >
      <LayoutGrid size={24} className="mb-1" />
      <span className="text-[10px] font-medium">Book</span>
    </button>

    {showAdmin ? (
      <button
        onClick={() => onTabChange('admin')}
        className={cn("flex flex-col items-center pb-4 w-16 transition-colors", activeTab === 'admin' ? "text-primary-600" : "text-slate-400 hover:text-slate-600")}
      >
        <Shield size={24} className="mb-1" />
        <span className="text-[10px] font-medium">Admin</span>
      </button>
    ) : (
      <button
        onClick={() => onTabChange('manage')}
        className={cn("flex flex-col items-center pb-4 w-16 transition-colors", activeTab === 'manage' ? "text-primary-600" : "text-slate-400 hover:text-slate-600")}
      >
        <ClipboardCheck size={24} className="mb-1" />
        <span className="text-[10px] font-medium">Manage</span>
      </button>
    )}


  </nav>
);
