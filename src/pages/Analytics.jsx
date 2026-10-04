import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Edit3, AlertTriangle, ShieldCheck, TrendingUp, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export function Analytics() {
  const { data, updateBudgetLimit } = useFinance();
  const [editingCategory, setEditingCategory] = useState(null);
  const [newLimitVal, setNewLimitVal] = useState('');

  // 1. Calculate Dynamic Financial Health Score
  // Score = Savings Rate (Saved / Income) * 100 + bonus points for investments, capped at 100
  const totalIncome = data.transactions.filter(tx => tx.type === 'Credit').reduce((acc, tx) => acc + tx.amount, 0) || data.user.monthlyPocketMoney;
  const totalSaved = data.summary.totalSaved || 0;
  const totalExpenses = data.summary.totalExpenses || 0;
  const totalInvested = data.summary.totalInvested || 0;

  const savingsRate = totalIncome > 0 ? (totalSaved / totalIncome) * 100 : 0;
  const investmentRate = totalIncome > 0 ? (totalInvested / totalIncome) * 100 : 0;

  // Real formula: Health score starts at 50, goes up with savings rate & investment consistency, goes down if expenses > income
  let healthScore = 50;
  if (totalIncome > 0) {
    healthScore = Math.round(
      Math.min(100, Math.max(10, 50 + (savingsRate * 0.6) + (investmentRate * 0.8) - (totalExpenses > totalIncome ? 25 : 0)))
    );
  }

  const handleEditBudget = (category) => {
    setEditingCategory(category);
    setNewLimitVal(data.budgets?.[category] || '0');
  };

  const handleSaveBudget = (e) => {
    e.preventDefault();
    if (!editingCategory) return;
    updateBudgetLimit(editingCategory, parseFloat(newLimitVal) || 0);
    setEditingCategory(null);
    setNewLimitVal('');
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financial Analytics</h1>
          <p className="text-text-muted mt-1">Deep dive into category budgets, savings rates, and financial health.</p>
        </div>
        
        {/* Dynamic Financial Health Score Card */}
        <div className="glass px-6 py-4 rounded-xl border-l-4 border-l-primary flex items-center space-x-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Financial Health Score</p>
            <p className="text-2xl font-bold text-primary">
              {healthScore}
              <span className="text-xs text-text-muted font-normal ml-1">/100</span>
            </p>
          </div>
        </div>
      </header>

      {/* Row 1: Charts and Budgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Category Breakdown chart */}
        <div className="glass p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-6">Spending Category Breakdown</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.analytics.categoryBreakdown} layout="vertical" margin={{ left: 30, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={120} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.03)'}}
                    contentStyle={{ backgroundColor: '#1e1e1e', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#f8fafc' }}
                    formatter={(val) => `₹${val.toLocaleString('en-IN')}`}
                  />
                  <Bar dataKey="value" name="Amount Spent" fill="#818cf8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="border-t border-white/5 pt-4 mt-4 grid grid-cols-2 gap-4 text-xs text-text-muted">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span>Savings Rate: <strong>{savingsRate.toFixed(0)}%</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              <span>Investment Rate: <strong>{investmentRate.toFixed(0)}%</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column: Budgets Manager */}
        <div className="glass p-6 rounded-2xl space-y-6">
          <h3 className="text-lg font-semibold text-text-main">Custom Category Budgets</h3>
          
          <div className="space-y-5">
            {data.categories.filter(cat => cat !== 'Investments').map(category => {
              // Find actual spending
              const actualMatch = data.analytics.categoryBreakdown.find(b => b.name === category);
              const actual = actualMatch ? actualMatch.value : 0;
              const limit = data.budgets?.[category] || 0;
              const pct = limit > 0 ? (actual / limit) * 100 : 0;
              const isOver = limit > 0 && actual > limit;

              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-semibold text-text-main">{category}</span>
                      {isOver && (
                        <span className="ml-2 inline-flex items-center text-[10px] text-expense font-bold bg-expense/10 px-1.5 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3 mr-0.5" /> Overspent
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-text-muted">₹{actual.toLocaleString('en-IN')} / </span>
                      <span className="font-bold text-text-main">₹{limit.toLocaleString('en-IN')}</span>
                      <button 
                        onClick={() => handleEditBudget(category)}
                        className="text-primary hover:text-primary/80 p-0.5 rounded hover:bg-white/5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="w-full h-2.5 bg-surface-light rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        pct >= 100 ? "bg-expense" : pct >= 75 ? "bg-amber-400" : "bg-primary"
                      )}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-xs text-text-muted flex items-start space-x-2">
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <span>Investment budget is dynamically updated via the **Portfolio holdings** module. Set category budgets to match your target allocations.</span>
          </div>
        </div>
      </div>

      {/* Row 2: Spend vs Limit Tracker */}
      <div className="glass p-6 rounded-2xl">
        <h3 className="text-lg font-semibold mb-6">Monthly Spend vs Limit Tracker</h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.analytics.monthlySpending || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.03)'}}
                contentStyle={{ backgroundColor: '#1e1e1e', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#f8fafc' }}
                formatter={(val) => `₹${val.toLocaleString('en-IN')}`}
              />
              <Legend />
              <Bar dataKey="spent" name="Actual Spent" fill="#f87171" radius={[4, 4, 0, 0]} />
              <Bar dataKey="limit" name="Spend Limit" fill="#4ade80" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Edit Budget Limit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="glass max-w-sm w-full rounded-3xl p-6 border border-white/10 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-bold text-text-main">Edit Category Budget</h3>
              <p className="text-xs text-text-muted mt-1">Configure budget limit for **{editingCategory}**.</p>
            </div>
            
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="text-xs text-text-muted font-semibold block mb-1.5">Monthly Budget Limit (₹)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 5000"
                  value={newLimitVal}
                  onChange={e => setNewLimitVal(e.target.value)}
                  required
                  className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 outline-none"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-primary text-background hover:bg-primary/95 rounded-xl text-sm font-semibold transition-colors"
                >
                  Save Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
