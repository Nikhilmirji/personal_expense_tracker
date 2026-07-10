import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function SummaryCard({ title, amount, icon: Icon, trend, colorClass, delay = 0 }) {
  // Extract just the background class for the blob, fallback if needed
  const blobColorClass = colorClass.split(' ').find(c => c.startsWith('bg-'))?.replace('/10', '') || 'bg-primary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass p-6 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-colors"
    >
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <p className="text-text-muted text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold mt-1">₹{amount.toLocaleString('en-IN')}</h3>
        </div>
        <div className={cn("p-3 rounded-xl", colorClass)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center space-x-2 text-sm relative z-10">
          <span className={cn("font-medium", trend > 0 ? "text-primary" : "text-expense")}>
            {trend > 0 ? "+" : ""}{trend}%
          </span>
          <span className="text-text-muted">vs last month</span>
        </div>
      )}
      
      {/* Decorative gradient blob */}
      <div className={cn("absolute -bottom-10 -right-10 w-32 h-32 blur-3xl opacity-20 group-hover:opacity-30 transition-opacity", blobColorClass)} />
    </motion.div>
  );
}
