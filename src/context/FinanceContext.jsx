import React, { createContext, useContext, useState, useMemo } from 'react';
import { mockData } from '../data/mockData';

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const [data, setData] = useState(mockData);

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

  const computedData = useMemo(() => {
    const expensesTx = data.transactions.filter(tx => tx.type === 'Debit' && tx.category !== 'Investments');
    const totalExpenses = expensesTx.reduce((acc, tx) => acc + parseFloat(tx.amount), 0);
    
    const investmentTx = data.transactions.filter(tx => tx.type === 'Debit' && tx.category === 'Investments');
    const totalInvested = investmentTx.reduce((acc, tx) => acc + parseFloat(tx.amount), 0) || data.summary.totalInvested;
    
    const summary = {
      totalInvested,
      totalExpenses,
      totalSaved: data.user.monthlyPocketMoney - totalExpenses - totalInvested,
      remainingBalance: data.user.monthlyPocketMoney - totalExpenses - totalInvested,
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
      const dateParts = tx.date.split('-');
      const day = dateParts.length > 2 ? dateParts[2] : tx.date; 
      trendMap[day] = (trendMap[day] || 0) + parseFloat(tx.amount);
    });
    
    let spendingTrend = Object.keys(trendMap)
      .sort()
      .map(day => ({
        day: day,
        amount: trendMap[day]
      }));

    if (spendingTrend.length === 0) {
      spendingTrend = data.analytics.spendingTrend; 
    }

    const monthlyMap = {};
    expensesTx.forEach(tx => {
      let month = 'Unknown';
      if (tx.date.includes('-')) {
        const parts = tx.date.split('-');
        if (parts.length >= 2) month = `${parts[0]}-${parts[1]}`;
      } else {
        const parts = tx.date.split(' ');
        if (parts.length >= 2) month = parts[1];
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
        categoryBreakdown: categoryBreakdown.length > 0 ? categoryBreakdown : data.analytics.categoryBreakdown,
        spendingTrend,
        monthlySpending
      }
    };
  }, [data]);

  return (
    <FinanceContext.Provider value={{ data: computedData, updateTransactions, updateTransactionCategory }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}
