import React from 'react';
import { Lightbulb, Zap, TrendingDown, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export function Insights() {
  const insights = [
    {
      title: "Potential Savings Identified",
      description: "You've been ordering food 3 times a week. Cutting this down to once a week could save you ₹1,200 monthly.",
      icon: TrendingDown,
      color: "text-primary",
      bg: "bg-primary/10",
      action: "Set Food Budget"
    },
    {
      title: "Investment Milestone Near",
      description: "You are only ₹2,000 away from reaching ₹10,000 in your Emergency Fund. Consider routing this month's savings here.",
      icon: Target,
      color: "text-secondary",
      bg: "bg-secondary/10",
      action: "View Goals"
    },
    {
      title: "High Subscription Cost",
      description: "You have 3 active entertainment subscriptions taking up 8% of your pocket money. Are you using all of them?",
      icon: Zap,
      color: "text-expense",
      bg: "bg-expense/10",
      action: "Review Subscriptions"
    }
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent inline-block">Smart Insights</h1>
        <p className="text-text-muted mt-1">AI-powered suggestions to improve your financial health.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {insights.map((insight, i) => {
          const Icon = insight.icon;
          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              key={i} 
              className="glass p-6 rounded-2xl hover:border-white/10 transition-colors flex flex-col h-full"
            >
              <div className="flex items-start space-x-4 mb-4">
                <div className={`p-3 rounded-xl ${insight.bg} ${insight.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg leading-tight mt-1">{insight.title}</h3>
              </div>
              <p className="text-text-muted text-sm flex-1">{insight.description}</p>
              
              <button className="mt-6 w-full py-2.5 bg-surface-light hover:bg-white/5 border border-white/5 rounded-xl text-sm font-medium transition-colors">
                {insight.action}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
