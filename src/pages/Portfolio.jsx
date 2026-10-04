import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { TrendingUp, Plus, Trash2, ArrowUpRight, ArrowDownRight, Loader2, Info, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

// Simple in-memory cache to prevent excessive API rate-limiting
// Format: { [key]: { timestamp, data } }
const apiCache = {};
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const fetchWithCache = async (url) => {
  const now = Date.now();
  if (apiCache[url] && (now - apiCache[url].timestamp < CACHE_DURATION_MS)) {
    return apiCache[url].data;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const data = await res.json();
  apiCache[url] = { timestamp: now, data };
  return data;
};

const findClosestNav = (navData, targetDateStr) => {
  const targetTime = new Date(targetDateStr).getTime();
  let closestItem = null;
  let minDiff = Infinity;
  
  for (let i = 0; i < navData.length; i++) {
    const item = navData[i];
    const [d, m, y] = item.date.split('-');
    const itemTime = new Date(`${y}-${m}-${d}`).getTime();
    const diff = itemTime - targetTime;
    
    // Closest business day on or after the target date
    if (diff >= 0 && diff < minDiff) {
      minDiff = diff;
      closestItem = item;
    }
  }
  
  // Fallback to absolute closest day if none found after
  if (!closestItem) {
    let minAbsoluteDiff = Infinity;
    for (let i = 0; i < navData.length; i++) {
      const item = navData[i];
      const [d, m, y] = item.date.split('-');
      const itemTime = new Date(`${y}-${m}-${d}`).getTime();
      const diff = Math.abs(itemTime - targetTime);
      if (diff < minAbsoluteDiff) {
        minAbsoluteDiff = diff;
        closestItem = item;
      }
    }
  }
  return closestItem ? parseFloat(closestItem.nav) : null;
};

export function Portfolio() {
  const { data, addHolding, deleteHolding, updateHoldingCurrentPrice } = useFinance();
  const holdings = data.investments.holdings || [];

  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [assetType, setAssetType] = useState('Equity'); // Equity or Mutual Fund
  const [equityForm, setEquityForm] = useState({ name: '', symbol: '', qty: '', avgPrice: '' });
  const [mfForm, setMfForm] = useState({ code: '', name: '', type: 'SIP', amount: '', startDate: '' });
  const [mfQuery, setMfQuery] = useState('');
  const [mfSearchResults, setMfSearchResults] = useState([]);
  const [isSearchingMf, setIsSearchingMf] = useState(false);

  // Stats
  const [portfolioStats, setPortfolioStats] = useState({
    invested: 0,
    current: 0,
    gain: 0,
    gainPercent: 0
  });

  // Dynamic values loaded from API
  const [liveHoldings, setLiveHoldings] = useState([]);

  // Fetch prices on load or when holdings change
  useEffect(() => {
    let active = true;
    const fetchLivePrices = async () => {
      if (holdings.length === 0) {
        setPortfolioStats({ invested: 0, current: 0, gain: 0, gainPercent: 0 });
        setLiveHoldings([]);
        return;
      }

      setIsLoading(true);
      try {
        const resolved = await Promise.all(holdings.map(async (h) => {
          try {
            if (h.type === 'Stock') {
              if (!h.symbol) return h;
              // Fetch Stock Price from Yahoo Finance CORS Proxy
              const symbol = h.symbol.includes('.') ? h.symbol : `${h.symbol}.NS`;
              const res = await fetchWithCache(`https://corsproxy.io/?https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`);
              const quote = res.quoteResponse?.result?.[0];
              
              if (quote) {
                const currentPrice = quote.regularMarketPrice;
                const currentVal = currentPrice * h.qty;
                const returnsVal = ((currentVal - h.invested) / h.invested) * 100;
                
                // Update in context to persist
                updateHoldingCurrentPrice(h.id, currentPrice, currentVal, returnsVal);
                
                return {
                  ...h,
                  currentPrice,
                  current: currentVal,
                  returns: parseFloat(returnsVal.toFixed(2))
                };
              }
            } else if (h.type === 'Mutual Fund') {
              if (!h.mfCode) return h;
              // Fetch Mutual Fund historical NAV
              const res = await fetchWithCache(`https://api.mfapi.in/mf/${h.mfCode}`);
              const navData = res.data;
              const meta = res.meta;
              
              if (navData && navData.length > 0) {
                const latestNav = parseFloat(navData[0].nav);
                
                if (h.sipAmount) {
                  // SIP calculation
                  // Find all months from startDate to now
                  const start = new Date(h.startDate);
                  const end = new Date();
                  let currentDate = new Date(start);
                  let totalUnits = 0;
                  let totalInvested = 0;
                  
                  while (currentDate <= end) {
                    const dateStr = currentDate.toISOString().split('T')[0];
                    const nav = findClosestNav(navData, dateStr);
                    if (nav) {
                      const units = h.sipAmount / nav;
                      totalUnits += units;
                      totalInvested += h.sipAmount;
                    }
                    // Move to next month
                    currentDate.setMonth(currentDate.getMonth() + 1);
                  }
                  
                  const currentVal = totalUnits * latestNav;
                  const returnsVal = ((currentVal - totalInvested) / totalInvested) * 100;
                  
                  updateHoldingCurrentPrice(h.id, latestNav, currentVal, returnsVal);
                  
                  return {
                    ...h,
                    qty: parseFloat(totalUnits.toFixed(4)),
                    avgPrice: parseFloat((totalInvested / totalUnits).toFixed(4)),
                    invested: totalInvested,
                    current: currentVal,
                    returns: parseFloat(returnsVal.toFixed(2)),
                    currentPrice: latestNav
                  };
                } else {
                  // Lumpsum calculation
                  const navOnDate = findClosestNav(navData, h.startDate) || latestNav;
                  const units = h.invested / navOnDate;
                  const currentVal = units * latestNav;
                  const returnsVal = ((currentVal - h.invested) / h.invested) * 100;
                  
                  updateHoldingCurrentPrice(h.id, latestNav, currentVal, returnsVal);
                  
                  return {
                    ...h,
                    qty: parseFloat(units.toFixed(4)),
                    avgPrice: navOnDate,
                    current: currentVal,
                    returns: parseFloat(returnsVal.toFixed(2)),
                    currentPrice: latestNav
                  };
                }
              }
            }
          } catch (err) {
            console.error(`Failed to fetch quote for ${h.name}:`, err);
          }
          // Return static fallback if API fails
          return h;
        }));

        if (!active) return;
        
        // Sum up stats
        const totalInvested = resolved.reduce((acc, h) => acc + h.invested, 0);
        const totalCurrent = resolved.reduce((acc, h) => acc + h.current, 0);
        const totalGain = totalCurrent - totalInvested;
        const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

        setPortfolioStats({
          invested: totalInvested,
          current: totalCurrent,
          gain: totalGain,
          gainPercent: parseFloat(totalGainPercent.toFixed(2))
        });
        
        setLiveHoldings(resolved);
      } catch (err) {
        console.error("Error updates:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchLivePrices();
    return () => { active = false; };
  }, [holdings]);

  // Handle MF Search Autocomplete
  useEffect(() => {
    if (!mfQuery.trim()) {
      setMfSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setIsSearchingMf(true);
      try {
        const res = await fetch(`https://api.mfapi.in/mf/search?q=${mfQuery}`);
        if (res.ok) {
          const results = await res.json();
          setMfSearchResults(results.slice(0, 8)); // Limit to 8 suggestions
        }
      } catch (e) {
        console.error("MF Search failed:", e);
      } finally {
        setIsSearchingMf(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [mfQuery]);

  const handleAddEquity = (e) => {
    e.preventDefault();
    if (!equityForm.name || !equityForm.symbol || !equityForm.qty || !equityForm.avgPrice) return;
    
    const qtyVal = parseFloat(equityForm.qty);
    const avgVal = parseFloat(equityForm.avgPrice);
    const symbolClean = equityForm.symbol.toUpperCase().trim();
    const symbolSuffix = symbolClean.includes('.') ? symbolClean : `${symbolClean}.NS`;

    addHolding({
      name: equityForm.name.trim(),
      type: 'Stock',
      symbol: symbolSuffix,
      qty: qtyVal,
      avgPrice: avgVal,
      invested: qtyVal * avgVal,
      current: qtyVal * avgVal, // Init
      returns: 0
    });

    setEquityForm({ name: '', symbol: '', qty: '', avgPrice: '' });
    setShowAddModal(false);
  };

  const handleAddMF = (e) => {
    e.preventDefault();
    if (!mfForm.code || !mfForm.name || !mfForm.amount || !mfForm.startDate) return;

    const amountVal = parseFloat(mfForm.amount);
    
    addHolding({
      name: mfForm.name,
      type: 'Mutual Fund',
      mfCode: parseInt(mfForm.code),
      invested: mfForm.type === 'Lumpsum' ? amountVal : 0, // dynamic compute later
      current: mfForm.type === 'Lumpsum' ? amountVal : 0,
      returns: 0,
      startDate: mfForm.startDate,
      sipAmount: mfForm.type === 'SIP' ? amountVal : null
    });

    setMfForm({ code: '', name: '', type: 'SIP', amount: '', startDate: '' });
    setMfQuery('');
    setMfSearchResults([]);
    setShowAddModal(false);
  };

  // Chart data
  const pieData = useMemo(() => {
    let stocksVal = 0;
    let mfVal = 0;
    liveHoldings.forEach(h => {
      if (h.type === 'Stock') stocksVal += h.current;
      else mfVal += h.current;
    });
    if (stocksVal === 0 && mfVal === 0) return [];
    return [
      { name: 'Stocks', value: stocksVal, color: '#818cf8' },
      { name: 'Mutual Funds', value: mfVal, color: '#4ade80' }
    ];
  }, [liveHoldings]);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Investment Portfolio</h1>
          <p className="text-text-muted mt-1">Track stocks and mutual funds with live market prices.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-primary text-background font-semibold rounded-xl flex items-center hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5 mr-1" />
          Add Holding
        </button>
      </header>

      {/* Stats and Allocation Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Value Cards */}
        <div className="glass p-6 rounded-2xl border-t-4 border-t-investment flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted text-sm font-medium">Portfolio Current Value</span>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
            </div>
            <h2 className="text-4xl font-bold mt-2">₹{portfolioStats.current.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h2>
            <div className="flex items-center space-x-2 mt-4">
              <span className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center",
                portfolioStats.gain >= 0 ? "bg-primary/10 text-primary" : "bg-expense/10 text-expense"
              )}>
                {portfolioStats.gain >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
                {portfolioStats.gainPercent}%
              </span>
              <span className={cn(
                "text-sm font-semibold",
                portfolioStats.gain >= 0 ? "text-primary" : "text-expense"
              )}>
                ₹{Math.abs(portfolioStats.gain).toLocaleString('en-IN', { maximumFractionDigits: 2 })} (Total returns)
              </span>
            </div>
          </div>
          <div className="border-t border-white/5 pt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-text-muted text-xs">Total Invested</p>
              <p className="text-lg font-bold mt-1 text-text-main">₹{portfolioStats.invested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Holdings Count</p>
              <p className="text-lg font-bold mt-1 text-text-main">{holdings.length} Assets</p>
            </div>
          </div>
        </div>

        {/* Center: Pie Chart */}
        <div className="glass p-6 rounded-2xl flex flex-col items-center justify-center relative col-span-1">
          <h3 className="text-sm font-semibold w-full text-left text-text-muted">Asset Allocation</h3>
          <div className="h-[200px] w-full relative mt-2">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e1e1e', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#f8fafc' }}
                    formatter={(val) => `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-text-muted">No holdings added yet</div>
            )}
            {pieData.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                <span className="text-text-muted text-xs">Allocated</span>
                <span className="text-xl font-bold">₹{portfolioStats.current.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            )}
          </div>
          {pieData.length > 0 && (
            <div className="flex space-x-6 text-xs mt-2 justify-center">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span>{d.name} ({((d.value / portfolioStats.current) * 100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: API Info */}
        <div className="glass p-6 rounded-2xl flex flex-col justify-between col-span-1">
          <div>
            <h3 className="text-sm font-semibold text-text-muted flex items-center">
              <Info className="w-4 h-4 mr-1.5 text-primary" /> Live Feeds Details
            </h3>
            <ul className="text-xs text-text-muted space-y-3 mt-4">
              <li>• Stock prices are fetched via standard **Yahoo Finance** quote engine. Ensure ticker symbols use correct extensions (e.g., `TATAMOTORS.NS`).</li>
              <li>• Mutual Fund NAVs are matched month-by-month from **MFAPI** records to compute true SIP units.</li>
              <li>• Dynamic calculations automatically update your dashboard's net-worth metrics.</li>
            </ul>
          </div>
          <p className="text-[10px] text-text-muted mt-4">Quotes updated automatically with a 5-minute local cache.</p>
        </div>
      </div>

      {/* Holdings List */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Current Asset Holdings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-muted bg-white/5">
              <tr>
                <th className="px-6 py-3">Asset</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3 text-right">Avg Price / NAV</th>
                <th className="px-6 py-3 text-right">Qty / Units</th>
                <th className="px-6 py-3 text-right">Invested Value</th>
                <th className="px-6 py-3 text-right">Current Value</th>
                <th className="px-6 py-3 text-right">P/L (%)</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {liveHoldings.map((h) => (
                <tr key={h.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-semibold text-text-main">{h.name}</p>
                      <p className="text-xs text-text-muted uppercase">{h.symbol || `MF Scheme Code: ${h.mfCode}`}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-semibold",
                      h.type === 'Stock' ? "bg-indigo-400/10 text-indigo-400" : "bg-emerald-400/10 text-emerald-400"
                    )}>
                      {h.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    ₹{h.avgPrice ? h.avgPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {h.qty ? h.qty.toLocaleString('en-IN', { maximumFractionDigits: 4 }) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    ₹{h.invested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-text-main">
                    ₹{h.current.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={cn(
                      "font-semibold flex items-center justify-end text-xs",
                      h.returns >= 0 ? "text-primary" : "text-expense"
                    )}>
                      {h.returns >= 0 ? '+' : ''}{h.returns}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => deleteHolding(h.id)}
                      className="text-text-muted hover:text-expense transition-colors p-1.5 rounded-lg hover:bg-white/5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {holdings.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-text-muted">
                    No holdings added yet. Click "Add Holding" to configure your investments.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Holding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="glass max-w-md w-full rounded-3xl p-6 border border-white/10 space-y-6 relative">
            <h3 className="text-xl font-bold">Add Asset to Portfolio</h3>

            {/* Selector */}
            <div className="flex border border-white/10 rounded-xl overflow-hidden p-0.5">
              <button 
                onClick={() => setAssetType('Equity')}
                className={cn("flex-1 py-2 text-sm font-semibold rounded-lg transition-colors", assetType === 'Equity' ? 'bg-primary text-background' : 'hover:bg-white/5')}
              >
                Stock (Equity)
              </button>
              <button 
                onClick={() => setAssetType('Mutual Fund')}
                className={cn("flex-1 py-2 text-sm font-semibold rounded-lg transition-colors", assetType === 'Mutual Fund' ? 'bg-primary text-background' : 'hover:bg-white/5')}
              >
                Mutual Fund
              </button>
            </div>

            {/* Equity Form */}
            {assetType === 'Equity' ? (
              <form onSubmit={handleAddEquity} className="space-y-4">
                <div>
                  <label className="text-xs text-text-muted font-semibold block mb-1.5">Stock Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Tata Motors"
                    value={equityForm.name}
                    onChange={e => setEquityForm({...equityForm, name: e.target.value})}
                    required
                    className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted font-semibold block mb-1.5">Ticker Symbol</label>
                    <input 
                      type="text" 
                      placeholder="e.g. TATAMOTORS.NS"
                      value={equityForm.symbol}
                      onChange={e => setEquityForm({...equityForm, symbol: e.target.value})}
                      required
                      className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted font-semibold block mb-1.5">Quantity</label>
                    <input 
                      type="number" 
                      step="any"
                      placeholder="e.g. 10"
                      value={equityForm.qty}
                      onChange={e => setEquityForm({...equityForm, qty: e.target.value})}
                      required
                      className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted font-semibold block mb-1.5">Average Buy Price (₹)</label>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="e.g. 950"
                    value={equityForm.avgPrice}
                    onChange={e => setEquityForm({...equityForm, avgPrice: e.target.value})}
                    required
                    className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 outline-none"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-3 bg-primary text-background hover:bg-primary/95 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Save Holding
                  </button>
                </div>
              </form>
            ) : (
              /* Mutual Fund Form */
              <form onSubmit={handleAddMF} className="space-y-4">
                <div className="relative">
                  <label className="text-xs text-text-muted font-semibold block mb-1.5">Search Mutual Fund</label>
                  <div className="flex items-center bg-surface-light border border-white/10 rounded-xl px-4 py-2.5 text-sm focus-within:border-primary/50">
                    <Search className="w-4 h-4 text-text-muted mr-2" />
                    <input 
                      type="text" 
                      placeholder="Type fund name (e.g. Parag Parikh)"
                      value={mfQuery}
                      onChange={e => setMfQuery(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-sm"
                    />
                    {isSearchingMf && <Loader2 className="w-4 h-4 animate-spin text-primary ml-2" />}
                  </div>
                  {/* Results list */}
                  {mfSearchResults.length > 0 && (
                    <div className="absolute top-[75px] left-0 right-0 bg-[#252528] border border-white/10 rounded-xl max-h-[180px] overflow-y-auto z-[200] shadow-2xl">
                      {mfSearchResults.map(res => (
                        <div 
                          key={res.schemeCode}
                          onClick={() => {
                            setMfForm({
                              ...mfForm,
                              code: String(res.schemeCode),
                              name: res.schemeName
                            });
                            setMfQuery(res.schemeName);
                            setMfSearchResults([]);
                          }}
                          className="px-4 py-2.5 text-xs hover:bg-white/5 cursor-pointer border-b border-white/5 text-left truncate"
                        >
                          {res.schemeName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted font-semibold block mb-1.5">Investment Type</label>
                    <select
                      value={mfForm.type}
                      onChange={e => setMfForm({...mfForm, type: e.target.value})}
                      className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 outline-none"
                    >
                      <option value="SIP">Monthly SIP</option>
                      <option value="Lumpsum">Lumpsum</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted font-semibold block mb-1.5">
                      {mfForm.type === 'SIP' ? 'SIP Amount (₹)' : 'Lumpsum Amount (₹)'}
                    </label>
                    <input 
                      type="number" 
                      placeholder="e.g. 5000"
                      value={mfForm.amount}
                      onChange={e => setMfForm({...mfForm, amount: e.target.value})}
                      required
                      className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-muted font-semibold block mb-1.5">
                    {mfForm.type === 'SIP' ? 'SIP Start Date' : 'Purchase Date'}
                  </label>
                  <input 
                    type="date" 
                    value={mfForm.startDate}
                    onChange={e => setMfForm({...mfForm, startDate: e.target.value})}
                    required
                    className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 outline-none"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={!mfForm.code}
                    className="flex-1 py-3 bg-primary text-background disabled:opacity-50 hover:bg-primary/95 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Save MF
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
