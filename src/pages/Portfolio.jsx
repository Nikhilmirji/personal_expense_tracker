import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../lib/utils';

export function Portfolio() {
  const { data } = useFinance();
  const holdings = data.investments.holdings;
  
  const totalInvested = holdings.reduce((acc, h) => acc + h.invested, 0);
  const totalCurrent = holdings.reduce((acc, h) => acc + h.current, 0);
  const overallReturns = ((totalCurrent - totalInvested) / totalInvested) * 100;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Investment Portfolio</h1>
        <p className="text-text-muted mt-1">Track your stocks and mutual funds.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl md:col-span-1 border-t-4 border-t-investment flex flex-col justify-center">
          <p className="text-text-muted text-sm">Portfolio Value</p>
          <h2 className="text-3xl font-bold mt-1">₹{totalCurrent.toLocaleString('en-IN')}</h2>
          <div className="flex items-center space-x-2 mt-4 text-sm">
            <span className={cn("px-2 py-1 rounded flex items-center font-medium", overallReturns >= 0 ? "bg-primary/20 text-primary" : "bg-expense/20 text-expense")}>
              {overallReturns >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
              {Math.abs(overallReturns).toFixed(2)}%
            </span>
            <span className="text-text-muted">Total Returns</span>
          </div>
        </div>
        
        <div className="glass p-6 rounded-2xl md:col-span-2">
          <h3 className="font-semibold mb-4">Your Holdings</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-muted bg-white/5">
                <tr>
                  <th className="px-4 py-2 rounded-tl-lg">Name</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2 text-right">Invested</th>
                  <th className="px-4 py-2 text-right">Current</th>
                  <th className="px-4 py-2 text-right rounded-tr-lg">Returns</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-medium">{h.name}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{h.type}</td>
                    <td className="px-4 py-3 text-right">₹{h.invested.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{h.current.toLocaleString('en-IN')}</td>
                    <td className={cn(
                      "px-4 py-3 text-right font-semibold",
                      h.returns >= 0 ? "text-primary" : "text-expense"
                    )}>
                      {h.returns > 0 ? '+' : ''}{h.returns}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
