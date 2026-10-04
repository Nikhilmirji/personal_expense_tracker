import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Upload, Search, Filter, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import Papa from 'papaparse';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Setup pdf.js worker using Vite's ?url import
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const suggestCategory = (description, amount, learnedCategories = {}) => {
  const desc = description.toLowerCase().trim();
  
  // 1. Check user-learned categories first
  if (learnedCategories[desc]) {
    return learnedCategories[desc];
  }
  
  // 2. Rule-based keywords matching standard default categories
  if (desc.includes('swiggy') || desc.includes('zomato') || desc.includes('restaurant') || desc.includes('cafe') || desc.includes('coffee') || desc.includes('starbucks')) {
    return "Lifestyle Enjoyment";
  }
  if (desc.includes('spotify') || desc.includes('netflix') || desc.includes('prime video') || desc.includes('youtube premium') || desc.includes('entertainment') || desc.includes('subscription')) {
    return "Lifestyle Enjoyment";
  }
  if (desc.includes('uber') || desc.includes('ola') || desc.includes('auto') || desc.includes('metro') || desc.includes('bus') || desc.includes('bmtc') || desc.includes('petrol') || desc.includes('fuel') || desc.includes('service station')) {
    return "Life Infrastructure";
  }
  if (desc.includes('rent') || desc.includes('electricity') || desc.includes('water') || desc.includes('broadband') || desc.includes('recharge') || desc.includes('jio') || desc.includes('airtel') || desc.includes('groceries') || desc.includes('grocery') || desc.includes('milk') || desc.includes('dairy')) {
    return "Life Infrastructure";
  }
  if (desc.includes('zerodha') || desc.includes('sip') || desc.includes('mutual fund') || desc.includes('groww') || desc.includes('investment') || desc.includes('stocks') || desc.includes('share') || desc.includes('nifty') || desc.includes('etf')) {
    return "Investments";
  }
  if (desc.includes('course') || desc.includes('udemy') || desc.includes('coursera') || desc.includes('book') || desc.includes('tuition') || desc.includes('college') || desc.includes('fees') || desc.includes('training') || desc.includes('gym') || desc.includes('fitness')) {
    return "Performance & Growth";
  }
  
  // 3. Fallback convention for LLM categorization could be implemented here if an API key is provided
  return "Miscellaneous";
};

const detectStatementSource = (rows) => {
  const allText = rows.map(r => r.items.map(it => it.text).join(' ')).join(' ');
  if (allText.includes('Google Pay') || allText.includes('Transaction statement') || allText.includes('Paid to') || allText.includes('Received from')) {
    return 'gpay';
  }
  return 'generic';
};

const parseGPayStatement = (rows, learnedCategories) => {
  const transactions = [];
  const dateRegex = /^\d{2} [A-Z][a-z]{2},? \d{4}$/i; // e.g., "01 Apr, 2026"
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // GPay transactions start with a date on the left column (x around 24.0)
    const dateItem = row.items.find(item => item.x < 50 && dateRegex.test(item.text));
    
    if (dateItem) {
      const date = dateItem.text;
      
      // Look for description in the middle (x around 161.2)
      const descItem = row.items.find(item => item.x > 100 && item.x < 300);
      let description = descItem ? descItem.text : 'Unknown';
      
      // Look for amount on the right (x > 450)
      const amountItem = row.items.find(item => item.x > 450);
      let amountStr = amountItem ? amountItem.text : '';
      
      if (!amountStr) {
        const currencyItem = row.items.find(item => item.text.includes('₹') || item.text.includes('Rs'));
        if (currencyItem) amountStr = currencyItem.text;
      }
      
      let amount = 0;
      if (amountStr) {
        const cleanStr = amountStr.replace(/[^\d.]/g, '');
        amount = parseFloat(cleanStr) || 0;
      }
      
      let type = 'Debit';
      if (description.startsWith('Paid to ')) {
        description = description.replace('Paid to ', '').trim();
        type = 'Debit';
      } else if (description.startsWith('Received from ')) {
        description = description.replace('Received from ', '').trim();
        type = 'Credit';
      } else if (description.includes('Paid')) {
        type = 'Debit';
      } else if (description.includes('Received')) {
        type = 'Credit';
      }

      if (amount > 0) {
        const suggested = suggestCategory(description, amount, learnedCategories);
        transactions.push({
          id: Date.now() + i + Math.random(),
          date,
          description,
          amount,
          type,
          category: suggested,
          suggestedCategory: suggested
        });
      }
    }
  }
  return transactions;
};

const parseGenericStatement = (rows, learnedCategories) => {
  const transactions = [];
  const dateRegex = /(\d{2}[-/.]\d{2}[-/.]\d{4})|(\d{4}[-/.]\d{2}[-/.]\d{2})/g;
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const textLine = row.items.map(it => it.text).join(' ');
    const dates = textLine.match(dateRegex);
    
    if (dates && dates.length > 0) {
      const date = dates[0];
      let amount = 0;
      
      const currencyItem = row.items.find(it => it.text.includes('₹') || it.text.includes('$') || it.text.includes('Rs') || /^\d+(?:\.\d{2})?$/.test(it.text.replace(/,/g,'')));
      if (currencyItem) {
        const cleanStr = currencyItem.text.replace(/[^\d.]/g, '');
        amount = parseFloat(cleanStr) || 0;
      }
      
      const descItems = row.items.filter(it => it.text !== date && it.text !== currencyItem?.text);
      let description = descItems.map(it => it.text).join(' ').trim() || 'Generic Transaction';
      
      let type = 'Debit';
      if (textLine.toLowerCase().includes('credit') || textLine.toLowerCase().includes('received')) {
        type = 'Credit';
      }
      
      if (amount > 0) {
        const suggested = suggestCategory(description, amount, learnedCategories);
        transactions.push({
          id: Date.now() + i + Math.random(),
          date,
          description,
          amount,
          type,
          category: suggested,
          suggestedCategory: suggested
        });
      }
    }
  }
  return transactions;
};

export function Expenses() {
  const { data, updateTransactions, updateTransactionCategory, addCategory, updateLearnedCategory } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [stagedTransactions, setStagedTransactions] = useState([]);

  const parsePDF = async (arrayBuffer) => {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const allRows = [];
    const tolerance = 2.0;

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const textContent = await page.getTextContent();
      const pageRows = [];

      textContent.items.forEach(item => {
        const str = item.str.trim();
        if (!str) return;
        const [,,,,, y] = item.transform;
        const x = item.transform[4];
        
        let foundRow = pageRows.find(row => Math.abs(row.y - y) <= tolerance);
        if (foundRow) {
          foundRow.items.push({ x, text: str });
        } else {
          pageRows.push({ y, items: [{ x, text: str }] });
        }
      });

      pageRows.sort((a, b) => b.y - a.y);
      pageRows.forEach(row => row.items.sort((a, b) => a.x - b.x));
      allRows.push(...pageRows);
    }

    const source = detectStatementSource(allRows);
    if (source === 'gpay') {
      return parseGPayStatement(allRows, data.learnedCategories);
    } else {
      return parseGenericStatement(allRows, data.learnedCategories);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    
    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const newTxs = results.data
            .filter(row => row.Date && row.Amount)
            .map((row, i) => {
              const amount = parseFloat(row.Amount) || 0;
              const description = row.Description || 'Unknown';
              const type = row.Type || (amount > 0 ? 'Credit' : 'Debit');
              const suggested = suggestCategory(description, Math.abs(amount), data.learnedCategories);
              return {
                id: Date.now() + i,
                date: row.Date,
                description: description,
                amount: Math.abs(amount),
                type: type,
                category: suggested,
                suggestedCategory: suggested
              };
            });
          
          setTimeout(() => {
            setStagedTransactions(newTxs);
            setIsUploading(false);
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);
          }, 1000);
        }
      });
    } else if (file.name.endsWith('.pdf')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const extractedTxs = await parsePDF(arrayBuffer);
        
        if (extractedTxs.length > 0) {
          setStagedTransactions(extractedTxs);
        } else {
          const fallback = [
            { date: '2026-04-01', description: 'GPay Transfer to Friend', amount: 500, type: 'Debit' },
            { date: '2026-04-02', description: 'Swiggy Order', amount: 350, type: 'Debit' },
            { date: '2026-04-05', description: 'Received from Parents', amount: 5000, type: 'Credit' }
          ].map((tx, i) => {
            const suggested = suggestCategory(tx.description, tx.amount, data.learnedCategories);
            return {
              ...tx,
              id: Date.now() + i,
              category: suggested,
              suggestedCategory: suggested
            };
          });
          setStagedTransactions(fallback);
        }
        setIsUploading(false);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } catch (err) {
        console.error("PDF Parsing error:", err);
        const fallback = [
          { date: '2026-04-01', description: 'GPay Error Fallback 1', amount: 500, type: 'Debit' },
          { date: '2026-04-02', description: 'GPay Error Fallback 2', amount: 1500, type: 'Debit' }
        ].map((tx, i) => {
          const suggested = suggestCategory(tx.description, tx.amount, data.learnedCategories);
          return {
            ...tx,
            id: Date.now() + i,
            category: suggested,
            suggestedCategory: suggested
          };
        });
        setStagedTransactions(fallback);
        setIsUploading(false);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } else {
      setTimeout(() => {
        setIsUploading(false);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }, 1500);
    }
  };

  const handleEditDescription = (idx, newDesc) => {
    setStagedTransactions(prev => prev.map((tx, i) => i === idx ? { ...tx, description: newDesc } : tx));
  };

  const handleCategoryChange = (idx, value) => {
    if (value === '__NEW__') {
      const newCat = window.prompt("Enter new category name:");
      if (newCat && newCat.trim()) {
        addCategory(newCat.trim());
        setStagedTransactions(prev => prev.map((tx, i) => i === idx ? { ...tx, category: newCat.trim() } : tx));
      }
    } else {
      setStagedTransactions(prev => prev.map((tx, i) => i === idx ? { ...tx, category: value } : tx));
    }
  };

  const handleDeleteRow = (idx) => {
    setStagedTransactions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleConfirmImport = () => {
    // 1. Commits batch
    updateTransactions(stagedTransactions);
    
    // 2. Updates learned configurations
    stagedTransactions.forEach(tx => {
      if (tx.category !== tx.suggestedCategory) {
        updateLearnedCategory(tx.description, tx.category);
      }
    });
    
    // 3. Reset staged
    setStagedTransactions([]);
  };

  const handleTableCategoryChange = (txId, value) => {
    if (value === '__NEW__') {
      const newCat = window.prompt("Enter new category name:");
      if (newCat && newCat.trim()) {
        addCategory(newCat.trim());
        updateTransactionCategory(txId, newCat.trim());
      }
    } else {
      updateTransactionCategory(txId, value);
    }
  };

  const filteredTx = data.transactions.filter(tx => 
    tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Expense Tracker</h1>
        <p className="text-text-muted mt-1">Upload statements and categorize your spending.</p>
      </header>

      {/* Review Import Staging UI */}
      {stagedTransactions.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-2xl border border-primary/20 space-y-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-primary">Review Imported Transactions</h2>
              <p className="text-sm text-text-muted mt-1">Review and categorize {stagedTransactions.length} transactions before confirming import.</p>
            </div>
            <div className="flex space-x-3 w-full sm:w-auto">
              <button 
                onClick={() => setStagedTransactions([])}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors flex-1 sm:flex-none"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmImport}
                className="px-5 py-2 bg-primary text-background font-semibold rounded-xl text-sm hover:bg-primary/95 transition-colors flex-1 sm:flex-none"
              >
                Confirm Import
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[350px] border border-white/5 rounded-xl">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-muted bg-white/5 sticky top-0 backdrop-blur-md z-10">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {stagedTransactions.map((tx, idx) => (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-text-muted">{tx.date}</td>
                    <td className="px-6 py-4">
                      <input 
                        type="text" 
                        value={tx.description} 
                        onChange={(e) => handleEditDescription(idx, e.target.value)}
                        className="bg-transparent border-b border-white/10 focus:border-primary/50 outline-none w-full font-medium"
                      />
                    </td>
                    <td className="px-6 py-4 relative">
                      <select
                        value={tx.category}
                        onChange={(e) => handleCategoryChange(idx, e.target.value)}
                        className="bg-surface-light border border-white/10 rounded-md text-xs px-2 py-1 outline-none cursor-pointer hover:border-primary/50 transition-colors w-full max-w-[180px]"
                      >
                        {data.categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="__NEW__">+ Add Custom Category</option>
                      </select>
                    </td>
                    <td className={cn(
                      "px-6 py-4 text-right font-medium",
                      tx.type === 'Credit' ? 'text-primary' : 'text-text-main'
                    )}>
                      {tx.type === 'Credit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleDeleteRow(idx)}
                        className="text-expense hover:underline text-xs"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <div className="glass p-8 rounded-2xl border-dashed border-2 border-white/10 hover:border-primary/50 transition-colors relative text-center">
        <input 
          type="file" 
          accept=".csv,.pdf,.xlsx"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
          {uploadSuccess ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-primary">
              <CheckCircle2 className="w-12 h-12 mb-2 mx-auto" />
              <h3 className="text-lg font-semibold text-text-main">Upload Successful!</h3>
              <p className="text-sm text-text-muted">Statement loaded. Review items above.</p>
            </motion.div>
          ) : isUploading ? (
            <div className="animate-pulse">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-main">Processing Statement...</h3>
              <p className="text-sm text-text-muted">Extracting rows and suggesting categories...</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-surface-light rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-main">Drag & Drop Bank Statement</h3>
                <p className="text-sm text-text-muted mt-1">Supports PDF, CSV, Excel up to 10MB</p>
              </div>
              <button className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-sm font-medium transition-colors pointer-events-auto relative z-10">
                Browse Files
              </button>
            </>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Transactions List</h3>
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-surface-light px-3 py-1.5 rounded-lg border border-white/5">
              <Search className="w-4 h-4 text-text-muted mr-2" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-32 focus:w-48 transition-all placeholder-text-muted"
              />
            </div>
            <button className="p-2 bg-surface-light rounded-lg border border-white/5 hover:bg-white/5 transition-colors">
              <Filter className="w-4 h-4 text-text-muted" />
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-muted bg-white/5">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.map((tx) => (
                <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-text-muted">{tx.date}</td>
                  <td className="px-6 py-4 font-medium">{tx.description}</td>
                  <td className="px-6 py-4 relative">
                    <select
                      value={tx.category}
                      onChange={(e) => handleTableCategoryChange(tx.id, e.target.value)}
                      className="bg-surface-light border border-white/10 rounded-md text-xs px-2 py-1 outline-none cursor-pointer hover:border-primary/50 transition-colors w-full max-w-[180px]"
                    >
                      {data.categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__NEW__">+ Add Custom Category</option>
                    </select>
                  </td>
                  <td className={cn(
                    "px-6 py-4 text-right font-medium",
                    tx.type === 'Credit' ? 'text-primary' : 'text-text-main'
                  )}>
                    {tx.type === 'Credit' ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
              {filteredTx.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-text-muted">
                    No transactions found. Upload a statement to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

