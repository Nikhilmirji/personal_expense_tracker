import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FinanceProvider } from './context/FinanceContext';
import { AnimatedLayout } from './components/layout/AnimatedLayout';
import { Dashboard } from './pages/Dashboard';
import { PocketMoney } from './pages/PocketMoney';
import { Expenses } from './pages/Expenses';
import { Analytics } from './pages/Analytics';
import { Portfolio } from './pages/Portfolio';
import { Savings } from './pages/Savings';
import { Insights } from './pages/Insights';

function App() {
  return (
    <FinanceProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AnimatedLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="pocket-money" element={<PocketMoney />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="savings" element={<Savings />} />
            <Route path="insights" element={<Insights />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FinanceProvider>
  );
}

export default App;
