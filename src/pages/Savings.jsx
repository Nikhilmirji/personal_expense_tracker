import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Target, Plus, PiggyBank, ArrowRight, Calendar, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function Savings() {
  const { data, addSavingsGoal, allocateSavingsToGoal } = useFinance();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  
  // Forms
  const [newGoal, setNewGoal] = useState({ name: '', target: '', saved: '0', priority: 'Medium', deadline: '' });
  const [allocateAmount, setAllocateAmount] = useState('');

  const remainingBalance = data.summary.remainingBalance || 0;
  
  // Calculate total saved in goals
  const totalInGoals = data.savingsGoals.reduce((acc, goal) => acc + goal.saved, 0);
  
  // Unallocated pool = remaining balance (income - expenses - invested)
  const unallocatedPool = remainingBalance > 0 ? remainingBalance : 0;

  const handleAddGoalSubmit = (e) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.target) return;

    addSavingsGoal({
      name: newGoal.name,
      target: parseFloat(newGoal.target) || 0,
      saved: parseFloat(newGoal.saved) || 0,
      priority: newGoal.priority,
      deadline: newGoal.deadline
    });

    setNewGoal({ name: '', target: '', saved: '0', priority: 'Medium', deadline: '' });
    setShowAddModal(false);
  };

  const handleAllocateSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(allocateAmount);
    if (!selectedGoal || isNaN(amt) || amt <= 0 || amt > unallocatedPool) return;

    allocateSavingsToGoal(selectedGoal.id, amt);
    setAllocateAmount('');
    setSelectedGoal(null);
    setShowAllocateModal(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Savings Goals</h1>
          <p className="text-text-muted mt-1">Allocate your unassigned savings towards specific goals.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-primary text-background font-semibold rounded-xl flex items-center hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5 mr-1" />
          Create Goal
        </button>
      </header>

      {/* Unallocated Savings Card */}
      <div className="glass p-6 rounded-2xl border-l-4 border-l-primary bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <PiggyBank className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-main">Unallocated Savings Pool</h3>
            <p className="text-sm text-text-muted mt-1">Funds available to distribute among your goals.</p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-xs text-text-muted font-semibold block">Available Pool</span>
          <span className="text-3xl font-black text-primary">₹{unallocatedPool.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {data.savingsGoals.map((goal, i) => {
          const progress = Math.min((goal.saved / goal.target) * 100, 100);
          const needsToSave = Math.max(goal.target - goal.saved, 0);
          
          return (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              key={goal.id} 
              className="glass p-6 rounded-2xl relative overflow-hidden group flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-text-main group-hover:text-primary transition-colors">{goal.name}</h3>
                    <p className="text-xs text-text-muted mt-1">Target: ₹{goal.target.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Target className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                      <span>Progress</span>
                      <span>₹{goal.saved.toLocaleString('en-IN')} saved ({progress.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-surface-light rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 + 0.2 }}
                        className="h-full bg-primary rounded-full relative"
                      >
                        <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                      </motion.div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs text-text-muted">
                    <div>
                      <span>Remaining Needed</span>
                      <span className="block font-bold text-text-main mt-0.5">₹{needsToSave.toLocaleString('en-IN')}</span>
                    </div>
                    {goal.deadline && (
                      <div>
                        <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> Deadline</span>
                        <span className="block font-bold text-text-main mt-0.5">{goal.deadline}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                {needsToSave > 0 ? (
                  <button 
                    onClick={() => {
                      setSelectedGoal(goal);
                      setShowAllocateModal(true);
                    }}
                    disabled={unallocatedPool <= 0}
                    className="px-4 py-2 bg-white/5 hover:bg-primary hover:text-background font-semibold disabled:opacity-40 disabled:hover:bg-white/5 disabled:hover:text-text-muted rounded-xl text-xs flex items-center transition-all"
                  >
                    Allocate Savings <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-primary flex items-center">
                    🎉 Goal Achieved!
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
        {data.savingsGoals.length === 0 && (
          <div className="col-span-full text-center py-12 text-text-muted font-medium glass rounded-2xl">
            No savings goals defined yet. Click "Create Goal" to get started.
          </div>
        )}
      </div>

      {/* Create Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="glass max-w-md w-full rounded-3xl p-6 border border-white/10 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-text-main">Create Savings Goal</h3>
            <form onSubmit={handleAddGoalSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-text-muted font-semibold block mb-1.5">Goal Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. New Laptop, Emergency Fund"
                  value={newGoal.name}
                  onChange={e => setNewGoal({...newGoal, name: e.target.value})}
                  required
                  className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-text-muted font-semibold block mb-1.5">Target Amount (₹)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 50000"
                    value={newGoal.target}
                    onChange={e => setNewGoal({...newGoal, target: e.target.value})}
                    required
                    className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted font-semibold block mb-1.5">Initial Saved (₹)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 0"
                    value={newGoal.saved}
                    onChange={e => setNewGoal({...newGoal, saved: e.target.value})}
                    className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-text-muted font-semibold block mb-1.5">Target Date / Deadline (Optional)</label>
                <input 
                  type="date" 
                  value={newGoal.deadline}
                  onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
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
                  className="flex-1 py-3 bg-primary text-background hover:bg-primary/95 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-primary/20"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Savings Modal */}
      {showAllocateModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="glass max-w-md w-full rounded-3xl p-6 border border-white/10 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-xl font-bold text-text-main">Allocate Savings</h3>
              <p className="text-sm text-text-muted mt-1">Distribute money to **{selectedGoal.name}**.</p>
            </div>
            
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-between text-sm">
              <span className="text-text-muted">Unallocated Balance:</span>
              <span className="font-bold text-primary">₹{unallocatedPool.toLocaleString('en-IN')}</span>
            </div>

            <form onSubmit={handleAllocateSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-text-muted font-semibold block mb-1.5">Contribution Amount (₹)</label>
                <input 
                  type="number" 
                  max={unallocatedPool}
                  placeholder={`Max ₹${unallocatedPool.toLocaleString('en-IN')}`}
                  value={allocateAmount}
                  onChange={e => setAllocateAmount(e.target.value)}
                  required
                  className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 outline-none"
                />
              </div>

              {parseFloat(allocateAmount) > unallocatedPool && (
                <div className="text-xs text-expense flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Amount exceeds available unallocated savings pool.</span>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setSelectedGoal(null);
                    setShowAllocateModal(false);
                  }}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!allocateAmount || parseFloat(allocateAmount) <= 0 || parseFloat(allocateAmount) > unallocatedPool}
                  className="flex-1 py-3 bg-primary text-background disabled:opacity-40 hover:bg-primary/95 rounded-xl text-sm font-semibold transition-colors"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
