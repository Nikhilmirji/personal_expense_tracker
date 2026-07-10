import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

export function PocketMoney() {
  const { data } = useFinance();
  
  const breakdownData = [
    { name: 'Investments', value: data.summary.totalInvested, color: '#818cf8' },
    { name: 'Expenses', value: data.summary.totalExpenses, color: '#f87171' },
    { name: 'Saved', value: data.summary.totalSaved, color: '#4ade80' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Pocket Money Flow</h1>
        <p className="text-text-muted mt-1">₹{data.user.monthlyPocketMoney.toLocaleString('en-IN')} monthly budget breakdown.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl flex flex-col items-center justify-center relative">
          <h3 className="text-lg font-semibold w-full text-left mb-4">Distribution</h3>
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {breakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e1e1e', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
              <span className="text-text-muted text-sm">Total</span>
              <span className="text-2xl font-bold">₹{data.user.monthlyPocketMoney}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {breakdownData.map((item, i) => (
            <motion.div 
              key={item.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <div className="w-4 h-12 rounded-full" style={{ backgroundColor: item.color }} />
                <div>
                  <p className="text-text-muted text-sm">{item.name}</p>
                  <p className="text-xl font-bold">₹{item.value.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">{((item.value / data.user.monthlyPocketMoney) * 100).toFixed(0)}%</p>
                <p className="text-xs text-text-muted">of total</p>
              </div>
            </motion.div>
          ))}
          
          <div className="glass p-6 rounded-2xl border-l-4 border-l-primary bg-primary/5">
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-6 h-6 text-primary mt-1" />
              <div>
                <h4 className="font-semibold text-primary">Great Job!</h4>
                <p className="text-sm text-text-muted mt-1">56% of your monthly pocket money goes into investments. You are building a strong future.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
