import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { mockData } from '../data/mockData';

const FinanceContext = createContext();

const DEFAULT_CATEGORIES = [
  "Life Infrastructure",
  "Lifestyle Enjoyment",
  "Performance & Growth",
  "Investments",
  "Miscellaneous"
];

const INITIAL_STATE = {
  user: {
    name: "",
    monthlyPocketMoney: 0,
  },
  summary: {
    totalInvested: 0,
    totalExpenses: 0,
    totalSaved: 0,
    remainingBalance: 0,
  },
  investments: {
    mutualFunds: 0,
    stocks: 0,
    holdings: []
  },
  transactions: [],
  savingsGoals: [],
  categories: DEFAULT_CATEGORIES,
  budgets: {
    "Life Infrastructure": 0,
    "Lifestyle Enjoyment": 0,
    "Performance & Growth": 0,
    "Investments": 0,
    "Miscellaneous": 0
  },
  learnedCategories: {}
};


export function FinanceProvider({ children }) {
  // Load initial state from local storage or fallback to INITIAL_STATE
  const [data, setData] = useState(() => {
    try {
      const stored = localStorage.getItem('moneymap_live_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure default categories and fields are present
        if (!parsed.categories) parsed.categories = DEFAULT_CATEGORIES;
        if (!parsed.budgets) parsed.budgets = INITIAL_STATE.budgets;
        if (!parsed.learnedCategories) parsed.learnedCategories = {};
        if (!parsed.investments) parsed.investments = INITIAL_STATE.investments;
        if (!parsed.savingsGoals) parsed.savingsGoals = INITIAL_STATE.savingsGoals;
        return parsed;
      }
    } catch (e) {
      console.error("Failed to load state from localStorage:", e);
    }
    return INITIAL_STATE;
  });

  // Debounced state save to localStorage
  useEffect(() => {
    const handler = setTimeout(() => {
      try {
        localStorage.setItem('moneymap_live_data', JSON.stringify(data));
      } catch (e) {
        console.error("Failed to save state to localStorage:", e);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [data]);

  // Operations
  const updateTransactions = (newTransactions) => {
    setData(prev => ({
      ...prev,
      transactions: [...newTransactions, ...prev.transactions]
    }));
  };

  const updateTransactionCategory = (id, newCategory) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.map(tx => 
        tx.id === id ? { ...tx, category: newCategory } : tx
      )
    }));
  };

  const addCategory = (categoryName) => {
    const name = categoryName.trim();
    if (!name) return;
    setData(prev => {
      if (prev.categories.includes(name)) return prev;
      return {
        ...prev,
        categories: [...prev.categories, name]
      };
    });
  };

  const updateBudgetLimit = (category, limit) => {
    setData(prev => ({
      ...prev,
      budgets: {
        ...prev.budgets,
        [category]: parseFloat(limit) || 0
      }
    }));
  };

  const updateLearnedCategory = (merchant, category) => {
    setData(prev => ({
      ...prev,
      learnedCategories: {
        ...prev.learnedCategories,
        [merchant.toLowerCase().trim()]: category
      }
    }));
  };

  const setMonthlyPocketMoney = (amount) => {
    setData(prev => ({
      ...prev,
      user: {
        ...prev.user,
        monthlyPocketMoney: parseFloat(amount) || 0
      }
    }));
  };

  const setUserName = (name) => {
    setData(prev => ({
      ...prev,
      user: {
        ...prev.user,
        name: name.trim()
      }
    }));
  };

  const addSavingsGoal = (goal) => {
    setData(prev => ({
      ...prev,
      savingsGoals: [...prev.savingsGoals, {
        id: Date.now(),
        name: goal.name,
        target: parseFloat(goal.target) || 0,
        saved: parseFloat(goal.saved) || 0
      }]
    }));
  };

  const allocateSavingsToGoal = (goalId, amount) => {
    setData(prev => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map(goal => 
        goal.id === goalId ? { ...goal, saved: goal.saved + (parseFloat(amount) || 0) } : goal
      )
    }));
  };

  const addHolding = (holding) => {
    setData(prev => {
      const holdings = prev.investments.holdings || [];
      return {
        ...prev,
        investments: {
          ...prev.investments,
          holdings: [...holdings, {
            id: Date.now(),
            name: holding.name,
            type: holding.type,
            invested: parseFloat(holding.invested) || 0,
            current: parseFloat(holding.current) || parseFloat(holding.invested) || 0,
            returns: parseFloat(holding.returns) || 0,
            qty: parseFloat(holding.qty) || null,
            avgPrice: parseFloat(holding.avgPrice) || null,
            symbol: holding.symbol || null,
            mfCode: holding.mfCode || null,
            sipAmount: parseFloat(holding.sipAmount) || null,
            startDate: holding.startDate || null,
            sipDates: holding.sipDates || null
          }]
        }
      };
    });
  };

  const deleteHolding = (id) => {
    setData(prev => ({
      ...prev,
      investments: {
        ...prev.investments,
        holdings: (prev.investments.holdings || []).filter(h => h.id !== id)
      }
    }));
  };

  const updateHoldingCurrentPrice = (id, currentPrice, currentVal, returnsVal) => {
    setData(prev => ({
      ...prev,
      investments: {
        ...prev.investments,
        holdings: (prev.investments.holdings || []).map(h => {
          if (h.id === id) {
            return {
              ...h,
              currentPrice: currentPrice,
              current: currentVal,
              returns: returnsVal
            };
          }
          return h;
        })
      }
    }));
  };

  // Reset to original mock data for debugging
  const resetToDefault = () => {
    setData(INITIAL_STATE);
  };

  const computedData = useMemo(() => {
    // Dynamic calculations
    const expensesTx = data.transactions.filter(tx => tx.type === 'Debit' && tx.category !== 'Investments');
    const totalExpenses = expensesTx.reduce((acc, tx) => acc + parseFloat(tx.amount), 0);
    
    const holdings = data.investments.holdings || [];
    const totalInvested = holdings.reduce((acc, h) => acc + (parseFloat(h.invested) || 0), 0);
    const totalCurrentHoldings = holdings.reduce((acc, h) => acc + (parseFloat(h.current) || 0), 0);
    
    // Total income/pocket money received (sum of Credit txs + monthlyPocketMoney received)
    const incomeTx = data.transactions.filter(tx => tx.type === 'Credit');
    const totalIncome = incomeTx.reduce((acc, tx) => acc + parseFloat(tx.amount), 0) || data.user.monthlyPocketMoney;

    const remainingBalance = totalIncome - totalExpenses - totalInvested;
    const totalSaved = remainingBalance > 0 ? remainingBalance : 0;
    
    const summary = {
      totalInvested: totalCurrentHoldings || totalInvested,
      totalExpenses,
      totalSaved: totalIncome - totalExpenses - totalInvested,
      remainingBalance,
    };

    const categoryMap = {};
    data.transactions.forEach(tx => {
      if (tx.type === 'Debit') {
        categoryMap[tx.category] = (categoryMap[tx.category] || 0) + parseFloat(tx.amount);
      }
    });
    
    const categoryBreakdown = Object.keys(categoryMap).map(key => ({
      name: key,
      value: categoryMap[key]
    })).sort((a, b) => b.value - a.value);

    const trendMap = {};
    expensesTx.forEach(tx => {
      // Parse dates: either YYYY-MM-DD or DD MMM, YYYY
      let day = '1';
      if (tx.date.includes('-')) {
        const dateParts = tx.date.split('-');
        day = dateParts.length > 2 ? String(parseInt(dateParts[2])) : tx.date;
      } else {
        const dayMatch = tx.date.match(/^(\d{2})\s+[A-Za-z]/);
        if (dayMatch) day = String(parseInt(dayMatch[1]));
      }
      trendMap[day] = (trendMap[day] || 0) + parseFloat(tx.amount);
    });
    
    let spendingTrend = Object.keys(trendMap)
      .sort((a,b) => parseInt(a) - parseInt(b))
      .map(day => ({
        day: day,
        amount: trendMap[day]
      }));

    if (spendingTrend.length === 0) {
      spendingTrend = [{ day: "1", amount: 0 }];
    }

    const monthlyMap = {};
    expensesTx.forEach(tx => {
      let month = 'Unknown';
      if (tx.date.includes('-')) {
        const parts = tx.date.split('-');
        if (parts.length >= 2) month = `${parts[0]}-${parts[1]}`;
      } else {
        const parts = tx.date.split(' ');
        if (parts.length >= 2) {
          // e.g. "01 Apr, 2026"
          const yr = parts[2] ? parts[2] : new Date().getFullYear();
          month = `${yr}-${parts[1].substring(0,3)}`;
        }
      }
      monthlyMap[month] = (monthlyMap[month] || 0) + parseFloat(tx.amount);
    });

    const monthlySpending = Object.keys(monthlyMap).map(m => ({
      month: m,
      spent: monthlyMap[m],
      limit: data.user.monthlyPocketMoney
    })).sort((a,b) => a.month.localeCompare(b.month));

    return {
      ...data,
      summary,
      analytics: {
        categoryBreakdown: categoryBreakdown.length > 0 ? categoryBreakdown : [{ name: "No Data", value: 0 }],
        spendingTrend,
        monthlySpending
      }
    };
  }, [data]);

  return (
    <FinanceContext.Provider value={{ 
      data: computedData, 
      updateTransactions, 
      updateTransactionCategory,
      addCategory,
      updateBudgetLimit,
      updateLearnedCategory,
      setMonthlyPocketMoney,
      setUserName,
      addSavingsGoal,
      allocateSavingsToGoal,
      addHolding,
      deleteHolding,
      updateHoldingCurrentPrice,
      resetToDefault
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}

