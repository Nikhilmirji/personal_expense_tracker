import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { Lightbulb, Zap, TrendingDown, Target, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export function Insights() {
  const { data } = useFinance();
  const holdings = data.investments.holdings || [];
  const transactions = data.transactions || [];
  
  const totalIncome = transactions.filter(tx => tx.type === 'Credit').reduce((acc, tx) => acc + tx.amount, 0) || data.user.monthlyPocketMoney;
  const totalExpenses = data.summary.totalExpenses || 0;
  const totalCurrentHoldings = holdings.reduce((acc, h) => acc + h.current, 0);

  // Dynamic Insight 1: Swiggy/Zomato Delivery Check
  const foodTxs = transactions.filter(t => 
    t.description.toLowerCase().includes('swiggy') || 
    t.description.toLowerCase().includes('zomato') ||
    t.description.toLowerCase().includes('food')
  );
  const foodSpent = foodTxs.reduce((acc, t) => acc + t.amount, 0);
  const foodPct = totalIncome > 0 ? (foodSpent / totalIncome) * 100 : 0;
  
  // Dynamic Insight 2: Diversification Check
  let maxHolding = null;
  let maxHoldingPct = 0;
  if (holdings.length > 0 && totalCurrentHoldings > 0) {
    const maxVal = Math.max(...holdings.map(h => h.current));
    maxHolding = holdings.find(h => h.current === maxVal);
    maxHoldingPct = (maxVal / totalCurrentHoldings) * 100;
  }

  // Dynamic Insight 3: Emergency Fund check
  const emergencyGoal = data.savingsGoals.find(g => g.name.toLowerCase().includes('emergency'));
  const emergencySaved = emergencyGoal ? emergencyGoal.saved : 0;
  const emergencyTarget = emergencyGoal ? emergencyGoal.target : 20000;
  const coverageMonths = totalExpenses > 0 ? (emergencySaved / totalExpenses) : 0;

  // Compile insights list dynamically
  const insights = [];

  if (foodSpent > 0) {
    insights.push({
      title: "Potential Savings Identified",
      description: `Based on your statement, you spent ₹${foodSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${foodPct.toFixed(0)}% of monthly budget) on food deliveries (Swiggy/Zomato). Preparing meals twice per week could save you ~₹${(foodSpent * 0.4).toFixed(0)} monthly.`,
      icon: TrendingDown,
      color: "text-expense",
      bg: "bg-expense/10",
      action: "Review Food Budget"
    });
  } else {
    insights.push({
      title: "Healthy Spending Pattern",
      description: `Excellent budget control! No Swiggy or Zomato deliveries detected in your statement. Keep cooking at home to maintain a high savings rate.`,
      icon: TrendingDown,
      color: "text-primary",
      bg: "bg-primary/10",
      action: "View Monthly Stats"
    });
  }

  if (maxHoldingPct > 40 && maxHolding) {
    insights.push({
      title: "Portfolio Concentration Risk",
      description: `You have ${maxHoldingPct.toFixed(0)}% of your investment portfolio concentrated in a single asset (${maxHolding.name}). This represents a high diversification risk. Consider reallocating.`,
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      action: "Rebalance Assets"
    });
  } else if (holdings.length > 0) {
    insights.push({
      title: "Diversified Investments",
      description: `Your portfolio is well-diversified. No single asset exceeds 40% of your total holding value. Excellent risk mitigation!`,
      icon: Zap,
      color: "text-primary",
      bg: "bg-primary/10",
      action: "View Holdings"
    });
  }

  if (coverageMonths < 6) {
    const recommendedTarget = totalExpenses > 0 ? totalExpenses * 6 : emergencyTarget;
    insights.push({
      title: "Emergency Fund Gap",
      description: `Your emergency savings (₹${emergencySaved.toLocaleString()}) cover only ${coverageMonths.toFixed(1)} months of monthly expenses. Standard guideline is 6 months (₹${recommendedTarget.toLocaleString('en-IN', { maximumFractionDigits: 0 })}).`,
      icon: Target,
      color: "text-secondary",
      bg: "bg-secondary/10",
      action: "Add to Emergency Fund"
    });
  } else {
    insights.push({
      title: "Emergency Cushion Secure",
      description: `Congratulations! Your emergency savings cover ${coverageMonths.toFixed(1)} months of expenses. You have a solid safety net in place.`,
      icon: Target,
      color: "text-primary",
      bg: "bg-primary/10",
      action: "View Savings Goals"
    });
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent inline-block">Smart Insights</h1>
        <p className="text-text-muted mt-1">Real-time advisory reports computed directly from your accounts.</p>
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
              className="glass p-6 rounded-2xl hover:border-white/10 transition-colors flex flex-col h-full justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${insight.bg} ${insight.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg leading-tight mt-1">{insight.title}</h3>
                </div>
                <p className="text-text-muted text-sm leading-relaxed">{insight.description}</p>
              </div>
              
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
