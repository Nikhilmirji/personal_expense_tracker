import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { Target, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export function Savings() {
  const { data } = useFinance();

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Savings Goals</h1>
          <p className="text-text-muted mt-1">Track progress for your dreams.</p>
        </div>
        <button className="px-4 py-2 bg-primary text-background font-semibold rounded-xl flex items-center hover:bg-primary/90 transition-colors">
          <Plus className="w-5 h-5 mr-1" />
          Add Goal
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {data.savingsGoals.map((goal, i) => {
          const progress = (goal.saved / goal.target) * 100;
          return (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              key={goal.id} 
              className="glass p-6 rounded-2xl relative overflow-hidden group"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-semibold text-lg">{goal.name}</h3>
                  <p className="text-text-muted text-sm mt-1">₹{goal.saved.toLocaleString('en-IN')} / ₹{goal.target.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Target className="w-6 h-6" />
                </div>
              </div>

              <div className="w-full h-2 bg-surface-light rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 + 0.2 }}
                  className="h-full bg-primary rounded-full relative"
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                </motion.div>
              </div>
              <div className="mt-2 text-right">
                <span className="text-sm font-bold">{progress.toFixed(0)}%</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
