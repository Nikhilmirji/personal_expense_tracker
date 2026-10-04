import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { SummaryCard } from '../components/ui/SummaryCard';
import { Wallet, TrendingUp, CreditCard, PiggyBank, Edit3, X } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export function Dashboard() {
  const { data, setUserName, setMonthlyPocketMoney } = useFinance();
  const [setupForm, setSetupForm] = useState({ name: '', budget: '' });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ name: data.user.name || '', budget: data.user.monthlyPocketMoney || 0 });

  // Calculate dynamic trends
  const holdings = data.investments.holdings || [];
  const totalInvested = holdings.reduce((acc, h) => acc + (h.invested || 0), 0);
  const totalCurrent = holdings.reduce((acc, h) => acc + (h.current || 0), 0);
  const investmentTrend = totalInvested > 0 ? parseFloat((((totalCurrent - totalInvested) / totalInvested) * 100).toFixed(1)) : undefined;

  const monthlySpending = data.analytics.monthlySpending || [];
  let expenseTrend = undefined;
  if (monthlySpending.length >= 2) {
    const currentSpent = monthlySpending[monthlySpending.length - 1].spent;
    const prevSpent = monthlySpending[monthlySpending.length - 2].spent;
    if (prevSpent > 0) {
      expenseTrend = parseFloat((((currentSpent - prevSpent) / prevSpent) * 100).toFixed(1));
    }
  }

  const handleSetupSubmit = (e) => {
    e.preventDefault();
    if (!setupForm.name || !setupForm.budget) return;
    setUserName(setupForm.name);
    setMonthlyPocketMoney(parseFloat(setupForm.budget) || 0);
  };

  const handleSettingsSubmit = (e) => {
    e.preventDefault();
    setUserName(settingsForm.name);
    setMonthlyPocketMoney(parseFloat(settingsForm.budget) || 0);
    setShowSettingsModal(false);
  };

  if (!data.user.name) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-8 rounded-3xl max-w-md w-full space-y-6 border border-primary/20"
        >
          <div className="text-center">
            <h2 className="text-2xl font-black text-primary">Welcome to MoneyMap</h2>
            <p className="text-sm text-text-muted mt-2">Let's set up your profile and budget to get started.</p>
          </div>
          <form onSubmit={handleSetupSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-text-muted font-semibold block mb-1.5 font-medium">Your Name</label>
              <input 
                type="text" 
                placeholder="e.g. Nikhil"
                value={setupForm.name}
                onChange={e => setSetupForm({...setupForm, name: e.target.value})}
                required
                className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 outline-none text-text-main"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted font-semibold block mb-1.5 font-medium">Monthly Pocket Money / Budget (₹)</label>
              <input 
                type="number" 
                placeholder="e.g. 5000"
                value={setupForm.budget}
                onChange={e => setSetupForm({...setupForm, budget: e.target.value})}
                required
                className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 outline-none text-text-main"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-3 bg-primary text-background font-semibold rounded-xl text-sm hover:bg-primary/95 transition-all shadow-lg shadow-primary/20"
            >
              Get Started
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Good Evening, {data.user.name} 👋
            <button 
              onClick={() => {
                setSettingsForm({ name: data.user.name, budget: data.user.monthlyPocketMoney });
                setShowSettingsModal(true);
              }}
              className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-main transition-colors"
              title="Edit Profile Settings"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </h1>
          <p className="text-text-muted mt-1">Track where your money goes.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="Pocket Money" 
          amount={data.user.monthlyPocketMoney} 
          icon={Wallet} 
          colorClass="bg-secondary/10 text-secondary"
          delay={0.1}
        />
        <SummaryCard 
          title="Total Invested" 
          amount={data.summary.totalInvested} 
          icon={TrendingUp} 
          trend={investmentTrend}
          colorClass="bg-investment/10 text-investment"
          delay={0.2}
        />
        <SummaryCard 
          title="Total Expenses" 
          amount={data.summary.totalExpenses} 
          icon={CreditCard} 
          trend={expenseTrend}
          colorClass="bg-expense/10 text-expense"
          delay={0.3}
        />
        <SummaryCard 
          title="Total Saved" 
          amount={data.summary.totalSaved} 
          icon={PiggyBank} 
          trend={undefined}
          colorClass="bg-primary/10 text-primary"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl lg:col-span-2">
          <h3 className="text-lg font-semibold mb-6">Spending Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.analytics.spendingTrend}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e1e1e', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#f87171" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-6">Recent Transactions</h3>
          <div className="space-y-4">
            {data.transactions.slice(0, 4).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    tx.type === 'Credit' ? 'bg-primary/10 text-primary' : 'bg-expense/10 text-expense'
                  )}>
                    {tx.type === 'Credit' ? <TrendingUp className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-text-main">{tx.description}</p>
                    <p className="text-xs text-text-muted">{tx.category}</p>
                  </div>
                </div>
                <div className={cn(
                  "font-semibold text-sm",
                  tx.type === 'Credit' ? 'text-primary' : 'text-text-main'
                )}>
                  {tx.type === 'Credit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
            {data.transactions.length === 0 && (
              <div className="text-center py-12 text-sm text-text-muted">
                No recent transactions. Upload a statement in Expenses to begin.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile/Budget Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="glass max-w-sm w-full rounded-3xl p-6 border border-white/10 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-text-main">Edit Profile Settings</h3>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-text-muted hover:text-text-main p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-text-muted font-semibold block mb-1.5">Profile Name</label>
                <input 
                  type="text" 
                  value={settingsForm.name}
                  onChange={e => setSettingsForm({...settingsForm, name: e.target.value})}
                  required
                  className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 outline-none text-text-main"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted font-semibold block mb-1.5">Monthly Pocket Money / Budget (₹)</label>
                <input 
                  type="number" 
                  value={settingsForm.budget}
                  onChange={e => setSettingsForm({...settingsForm, budget: e.target.value})}
                  required
                  className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 outline-none text-text-main"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-primary text-background hover:bg-primary/95 rounded-xl text-sm font-semibold transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
