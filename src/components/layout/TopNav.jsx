import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';

export function TopNav({ onMenuClick }) {
  return (
    <header className="h-20 border-b border-white/5 bg-surface/50 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button onClick={onMenuClick} className="md:hidden text-text-muted hover:text-text-main">
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden md:flex items-center space-x-2 bg-surface-light px-4 py-2 rounded-full border border-white/5">
          <Search className="w-4 h-4 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            className="bg-transparent border-none outline-none text-sm w-64 placeholder-text-muted"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
          <Bell className="w-5 h-5 text-text-muted" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        </button>
      </div>
    </header>
  );
}
