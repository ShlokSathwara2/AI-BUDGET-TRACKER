import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Plus, Calendar, CreditCard, Home, Utensils,
  X, Clock, TrendingUp, TrendingDown, Wallet,
  AlertTriangle, CheckCircle, RefreshCw
} from 'lucide-react';

const PaymentReminders = ({
  user,
  bankAccounts = [],
  reminders = [],
  onAddReminder,
  onUpdateReminder,
  onDeleteReminder,
  onAutoDebit,       // (reminder) => { success, insufficient, message, account, amount }
  onAddTransaction,  // fallback if onAutoDebit not provided
}) => {
  const [showAddForm, setShowAddForm]         = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [insufficientData, setInsufficientData] = useState(null);
  const [lastCheck, setLastCheck]             = useState(null);
  const [newReminder, setNewReminder]         = useState({
    title: '', amount: '', date: '', type: 'credit_card',
    frequency: 'monthly', account: 'cash',
  });
  const [errors, setErrors] = useState({});
  const checkedRef = useRef(new Set()); // track which reminders were auto-debited this session

  const safeAccounts = Array.isArray(bankAccounts) ? bankAccounts : [];

  // Reload reminders from localStorage when user changes or component mounts
  // This ensures data persistence across navigation
  useEffect(() => {
    if (!user || !user.id) return;
    
    try {
      const userRemindersKey = `payment_reminders_${user.id}`;
      const savedReminders = localStorage.getItem(userRemindersKey);
      if (savedReminders) {
        const parsed = JSON.parse(savedReminders);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // We don't set state here since parent manages reminders
          // But we could emit an event or callback if needed
          console.log('Loaded payment reminders from localStorage:', parsed.length);
        }
      }
    } catch (error) {
      console.error('Error loading payment reminders:', error);
    }
  }, [user?.id]);

  // ── Auto-debit check on mount and every hour ────────────────────────────────
  useEffect(() => {
    const check = () => {
      const today    = new Date();
      const todayDay = today.getDate();
      const monthKey = `${today.getFullYear()}-${today.getMonth()}`;

      reminders.forEach(reminder => {
        if (reminder.completed) return;
        const dueDay = parseInt(reminder.date);
        if (isNaN(dueDay)) return;

        const sessionKey = `${reminder.id}-${monthKey}`;
        if (checkedRef.current.has(sessionKey)) return;

        // Already paid this month?
        if (reminder.lastPaid) {
          const lp = new Date(reminder.lastPaid);
          if (lp.getMonth() === today.getMonth() && lp.getFullYear() === today.getFullYear()) return;
        }

        // Due today?
        if (dueDay === todayDay) {
          checkedRef.current.add(sessionKey);

          if (onAutoDebit) {
            const result = onAutoDebit(reminder);
            if (result && !result.success && result.insufficient) {
              setInsufficientData(result);
            }
          } else if (onAddTransaction) {
            // Fallback
            onAddTransaction({
              amount: parseFloat(reminder.amount),
              merchant: reminder.title,
              description: `Auto-debit: ${reminder.title}`,
              category: 'Bills & Payments',
              type: 'debit',
              paymentMethod: reminder.account === 'cash' ? 'cash' : 'net_banking',
              bankAccountId: reminder.account !== 'cash' ? reminder.account : null,
              mode: reminder.account === 'cash' ? 'cash' : 'non-cash',
              date: new Date().toISOString(),
              autoDebit: true,
            });
          }
        }

        // Due in 1–3 days → warn if insufficient balance
        const daysUntil = dueDay - todayDay;
        if (daysUntil > 0 && daysUntil <= 3 && reminder.account !== 'cash') {
          const acc = safeAccounts.find(a => a?.id === reminder.account);
          if (acc && (acc.balance || 0) < parseFloat(reminder.amount)) {
            setInsufficientData({
              insufficient: true,
              message: `${acc.name} has only ₹${(acc.balance||0).toLocaleString()} but ₹${parseFloat(reminder.amount).toLocaleString()} is needed for "${reminder.title}" due in ${daysUntil} day${daysUntil>1?'s':''}.`,
              account: acc,
              amount: parseFloat(reminder.amount),
              reminder,
              warning: true,
            });
          }
        }
      });

      setLastCheck(new Date());
    };

    check();
    const interval = setInterval(check, 3_600_000); // every hour
    return () => clearInterval(interval);
  }, [reminders, bankAccounts]);

  // ── Form helpers ────────────────────────────────────────────────────────────
  const resetForm = () => {
    setNewReminder({ title:'', amount:'', date:'', type:'credit_card', frequency:'monthly', account:'cash' });
    setErrors({});
    setEditingReminder(null);
    setShowAddForm(false);
  };

  const validate = () => {
    const e = {};
    if (!newReminder.title.trim())               e.title  = 'Title is required';
    if (!newReminder.amount || parseFloat(newReminder.amount) <= 0) e.amount = 'Valid amount required';
    if (!newReminder.date || parseInt(newReminder.date) < 1 || parseInt(newReminder.date) > 31)
                                                  e.date   = 'Enter a day 1–31';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const obj = {
      ...newReminder,
      amount: parseFloat(newReminder.amount),
      completed: false,
    };

    if (editingReminder) {
      onUpdateReminder && onUpdateReminder(editingReminder.id, obj);
    } else {
      onAddReminder && onAddReminder({ ...obj, id: `rem_${Date.now()}`, createdAt: new Date().toISOString() });
    }
    resetForm();
  };

  const handleEdit = (r) => {
    setEditingReminder(r);
    setNewReminder({
      title: r.title, amount: r.amount.toString(), date: r.date,
      type: r.type, frequency: r.frequency, account: r.account || 'cash',
    });
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this reminder?')) onDeleteReminder && onDeleteReminder(id);
  };

  const handleToggle = (id) => {
    const r = reminders.find(r => r.id === id);
    if (r) onUpdateReminder && onUpdateReminder(id, { completed: !r.completed });
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getDaysUntil = (dateDay) => {
    const today = new Date();
    const due   = new Date(today.getFullYear(), today.getMonth(), parseInt(dateDay));
    if (parseInt(dateDay) < today.getDate()) due.setMonth(due.getMonth() + 1);
    return Math.ceil((due - today) / 86_400_000);
  };

  const typeIcon = (t) => ({
    credit_card:  <CreditCard className="h-5 w-5 text-white" />,
    rent:         <Home       className="h-5 w-5 text-white" />,
    utilities:    <Utensils   className="h-5 w-5 text-white" />,
    loan:         <TrendingDown className="h-5 w-5 text-white" />,
    subscription: <RefreshCw  className="h-5 w-5 text-white" />,
  }[t] || <Bell className="h-5 w-5 text-white" />);

  const typeGrad = (t) => ({
    credit_card:  'from-red-500 to-rose-600',
    rent:         'from-blue-500 to-indigo-600',
    utilities:    'from-green-500 to-emerald-600',
    loan:         'from-purple-500 to-violet-600',
    subscription: 'from-yellow-500 to-amber-600',
  }[t] || 'from-gray-500 to-slate-600');

  const dueSoon = reminders.filter(r => {
    if (r.completed) return false;
    const d = getDaysUntil(r.date);
    return d >= 0 && d <= 3;
  });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl classy-element"
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Payment Reminders</h2>
            <p className="text-sm text-gray-400">Auto-debit on due date · {reminders.length} reminder{reminders.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <motion.button onClick={() => setShowAddForm(true)}
          className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-500 hover:to-indigo-500 transition-all"
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Plus className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Due-soon warning banner */}
      {dueSoon.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/40 rounded-xl flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 font-semibold text-sm">
              ⚠️ {dueSoon.length} payment{dueSoon.length > 1 ? 's' : ''} due within 3 days!
            </p>
            <p className="text-yellow-200 text-xs mt-0.5">
              {dueSoon.map(r => `${r.title} (₹${r.amount?.toLocaleString()})`).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Reminders list */}
      <div className="space-y-3">
        <AnimatePresence>
          {reminders.length === 0 ? (
            <motion.div className="text-center py-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Payment Reminders</h3>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">
                Add reminders and the app will <strong className="text-white">automatically debit</strong> the amount on the due date and reflect it everywhere.
              </p>
            </motion.div>
          ) : reminders.map(reminder => {
            const daysUntil   = getDaysUntil(reminder.date);
            const isDueSoon   = daysUntil >= 0 && daysUntil <= 3;
            const isOverdue   = daysUntil < 0 && !reminder.completed;
            const linkedAcc   = safeAccounts.find(a => a?.id === reminder.account);
            const lowBalance  = linkedAcc && !reminder.completed && (linkedAcc.balance || 0) < reminder.amount;

            return (
              <motion.div key={reminder.id}
                className={`rounded-xl border p-4 transition-all ${
                  reminder.completed ? 'bg-green-500/10 border-green-500/20 opacity-70'
                  : isOverdue        ? 'bg-red-500/15 border-red-500/40'
                  : isDueSoon        ? 'bg-yellow-500/15 border-yellow-500/40'
                  : lowBalance       ? 'bg-orange-500/10 border-orange-500/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}>

                <div className="flex items-start justify-between gap-3">
                  {/* Left: icon + checkbox */}
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <div className={`p-2 bg-gradient-to-br ${typeGrad(reminder.type)} rounded-lg`}>
                      {typeIcon(reminder.type)}
                    </div>
                    <input type="checkbox" checked={!!reminder.completed}
                      onChange={() => handleToggle(reminder.id)}
                      className="w-5 h-5 rounded cursor-pointer" />
                  </div>

                  {/* Middle: info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold ${reminder.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                      {reminder.title}
                    </h3>
                    <div className="mt-1 space-y-0.5 text-xs text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Day {reminder.date} · {reminder.frequency}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Wallet className="h-3 w-3" />
                        <span className={lowBalance ? 'text-orange-400 font-semibold' : ''}>
                          {reminder.account === 'cash'
                            ? '💵 Cash'
                            : linkedAcc
                              ? `🏦 ${linkedAcc.name} · ₹${(linkedAcc.balance||0).toLocaleString()}${lowBalance ? ' ⚠️ Low!' : ''}`
                              : 'Account not found'}
                        </span>
                      </div>
                      {reminder.lastPaid && (
                        <div className="flex items-center space-x-1 text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          <span>Last paid {new Date(reminder.lastPaid).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: amount + days */}
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-lg ${reminder.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                      ₹{(reminder.amount||0).toLocaleString()}
                    </p>
                    <p className={`text-xs font-medium ${
                      reminder.completed ? 'text-green-400'
                      : isOverdue ? 'text-red-400'
                      : isDueSoon ? 'text-yellow-400'
                      : 'text-gray-400'
                    }`}>
                      {reminder.completed ? '✓ Paid'
                       : daysUntil === 0   ? '🔴 Due TODAY'
                       : isOverdue         ? `Overdue ${Math.abs(daysUntil)}d`
                       : isDueSoon         ? `Due in ${daysUntil}d`
                       : `${daysUntil} days`}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-white/10">
                  <button onClick={() => handleEdit(reminder)}
                    className="text-xs px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded-lg transition-all">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(reminder.id)}
                    className="text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg transition-all">
                    Delete
                  </button>
                  {/* Manual pay now */}
                  {!reminder.completed && (
                    <button onClick={() => {
                      if (onAutoDebit) {
                        const result = onAutoDebit(reminder);
                        if (result && !result.success && result.insufficient) setInsufficientData(result);
                      }
                    }}
                      className="ml-auto text-xs px-3 py-1.5 bg-green-500/20 hover:bg-green-500/40 text-green-300 rounded-lg transition-all">
                      Pay Now
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Add / Edit Form Modal ── */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <motion.div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              initial={{ scale:0.9, y:-20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9, y:-20 }}>

              <h3 className="text-xl font-bold text-white mb-5">
                {editingReminder ? 'Edit Reminder' : 'Add Payment Reminder'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Title</label>
                  <input type="text" value={newReminder.title}
                    onChange={e => setNewReminder({...newReminder, title: e.target.value})}
                    placeholder="e.g. Credit Card, Rent, Netflix"
                    className={`w-full px-4 py-3 bg-black/30 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-500' : 'border-white/20'}`} />
                  {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                </div>

                {/* Amount + Day */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-300 mb-1 block">Amount (₹)</label>
                    <input type="number" value={newReminder.amount}
                      onChange={e => setNewReminder({...newReminder, amount: e.target.value})}
                      placeholder="0.00"
                      className={`w-full px-4 py-3 bg-black/30 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.amount ? 'border-red-500' : 'border-white/20'}`} />
                    {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount}</p>}
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 mb-1 block">Day of Month</label>
                    <input type="number" min="1" max="31" value={newReminder.date}
                      onChange={e => setNewReminder({...newReminder, date: e.target.value})}
                      placeholder="1–31"
                      className={`w-full px-4 py-3 bg-black/30 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.date ? 'border-red-500' : 'border-white/20'}`} />
                    {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
                  </div>
                </div>

                {/* Type + Frequency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-300 mb-1 block">Type</label>
                    <select value={newReminder.type}
                      onChange={e => setNewReminder({...newReminder, type: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="credit_card">Credit Card</option>
                      <option value="rent">Rent</option>
                      <option value="utilities">Utilities</option>
                      <option value="loan">Loan / EMI</option>
                      <option value="subscription">Subscription</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 mb-1 block">Frequency</label>
                    <select value={newReminder.frequency}
                      onChange={e => setNewReminder({...newReminder, frequency: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="once">Once</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                {/* Account */}
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Pay from Account</label>
                  <select value={newReminder.account}
                    onChange={e => setNewReminder({...newReminder, account: e.target.value})}
                    className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="cash">💵 Cash</option>
                    {safeAccounts.filter(a => a?.id).map(acc => (
                      <option key={acc.id} value={acc.id}>
                        🏦 {acc.name} (****{acc.lastFourDigits}) · ₹{(acc.balance||0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Amount will be auto-debited from this account on the due date.</p>
                </div>

                {/* Buttons */}
                <div className="flex space-x-3 pt-2">
                  <button type="button" onClick={resetForm}
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl transition-all font-semibold">
                    {editingReminder ? 'Save Changes' : 'Add Reminder'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Insufficient Balance Modal ── */}
      <AnimatePresence>
        {insufficientData && (
          <motion.div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setInsufficientData(null)}>
            <motion.div className="bg-gradient-to-br from-red-950 to-orange-950 border-2 border-red-500/60 rounded-2xl p-8 w-full max-w-md shadow-2xl"
              initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }}
              onClick={e => e.stopPropagation()}>

              <div className="flex items-center space-x-3 mb-5">
                <div className="p-3 bg-red-500 rounded-full animate-pulse">
                  <AlertTriangle className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {insufficientData.warning ? '⚠️ Upcoming Payment Alert' : '❌ Insufficient Balance'}
                  </h3>
                  <p className="text-red-200 text-sm">Action required</p>
                </div>
              </div>

              <p className="text-white mb-5 leading-relaxed">{insufficientData.message}</p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  ['Account',         insufficientData.account?.name || 'N/A'],
                  ['Current Balance', `₹${(insufficientData.account?.balance||0).toLocaleString()}`],
                  ['Required',        `₹${(insufficientData.amount||0).toLocaleString()}`],
                  ['Shortfall',       `₹${Math.max(0,(insufficientData.amount||0)-(insufficientData.account?.balance||0)).toLocaleString()}`],
                ].map(([label, val]) => (
                  <div key={label} className="bg-white/10 rounded-lg p-3">
                    <p className="text-gray-300 text-xs">{label}</p>
                    <p className="text-white font-bold">{val}</p>
                  </div>
                ))}
              </div>

              <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3 mb-5">
                <p className="text-yellow-200 text-sm">
                  💡 Add funds to your account before the due date to avoid payment failure.
                </p>
              </div>

              <div className="flex space-x-3">
                <button onClick={() => setInsufficientData(null)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors">
                  Dismiss
                </button>
                <button onClick={() => {
                  setInsufficientData(null);
                  // Add a credit transaction to top up the account
                  if (onAutoDebit && insufficientData.reminder) {
                    const shortfall = (insufficientData.amount||0) - (insufficientData.account?.balance||0);
                    // This calls addTransaction via the hook
                    window._appAddTransaction && window._appAddTransaction({
                      amount: shortfall,
                      merchant: 'Top-up',
                      description: `Top-up for ${insufficientData.reminder.title}`,
                      category: 'Top-up / Transfer',
                      type: 'credit',
                      paymentMethod: 'net_banking',
                      bankAccountId: insufficientData.account?.id,
                      mode: 'non-cash',
                      date: new Date().toISOString(),
                    });
                  }
                }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-semibold transition-all">
                  Top Up Account
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PaymentReminders;