import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export function Analytics() {
  const { data } = useFinance();

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Monthly Analytics</h1>
          <p className="text-text-muted mt-1">Deep dive into your spending habits.</p>
        </div>
        <div className="glass px-6 py-4 rounded-xl border-l-4 border-l-primary flex items-center space-x-4">
          <div>
            <p className="text-xs text-text-muted">Financial Health Score</p>
            <p className="text-2xl font-bold text-primary">85<span className="text-sm text-text-muted">/100</span></p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-6">Category Breakdown</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.analytics.categoryBreakdown} layout="vertical" margin={{ left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: '#1e1e1e', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#60a5fa" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-2">Smart Insights</h3>
            <ul className="space-y-4 mt-4 text-sm">
              <li className="flex items-start space-x-3">
                <span className="w-2 h-2 rounded-full bg-expense mt-1.5 flex-shrink-0" />
                <span>You spend most during weekends. Consider planning meals to avoid Swiggy.</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="w-2 h-2 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                <span>Lifestyle spending can be reduced by ₹700/month if you cut 1 premium subscription.</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <span>Your investment consistency is excellent. You've invested for 5 consecutive months.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl mt-6">
        <h3 className="text-lg font-semibold mb-6">Spend vs Limit Tracker</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.analytics.monthlySpending || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                contentStyle={{ backgroundColor: '#1e1e1e', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="spent" name="Spent" fill="#f87171" radius={[4, 4, 0, 0]} />
              <Bar dataKey="limit" name="Spend Limit" fill="#4ade80" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
