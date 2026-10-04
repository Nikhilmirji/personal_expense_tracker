# MoneyMap Project Overview

Welcome to the **MoneyMap** Personal Expense Tracker codebase. This document outlines the application architecture, the files involved, current workflows, and lists areas that can be modified or expanded so you can easily reference them in future prompts.

---

## 1. Application Architecture & Data Flow

MoneyMap is built as a Single Page Application (SPA) using **React**, **Vite**, **Tailwind CSS (v4)**, and **React Router v7**.

```
  main.jsx --> App.jsx
                |
          FinanceContext.jsx (Central State)
                |
          AnimatedLayout.jsx (Main Shell)
           /            \
    Sidebar & TopNav    Pages/Routes (Dashboard, Expenses, Analytics, etc.)
```

### State Management (`src/context/FinanceContext.jsx`)
The global state resides in `FinanceContext.jsx`:
* **Source of Truth**: `data` (initialized with static mock data from `src/data/mockData.js`).
* **State Updates**:
  * `updateTransactions(newTransactions)`: Prepends newly parsed transactions to the state.
  * `updateTransactionCategory(id, newCategory)`: Finds a transaction by its ID and updates its category designation.
* **Derived/Computed Properties**:
  * Calculates financial totals (`totalExpenses`, `totalInvested`, `totalSaved`, `remainingBalance`).
  * Dynamically computes category spend breakdowns.
  * Groups debit transactions by date/month to feed spending trends and spend-vs-limit charts.

---

## 2. Page-by-Page Feature Map

Here is how each page functions and the key files supporting it:

### 📊 Dashboard
* **Route**: `/` (File: [Dashboard.jsx](./src/pages/Dashboard.jsx))
* **Features**:
  * **Summary Metrics**: Displays Pocket Money, Total Invested, Total Expenses, and Total Saved using the reusable [SummaryCard.jsx](./src/components/ui/SummaryCard.jsx) component.
  * **Spending Trend**: An interactive area chart (via Recharts) displaying daily debit totals.
  * **Recent Transactions**: Lists the 4 most recent transactions with type indicators (Credit/Debit).

### 👛 Pocket Money Flow
* **Route**: `/pocket-money` (File: [PocketMoney.jsx](./src/pages/PocketMoney.jsx))
* **Features**:
  * **Allocation Pie Chart**: Displays how your monthly pocket money is divided among Expenses, Investments, and Savings.
  * **Smart Milestone Card**: Visualizes target allocations (e.g., showing that 56% goes to investments).

### 💸 Expenses & Statement Importer
* **Route**: `/expenses` (File: [Expenses.jsx](./src/pages/Expenses.jsx))
* **Features**:
  * **Statement Parser**: Supports importing CSV and PDF files.
    * For **CSV**: Parses headers using `papaparse` to extract date, description, type, and amount.
    * For **PDF**: Uses `pdfjs-dist` to extract text. It scans for patterns like `"Paid to [Vendor]"` or `"Received from [Vendor]"` along with corresponding currency amounts (e.g., `₹50.00`).
  * **Transaction Table**: Lists date, description, inline category selector (dropdown), and the formatted amount.
  * **Live Search**: Filters transactions by description or category.

### 📈 Monthly Analytics
* **Route**: `/analytics` (File: [Analytics.jsx](./src/pages/Analytics.jsx))
* **Features**:
  * **Financial Score**: A mock "Financial Health Score" (currently static at 85/100).
  * **Category Breakdown Chart**: A horizontal bar chart displaying total spend per category.
  * **Spend vs Limit Tracker**: A double-bar chart comparing actual monthly spend against the pocket money limit.

### 💼 Portfolio
* **Route**: `/portfolio` (File: [Portfolio.jsx](./src/pages/Portfolio.jsx))
* **Features**:
  * **Portfolio Value & Return Calculator**: Sums up invested amount vs. current market value and calculates total returns percentages.
  * **Holdings Table**: Displays stock positions (e.g., Tata Motors, ITC) and mutual funds (e.g., Nifty 50 Index Fund) with average buy price, current price, and individual percentage return badges.

### 🎯 Savings Goals
* **Route**: `/savings` (File: [Savings.jsx](./src/pages/Savings.jsx))
* **Features**:
  * **Goals List**: Visual cards representing savings goals (e.g., Laptop, Emergency Fund) displaying progress bars and percentage completion.
  * **Add Goal Button**: Static button ready to be connected to state updates.

### 💡 Smart Insights
* **Route**: `/insights` (File: [Insights.jsx](./src/pages/Insights.jsx))
* **Features**:
  * **Advisory Cards**: Displays AI-style highlights pointing out potential savings (e.g., Swiggy usage), investment milestones, or high subscription costs with quick-action buttons.

---

## 3. Workflows in Action

### Workflow A: Uploading a Bank / GPay Statement
1. User drops a PDF/CSV file on the drop zone in `/expenses`.
2. The browser handles the input event and triggers `handleFileUpload`.
3. If it's a PDF, `parsePDF` processes the document array buffer page-by-page.
4. Matches are extracted for date, description, type, and amount.
5. The extracted items are passed to `updateTransactions`.
6. State in `FinanceContext` is updated.
7. Since calculations in the context are wrapped in `useMemo`, updating the transaction list instantly updates:
   * Remaining balances on the Dashboard.
   * Daily spending trend points.
   * Categories on the Analytics page.

### Workflow B: Re-categorizing a Transaction
1. In the transaction list on `/expenses`, user changes the category dropdown selection.
2. Triggers `updateTransactionCategory(id, newCategory)`.
3. Context updates the specific transaction's category.
4. Analytics page immediately recalculates and shifts the bars in the **Category Breakdown Chart**.

---

## 4. Ideas for Features You Can Add or Modify

When you are ready to write a prompt for updates, you can refer to the following feature concepts:

### 1. Persistent Storage (Local Storage)
* **Goal**: Prevent data from resetting every time the browser is refreshed.
* **How**: Update `FinanceContext.jsx` to load initial state from `localStorage` and write to it whenever `data` changes.

### 2. Manual Transaction Creation Form
* **Goal**: Let users add individual transactions without uploading a statement.
* **How**: Add a modal or form component to the `/expenses` page with input fields for Date, Description, Category, Type, and Amount, calling `updateTransactions` upon submit.

### 3. Interactive Savings Goals Manager
* **Goal**: Hook up the "Add Goal" button on the Savings page and allow adding money to a goal.
* **How**: Introduce state functions in the context (`addSavingsGoal`, `allocateSavingsToGoal(goalId, amount)`) and construct a form to input target amounts and names.

### 4. Custom Category Budgets & Alerts
* **Goal**: Set monthly spending limits per category (e.g., ₹1,000 max for "Lifestyle Enjoyment") and alert the user when approaching the limit.
* **How**: Extend the context model to store limits, and add warning banners/badges in the Expense Table and Analytics charts.

### 5. Advanced PDF Statement Parsing
* **Goal**: Improve standard bank statement parsing templates (e.g., HDFC, ICICI, SBI, Google Pay).
* **How**: Build pattern matching templates based on the standard table layouts of major Indian banks in `src/pages/Expenses.jsx`.
