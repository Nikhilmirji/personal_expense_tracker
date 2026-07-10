import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { SummaryCard } from '../components/ui/SummaryCard';
import { Wallet, TrendingUp, CreditCard, PiggyBank } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { cn } from '../lib/utils';

export function Dashboard() {
  const { data } = useFinance();
  
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Good Evening, {data.user.name} 👋</h1>
        <p className="text-text-muted mt-1">Track where your money goes.</p>
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
          trend={12}
          colorClass="bg-investment/10 text-investment"
          delay={0.2}
        />
        <SummaryCard 
          title="Total Expenses" 
          amount={data.summary.totalExpenses} 
          icon={CreditCard} 
          trend={-5}
          colorClass="bg-expense/10 text-expense"
          delay={0.3}
        />
        <SummaryCard 
          title="Total Saved" 
          amount={data.summary.totalSaved} 
          icon={PiggyBank} 
          trend={8}
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
                    <p className="font-medium text-sm">{tx.description}</p>
                    <p className="text-xs text-text-muted">{tx.category}</p>
                  </div>
                </div>
                <div className={cn(
                  "font-semibold text-sm",
                  tx.type === 'Credit' ? 'text-primary' : 'text-text-main'
                )}>
                  {tx.type === 'Credit' ? '+' : '-'}₹{tx.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
