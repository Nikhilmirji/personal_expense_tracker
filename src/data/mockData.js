export const mockData = {
  user: {
    name: "Nikhil",
    monthlyPocketMoney: 5000,
  },
  summary: {
    totalInvested: 2800,
    totalExpenses: 1500,
    totalSaved: 700,
    remainingBalance: 700,
  },
  investments: {
    mutualFunds: 1500,
    stocks: 1300,
    holdings: [
      { id: 1, name: "Nifty 50 Index Fund", type: "Mutual Fund", invested: 5000, current: 5600, returns: 12 },
      { id: 2, name: "Quant Small Cap", type: "Mutual Fund", invested: 3000, current: 3800, returns: 26.6 },
      { id: 3, name: "Tata Motors", type: "Stock", qty: 5, avgPrice: 600, currentPrice: 950, invested: 3000, current: 4750, returns: 58.3 },
      { id: 4, name: "ITC", type: "Stock", qty: 10, avgPrice: 400, currentPrice: 420, invested: 4000, current: 4200, returns: 5 },
    ]
  },
  transactions: [
    { id: 1, date: "2024-05-08", description: "Swiggy - Biryani", amount: 250, type: "Debit", category: "Lifestyle Enjoyment" },
    { id: 2, date: "2024-05-07", description: "Spotify Premium", amount: 119, type: "Debit", category: "Performance & Growth" },
    { id: 3, date: "2024-05-05", description: "Uber to College", amount: 150, type: "Debit", category: "Life Infrastructure" },
    { id: 4, date: "2024-05-03", description: "Zerodha SIP", amount: 1500, type: "Debit", category: "Investments" },
    { id: 5, date: "2024-05-01", description: "Pocket Money Received", amount: 5000, type: "Credit", category: "Miscellaneous" },
  ],
  analytics: {
    spendingTrend: [
      { day: "1", amount: 0 },
      { day: "5", amount: 1650 },
      { day: "10", amount: 2500 },
      { day: "15", amount: 3100 },
      { day: "20", amount: 3600 },
      { day: "25", amount: 4100 },
      { day: "30", amount: 4300 },
    ],
    categoryBreakdown: [
      { name: "Investments", value: 2800 },
      { name: "Lifestyle Enjoyment", value: 800 },
      { name: "Life Infrastructure", value: 400 },
      { name: "Performance & Growth", value: 300 },
    ]
  },
  savingsGoals: [
    { id: 1, name: "New Laptop", target: 80000, saved: 15000 },
    { id: 2, name: "Emergency Fund", target: 20000, saved: 8000 },
    { id: 3, name: "Travel Fund", target: 10000, saved: 2000 },
  ]
};
