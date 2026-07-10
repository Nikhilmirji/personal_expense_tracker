import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, PieChart, TrendingUp, PiggyBank, Lightbulb, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Pocket Money', path: '/pocket-money', icon: Wallet },
  { name: 'Expenses', path: '/expenses', icon: Activity },
  { name: 'Analytics', path: '/analytics', icon: PieChart },
  { name: 'Portfolio', path: '/portfolio', icon: TrendingUp },
  { name: 'Savings', path: '/savings', icon: PiggyBank },
  { name: 'Insights', path: '/insights', icon: Lightbulb },
];

export function Sidebar() {
  return (
    <div className="w-64 h-screen border-r border-white/5 bg-surface-light flex flex-col hidden md:flex sticky top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          MoneyMap
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-text-muted hover:bg-white/5 hover:text-text-main"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
      
      <div className="p-6 border-t border-white/5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-background font-bold">
            N
          </div>
          <div>
            <p className="text-sm font-medium">Nikhil Mirji</p>
            <p className="text-xs text-text-muted">Pro Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
