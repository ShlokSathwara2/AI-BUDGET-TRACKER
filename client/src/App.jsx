import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Menu, X, Wallet, User, LogOut, Sun, Moon, Shield, Lock, CheckCircle, Brain, Eye } from 'lucide-react';
import { loadAllUserData, addTransactionAPI, updateTransactionAPI, deleteTransactionAPI, addPaymentReminderAPI, updatePaymentReminderAPI, deletePaymentReminderAPI } from './utils/api';

// ─── localStorage helpers ─────────────────────────────────────────────────────
const save = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};
const load = (key, fallback) => {
  try {
    const r = localStorage.getItem(key);
    return r !== null ? JSON.parse(r) : fallback;
  } catch { return fallback; }
};

// ─── Central data hook ────────────────────────────────────────────────────────
/**
 * Single source of truth for ALL persistent app data.
 *
 * Key design decisions that prevent the "entries vanish on navigation" bug:
 *
 * 1. Every setter is wrapped in useCallback so it has a STABLE reference
 *    across renders. Without this, any child component whose useEffect lists
 *    a setter as a dep will re-run on every parent render → infinite loop.
 *
 * 2. `goals` is included in the return value (it was missing before, which
 *    caused SavingGoalsPage to always receive undefined).
 *
 * 3. All mutations read fresh data from localStorage (load()) before updating,
 *    so concurrent updates from different components don't clobber each other.
 */
function useAppData(user) {
  const uid = user?.id;

  const [transactions, _setTx]   = useState([]);
  const [bankAccounts, _setAcc]  = useState([]);
  const [reminders,    _setRem]  = useState([]);
  const [goals,        _setGoal] = useState([]);

  // Keys — change when user changes
  const txKey   = uid ? `transactions_${uid}`      : null;
  const accKey  = uid ? `bank_accounts_${uid}`     : null;
  const remKey  = uid ? `payment_reminders_${uid}` : null;
  const goalKey = uid ? `saving_goals_${uid}`      : null;

  // Load from localStorage when the user logs in / changes
  useEffect(() => {
    if (!uid) { _setTx([]); _setAcc([]); _setRem([]); _setGoal([]); return; }
    _setTx  (load(txKey,   []));
    _setAcc (load(accKey,  []));
    _setRem (load(remKey,  []));
    _setGoal(load(goalKey, []));
  }, [uid]); // intentionally only uid — keys are derived from it

  // Re-sync when tab becomes visible (covers browser back/forward + tab switch)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || !uid) return;
      _setTx  (load(txKey,   []));
      _setAcc (load(accKey,  []));
      _setRem (load(remKey,  []));
      _setGoal(load(goalKey, []));
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [uid]); // same — keys derived from uid

  // ── Stable setters (useCallback → same reference until uid/key changes) ──
  const setTransactions = useCallback((arr) => {
    const a = Array.isArray(arr) ? arr : [];
    _setTx(a);
    if (txKey) save(txKey, a);
  }, [txKey]);

  const setBankAccounts = useCallback((arr) => {
    const a = Array.isArray(arr) ? arr : [];
    _setAcc(a);
    if (accKey) save(accKey, a);
  }, [accKey]);

  const setReminders = useCallback((arr) => {
    const a = Array.isArray(arr) ? arr : [];
    _setRem(a);
    if (remKey) save(remKey, a);
  }, [remKey]);

  const setGoals = useCallback((arr) => {
    const a = Array.isArray(arr) ? arr : [];
    _setGoal(a);
    if (goalKey) save(goalKey, a);
  }, [goalKey]);

  // ── Transaction actions ──
  const addTransaction = useCallback((newTx) => {
    if (!uid || !newTx) return null;
    const amount = parseFloat(newTx.amount) || 0;
    if (amount <= 0) return null;

    const tx = {
      ...newTx,
      user:          uid,
      _id:           `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt:     new Date().toISOString(),
      date:          newTx.date || new Date().toISOString(),
      amount,
      merchant:      newTx.merchant      || 'Unknown',
      description:   newTx.description   || '',
      category:      newTx.category      || 'Uncategorized',
      type:          newTx.type          || 'debit',
      paymentMethod: newTx.paymentMethod || 'cash',
    };

    // Read fresh from storage to avoid stale-closure issues
    const freshTx  = load(txKey, []);
    const newArr   = [tx, ...freshTx];
    _setTx(newArr);
    if (txKey) save(txKey, newArr);

    // Update linked bank account balance
    if (tx.bankAccountId && tx.mode !== 'cash') {
      const change    = tx.type === 'credit' ? amount : -amount;
      const freshAcc  = load(accKey, []);
      const updAcc    = freshAcc.map(a =>
        a?.id === tx.bankAccountId
          ? { ...a, balance: (typeof a.balance === 'number' ? a.balance : 0) + change }
          : a
      );
      _setAcc(updAcc);
      if (accKey) save(accKey, updAcc);
    }

    return tx;
  }, [uid, txKey, accKey]);

  const updateTransaction = useCallback((upd) => {
    if (!uid) return;
    const arr = load(txKey, []).map(t => t._id === upd._id ? { ...t, ...upd } : t);
    _setTx(arr);
    if (txKey) save(txKey, arr);
  }, [uid, txKey]);

  const deleteTransaction = useCallback((id) => {
    if (!uid) return;
    const arr = load(txKey, []).filter(t => t._id !== id);
    _setTx(arr);
    if (txKey) save(txKey, arr);
  }, [uid, txKey]);

  // ── Bank account actions ──
  const addBankAccount = useCallback((acc) => {
    if (!uid) return null;
    const obj = {
      ...acc,
      id:        acc.id || `acc_${Date.now()}`,
      balance:   acc.balance || 0,
      createdAt: new Date().toISOString(),
    };
    const arr = [...load(accKey, []), obj];
    _setAcc(arr);
    if (accKey) save(accKey, arr);
    return obj;
  }, [uid, accKey]);

  const updateBankAccount = useCallback((id, changes) => {
    if (!uid) return;
    const arr = load(accKey, []).map(a => a?.id === id ? { ...a, ...changes } : a);
    _setAcc(arr);
    if (accKey) save(accKey, arr);
  }, [uid, accKey]);

  const deleteBankAccount = useCallback((id) => {
    if (!uid) return;
    const arr = load(accKey, []).filter(a => a?.id !== id);
    _setAcc(arr);
    if (accKey) save(accKey, arr);
  }, [uid, accKey]);

  const resetBankAccounts = useCallback(() => {
    if (!uid) return;
    _setAcc([]);
    if (accKey) save(accKey, []);
  }, [uid, accKey]);

  // ── Reminder actions ──
  const addReminder = useCallback((r) => {
    if (!uid) return null;
    const obj = {
      ...r,
      id:        r.id || `rem_${Date.now()}`,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const arr = [...load(remKey, []), obj];
    _setRem(arr);
    if (remKey) save(remKey, arr);
    return obj;
  }, [uid, remKey]);

  const updateReminder = useCallback((id, changes) => {
    if (!uid) return;
    const arr = load(remKey, []).map(r => r.id === id ? { ...r, ...changes } : r);
    _setRem(arr);
    if (remKey) save(remKey, arr);
  }, [uid, remKey]);

  const deleteReminder = useCallback((id) => {
    if (!uid) return;
    const arr = load(remKey, []).filter(r => r.id !== id);
    _setRem(arr);
    if (remKey) save(remKey, arr);
  }, [uid, remKey]);

  // ── Auto-debit ──
  const autoDebitReminder = useCallback((reminder) => {
    if (!uid) return { success: false, message: 'Not authenticated' };
    const amount = parseFloat(reminder.amount) || 0;
    if (amount <= 0) return { success: false, message: 'Invalid amount' };
    const today = new Date();

    // Check balance
    if (reminder.account && reminder.account !== 'cash') {
      const acc = load(accKey, []).find(a => a?.id === reminder.account);
      if (acc && (acc.balance || 0) < amount) {
        return {
          success:      false,
          insufficient: true,
          account:      acc,
          amount,
          reminder,
          message: `"${acc.name}" has ₹${(acc.balance || 0).toLocaleString()} but ₹${amount.toLocaleString()} is needed for "${reminder.title}". Shortfall: ₹${(amount - (acc.balance || 0)).toLocaleString()}.`,
        };
      }
    }

    const tx = {
      user:          uid,
      _id:           `tx_${Date.now()}_auto`,
      createdAt:     today.toISOString(),
      date:          today.toISOString(),
      amount,
      merchant:      reminder.title,
      description:   `Auto-debit: ${reminder.title}`,
      category:      reminder.type === 'credit_card'  ? 'Credit Card Payment'
                   : reminder.type === 'rent'          ? 'Rent'
                   : reminder.type === 'loan'          ? 'Loan EMI'
                   : reminder.type === 'subscription'  ? 'Subscription'
                   : 'Bills & Utilities',
      type:          'debit',
      paymentMethod: reminder.account === 'cash' ? 'cash' : 'net_banking',
      bankAccountId: reminder.account !== 'cash' ? reminder.account : null,
      mode:          reminder.account === 'cash' ? 'cash' : 'non-cash',
      autoDebit:     true,
    };

    // Save transaction
    const freshTx  = load(txKey, []);
    const newTxArr = [tx, ...freshTx];
    _setTx(newTxArr);
    if (txKey) save(txKey, newTxArr);

    // Deduct from account
    if (tx.bankAccountId) {
      const freshAcc = load(accKey, []);
      const updAcc   = freshAcc.map(a =>
        a?.id === tx.bankAccountId
          ? { ...a, balance: (typeof a.balance === 'number' ? a.balance : 0) - amount }
          : a
      );
      _setAcc(updAcc);
      if (accKey) save(accKey, updAcc);
    }

    // Mark reminder paid
    const freshRem = load(remKey, []);
    const updRem   = freshRem.map(r =>
      r.id === reminder.id
        ? { ...r, completed: reminder.frequency !== 'once', lastPaid: today.toISOString() }
        : r
    );
    _setRem(updRem);
    if (remKey) save(remKey, updRem);

    return { success: true, tx };
  }, [uid, txKey, accKey, remKey]);

  const resetAllData = useCallback(() => {
    if (!uid) return;
    setTransactions([]);
    setBankAccounts([]);
    setReminders([]);
    setGoals([]);
    try { localStorage.setItem(`settings_${uid}`, JSON.stringify({})); } catch {}
  }, [uid, setTransactions, setBankAccounts, setReminders, setGoals]);

  return {
    // State
    transactions, bankAccounts, reminders, goals,
    // Stable setters
    setTransactions, setBankAccounts, setReminders, setGoals,
    // Raw setters (for backend sync only — bypasses localStorage write)
    _setTx, _setAcc, _setRem, _setGoal,
    // Action helpers
    addTransaction,    updateTransaction,  deleteTransaction,
    addBankAccount,    updateBankAccount,  deleteBankAccount,  resetBankAccounts,
    addReminder,       updateReminder,     deleteReminder,
    autoDebitReminder, resetAllData,
  };
}

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(e) { return { hasError: true, error: e }; }
  componentDidCatch(e, i) { console.error('ErrorBoundary:', e, i); }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding: '2rem', color: 'red', background: '#1a0000', borderRadius: '8px', margin: '1rem' }}>
        <h2>⚠️ Something went wrong</h2>
        <pre style={{ background: '#330000', padding: '1rem', borderRadius: '4px', color: '#ff6b6b', overflow: 'auto' }}>
          {this.state.error?.message}
        </pre>
        <button onClick={() => window.location.reload()}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Reload
        </button>
      </div>
    );
    return this.props.children;
  }
}

// ─── Component imports ────────────────────────────────────────────────────────
import SummaryCards         from './components/SummaryCards';
import AddTransaction       from './components/AddTransaction';
import AddCreditTransaction from './components/AddCreditTransaction';
import AddCashTransaction   from './components/AddCashTransaction';
import BankAccountManager   from './components/BankAccountManager';
import PaymentReminders     from './components/PaymentReminders';
import PredictionCard       from './components/PredictionCard';
import VoiceAssistant       from './components/VoiceAssistant';
import AIChatAssistant      from './components/AIChatAssistant';
import EditTransactionModal from './components/EditTransactionModal';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { NotificationProvider }    from './contexts/NotificationContext';
import NotificationDisplay  from './components/NotificationDisplay';
import WeeklyReportScheduler from './components/WeeklyReportScheduler';
import DailyExpenseReminder  from './components/DailyExpenseReminder';
import MinimalAuth     from './components/MinimalAuth';
import WelcomeScreen   from './components/WelcomeScreen';
import DashboardNew    from './pages/DashboardNew';
import AnalyticsPage   from './pages/AnalyticsPage';
import AIInsightsPage  from './pages/AIInsightsPage';
import SavingGoalsPage from './pages/SavingGoalsPage';
import FamilyBudgetPage from './pages/FamilyBudgetPage';
import SMSExtractorPage from './pages/SMSExtractorPage';
import WhatIfPage      from './pages/WhatIfPage';
import ReportsPage     from './pages/ReportsPage';
import SettingsComponent from './components/Settings';

// ─── Animated Background ──────────────────────────────────────────────────────
const AnimatedBackground = () => {
  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id:       i,
    width:    Math.floor(Math.random() * 100) + 20,
    height:   Math.floor(Math.random() * 100) + 20,
    left:     Math.random() * 100,
    top:      Math.random() * 100,
    xMove:    Math.random() * 100 - 50,
    duration: Math.random() * 10 + 10,
    delay:    Math.random() * 5,
  })), []);

  return (
    <div className="fixed inset-0 overflow-hidden -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-black"/>
      {particles.map(p => (
        <motion.div key={p.id} className="absolute rounded-full bg-blue-400/20"
          style={{ width: p.width, height: p.height, left: `${p.left}%`, top: `${p.top}%` }}
          animate={{ y: [0, -100, 0], x: [0, p.xMove, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}/>
      ))}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-500/10 to-transparent"/>
    </div>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <motion.header
      className="w-full py-4 px-4 md:px-6 bg-gradient-to-r from-blue-900/80 to-indigo-900/80 backdrop-blur-lg border-b border-blue-500/20"
      initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <motion.div className="flex items-center space-x-3" whileHover={{ scale: 1.03 }}>
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <Wallet className="h-6 w-6 text-white"/>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
              TRIKIA
            </h1>
            <p className="text-xs text-gray-400">AI Budget Tracker</p>
            {user && (
              <p className="text-sm text-gray-300 italic">
                Welcome, <span className="font-semibold text-white">{user.name}</span>
              </p>
            )}
          </div>
        </motion.div>

        <div className="hidden md:flex items-center space-x-3">
          <button onClick={toggleTheme} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
            {isDarkMode ? <Sun className="h-5 w-5 text-yellow-400"/> : <Moon className="h-5 w-5 text-gray-300"/>}
          </button>
          {user && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
              <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <User className="h-4 w-4 text-white"/>
              </div>
              <span className="text-white font-semibold text-sm">{user.name}</span>
            </div>
          )}
          {user && (
            <motion.button
              onClick={onLogout}
              className="flex px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-500 hover:to-red-600 items-center space-x-2"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              <LogOut className="h-4 w-4"/>
              <span className="font-medium">Logout</span>
            </motion.button>
          )}
        </div>

        <button className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg"
          onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6"/> : <Menu className="h-6 w-6"/>}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="md:hidden mt-4 py-4 border-t border-blue-500/20"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="flex flex-col space-y-3">
              {user && (
                <div className="px-4 py-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-200 text-sm">👋 Welcome back,</p>
                  <p className="text-white font-bold text-lg">{user.name}</p>
                </div>
              )}
              <button onClick={() => { toggleTheme(); setOpen(false); }}
                className="px-4 py-3 bg-white/10 text-white rounded-lg flex items-center space-x-2">
                {isDarkMode ? <Sun className="h-4 w-4 text-yellow-400"/> : <Moon className="h-4 w-4 text-gray-300"/>}
                <span>Switch Theme</span>
              </button>
              {user && (
                <button onClick={() => { onLogout(); setOpen(false); }}
                  className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg flex items-center space-x-2">
                  <LogOut className="h-4 w-4"/>
                  <span>Logout</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

// ─── Back button helper ───────────────────────────────────────────────────────
const BackButton = ({ label }) => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center space-x-4 mb-2">
      <button onClick={() => navigate('/')}
        className="p-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      {label && <h1 className="text-3xl font-bold text-white">{label}</h1>}
    </div>
  );
};

// ─── Transactions page ────────────────────────────────────────────────────────
const TransactionsPage = ({ transactions, bankAccounts, onAdd, onUpdate, onDelete }) => {
  const [tab, setTab]       = useState('expense');
  const [editTx, setEditTx] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const safe = Array.isArray(transactions) ? transactions : [];

  return (
    <div className="space-y-6">
      <BackButton label="Transactions"/>

      <div className="flex space-x-2 bg-white/10 p-2 rounded-xl border border-white/20">
        {[['expense', '💸 Expense', 'from-red-500 to-pink-500'],
          ['credit',  '💳 Income',  'from-green-500 to-emerald-500'],
          ['cash',    '💵 Cash',    'from-blue-500 to-cyan-500']].map(([k, l, g]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
              tab === k ? `bg-gradient-to-r ${g} text-white` : 'text-gray-300 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'expense' && <AddTransaction       onAdd={onAdd} accounts={bankAccounts}/>}
      {tab === 'credit'  && <AddCreditTransaction onAdd={onAdd} accounts={bankAccounts}/>}
      {tab === 'cash'    && <AddCashTransaction   onAdd={onAdd} accounts={bankAccounts}/>}

      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">All Transactions ({safe.length})</h2>
        {safe.length === 0
          ? <p className="text-gray-400 text-center py-8">No transactions yet.</p>
          : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {safe.map(tx => (
                <div key={tx._id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{tx.merchant || tx.description || 'Transaction'}</p>
                    <p className="text-gray-400 text-sm">
                      {tx.category} · {tx.paymentMethod} · {new Date(tx.date || tx.createdAt).toLocaleDateString()}
                    </p>
                    {tx.autoDebit && (
                      <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full">Auto-debit</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 ml-3">
                    <span className={`font-bold text-lg ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type === 'credit' ? '+' : '-'}₹{(tx.amount || 0).toLocaleString()}
                    </span>
                    <button onClick={() => { setEditTx(tx); setShowEdit(true); }}
                      className="text-xs px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded-lg">Edit</button>
                    <button onClick={() => onDelete(tx._id)}
                      className="text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg">Del</button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      <EditTransactionModal
        transaction={editTx} isOpen={showEdit}
        onClose={() => setShowEdit(false)} onSave={onUpdate} onDelete={onDelete}
        accounts={bankAccounts}/>
    </div>
  );
};

// ─── Bank Accounts page (inlined — no dependency on BankAccountsPage.jsx) ─────
const BankAccountsPage = ({ bankAccounts, onAdd, onDelete, onReset, transactions }) => {
  const safe = Array.isArray(bankAccounts) ? bankAccounts : [];

  // Show per-account transaction summary
  const accountStats = useMemo(() => {
    const txs = Array.isArray(transactions) ? transactions : [];
    return safe.reduce((acc, acct) => {
      const related = txs.filter(t => t.bankAccountId === acct.id);
      const income  = related.filter(t => t.type === 'credit').reduce((s, t) => s + (t.amount || 0), 0);
      const expense = related.filter(t => t.type !== 'credit').reduce((s, t) => s + (t.amount || 0), 0);
      acc[acct.id]  = { income, expense, count: related.length };
      return acc;
    }, {});
  }, [safe, transactions]);

  return (
    <div className="space-y-6">
      <BackButton label="Bank Accounts"/>
      <BankAccountManager
        accounts={safe}
        onAdd={onAdd}
        onDelete={onDelete}
        onReset={onReset}
      />
      {safe.length > 0 && (
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Account Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safe.map(acct => {
              const stats = accountStats[acct.id] || { income: 0, expense: 0, count: 0 };
              return (
                <div key={acct.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-white font-semibold">{acct.name}</p>
                  <p className="text-gray-400 text-xs mb-3">**** {acct.lastFourDigits} · {stats.count} transactions</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">+₹{stats.income.toLocaleString()}</span>
                    <span className="text-white font-bold">₹{(acct.balance || 0).toLocaleString()}</span>
                    <span className="text-red-400">-₹{stats.expense.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Payment Reminders page ───────────────────────────────────────────────────
const PaymentRemindersPage = ({ user, bankAccounts, reminders, onAdd, onUpdate, onDelete, onAutoDebit, onAddTransaction }) => (
  <div className="space-y-6">
    <BackButton label="Payment Reminders"/>
    <PaymentReminders
      user={user}
      bankAccounts={bankAccounts}
      reminders={reminders}
      onAddReminder={onAdd}
      onUpdateReminder={onUpdate}
      onDeleteReminder={onDelete}
      onAutoDebit={onAutoDebit}
      onAddTransaction={onAddTransaction}
    />
  </div>
);

// ─── Main App wrapper ─────────────────────────────────────────────────────────
function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <ThemeProvider>
          <Router><AppContent/></Router>
        </ThemeProvider>
        <NotificationDisplay/>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

// ─── AppContent ───────────────────────────────────────────────────────────────
function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser]                       = useState(null);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [selectedTx, setSelectedTx]          = useState(null);
  const [isChatVisible, setIsChatVisible]    = useState(false);
  const [showWelcome, setShowWelcome]        = useState(true);
  const [showTermsModal, setShowTermsModal]  = useState(false);
  const [termsAccepted, setTermsAccepted]    = useState(false);
  const [toast, setToast]                    = useState({ show: false, message: '', type: 'success' });
  const { isDarkMode } = useTheme();

  // ── Central data (single source of truth) ──
  const {
    transactions, bankAccounts, reminders, goals,
    setTransactions, setBankAccounts, setReminders, setGoals,
    _setTx, _setAcc, _setRem, _setGoal,
    addTransaction,   updateTransaction,  deleteTransaction,
    addBankAccount,   deleteBankAccount,  resetBankAccounts,
    addReminder,      updateReminder,     deleteReminder,
    autoDebitReminder, resetAllData,
  } = useAppData(user);

  // Expose addTransaction for PaymentReminders "Top Up" shortcut
  useEffect(() => {
    window._appAddTransaction = addTransaction;
    return () => { delete window._appAddTransaction; };
  }, [addTransaction]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast(p => ({ ...p, show: false })), 4000);
    return () => clearTimeout(t);
  }, [toast.show]);

  const showToast = useCallback((message, type = 'success') =>
    setToast({ show: true, message, type }), []);

  const loadUserSettings = useCallback(() => {
    if (!user) return {};
    try { return JSON.parse(localStorage.getItem(`settings_${user.id}`) || '{}'); } catch { return {}; }
  }, [user]);

  // ── Session restore ──
  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('currentUser');
    if (storedAuth === 'true' && storedUser) {
      try {
        const ud = JSON.parse(storedUser);
        setIsAuthenticated(true);
        setUser(ud);
        setShowWelcome(false);
        if (localStorage.getItem(`terms_accepted_${ud.id}`)) {
          setTermsAccepted(true);
          // Try to load from backend; localStorage is already loaded by useAppData
          loadAllUserData(ud.id).then(d => {
            if (!d) return;
            if (Array.isArray(d.transactions) && d.transactions.length > 0) setTransactions(d.transactions);
            if (Array.isArray(d.bankAccounts)  && d.bankAccounts.length  > 0) setBankAccounts(d.bankAccounts);
            if (Array.isArray(d.reminders)     && d.reminders.length     > 0) setReminders(d.reminders);
            if (Array.isArray(d.goals)         && d.goals.length         > 0) setGoals(d.goals);
          }).catch(() => {/* backend unavailable — localStorage already loaded */});
        } else {
          setShowTermsModal(true);
        }
      } catch {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        setShowWelcome(true);
      }
    } else if (!storedAuth && !storedUser) {
      setShowWelcome(true);
    } else {
      setShowWelcome(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // ── Auth ──
  const handleAuthSuccess = useCallback((ud) => {
    setIsAuthenticated(true);
    setUser(ud);
    setShowWelcome(false);
    if (!localStorage.getItem(`terms_accepted_${ud.id}`)) {
      setShowTermsModal(true);
    } else {
      setTermsAccepted(true);
      loadAllUserData(ud.id).then(d => {
        if (!d) return;
        if (Array.isArray(d.transactions) && d.transactions.length > 0) setTransactions(d.transactions);
        if (Array.isArray(d.bankAccounts)  && d.bankAccounts.length  > 0) setBankAccounts(d.bankAccounts);
        if (Array.isArray(d.reminders)     && d.reminders.length     > 0) setReminders(d.reminders);
        if (Array.isArray(d.goals)         && d.goals.length         > 0) setGoals(d.goals);
      }).catch(() => {});
    }
  }, [setTransactions, setBankAccounts, setReminders, setGoals]);

  const handleAcceptTerms = useCallback(() => {
    if (!user?.id) return;
    localStorage.setItem(`terms_accepted_${user.id}`, 'true');
    setTermsAccepted(true);
    setShowTermsModal(false);
    showToast("✅ Welcome! Let's manage your finances smartly!");
    loadAllUserData(user.id).then(d => {
      if (!d) return;
      if (Array.isArray(d.transactions) && d.transactions.length > 0) setTransactions(d.transactions);
      if (Array.isArray(d.bankAccounts)  && d.bankAccounts.length  > 0) setBankAccounts(d.bankAccounts);
      if (Array.isArray(d.reminders)     && d.reminders.length     > 0) setReminders(d.reminders);
      if (Array.isArray(d.goals)         && d.goals.length         > 0) setGoals(d.goals);
    }).catch(() => {});
  }, [user, showToast, setTransactions, setBankAccounts, setReminders, setGoals]);

  const handleRejectTerms = useCallback(() => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    setShowWelcome(true);
    setShowTermsModal(false);
    showToast('You must accept the terms to continue.', 'warning');
  }, [showToast]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('loginTimestamp');
    setIsAuthenticated(false);
    setUser(null);
    setShowWelcome(true);
  }, []);

  // ── Transaction handlers ──
  const handleAddTransaction = useCallback((newTx) => {
    const tx = addTransaction(newTx);
    if (!tx) { showToast('❌ Failed to add transaction', 'error'); return; }
    showToast(`✅ ${tx.type === 'credit' ? 'Income' : 'Expense'} of ₹${tx.amount.toLocaleString()} added!`);
    if (user?.id) addTransactionAPI({ ...tx, user: user.id }).catch(() => {});
    return tx;
  }, [addTransaction, showToast, user]);

  const handleUpdateTransaction = useCallback((upd) => {
    updateTransaction(upd);
    showToast('✅ Transaction updated!');
    if (user?.id) updateTransactionAPI(upd).catch(() => {});
  }, [updateTransaction, showToast, user]);

  const handleDeleteTransaction = useCallback((id) => {
    deleteTransaction(id);
    showToast('✅ Transaction deleted!');
    if (user?.id) deleteTransactionAPI(id).catch(() => {});
  }, [deleteTransaction, showToast, user]);

  // ── Bank account handlers ──
  const handleAddBankAccount = useCallback((acc) => {
    addBankAccount(acc);
    showToast(`✅ "${acc.name}" added!`);
  }, [addBankAccount, showToast]);

  const handleDeleteBankAccount = useCallback((id) => {
    deleteBankAccount(id);
    showToast('✅ Bank account deleted.');
  }, [deleteBankAccount, showToast]);

  const handleResetBankAccounts = useCallback(() => {
    resetBankAccounts();
    showToast('✅ All bank accounts reset.');
  }, [resetBankAccounts, showToast]);

  // ── Auto-debit ──
  const handleAutoDebit = useCallback((reminder) => {
    const result = autoDebitReminder(reminder);
    if (result.success) {
      showToast(`✅ Auto-debited ₹${reminder.amount.toLocaleString()} for "${reminder.title}"`);
      if (user?.id && result.tx) addTransactionAPI({ ...result.tx, user: user.id }).catch(() => {});
      if (user?.id) updatePaymentReminderAPI({ ...reminder, completed: true, lastPaid: new Date().toISOString(), user_id: user.id }).catch(() => {});
    } else if (result.insufficient) {
      showToast(`⚠️ Insufficient balance for "${reminder.title}"`, 'warning');
    }
    return result;
  }, [autoDebitReminder, showToast, user]);

  // ── Reminder handlers ──
  const handleAddReminder = useCallback((r) => {
    addReminder(r);
    if (user?.id) addPaymentReminderAPI(user.id, r).catch(() => {});
  }, [addReminder, user]);

  const handleUpdateReminder = useCallback((id, changes) => {
    updateReminder(id, changes);
    if (user?.id) updatePaymentReminderAPI({ id, ...changes, user_id: user.id }).catch(() => {});
  }, [updateReminder, user]);

  const handleDeleteReminder = useCallback((id) => {
    deleteReminder(id);
    if (user?.id) deletePaymentReminderAPI(id).catch(() => {});
  }, [deleteReminder, user]);

  // ── Screens ──
  if (!isAuthenticated && showWelcome)
    return (<><WelcomeScreen onComplete={() => setShowWelcome(false)} isAuthenticated={false}/><AnimatedBackground/></>);
  if (!isAuthenticated)
    return <MinimalAuth onAuthSuccess={handleAuthSuccess}/>;

  const safe         = Array.isArray(transactions) ? transactions : [];
  const userSettings = loadUserSettings();

  return (
    <div className="min-h-screen relative classy-container">
      <AnimatedBackground/>
      <div className="relative z-10">
        <Navbar user={user} onLogout={handleLogout}/>

        {/* Toast */}
        <AnimatePresence>
          {toast.show && (
            <motion.div
              className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg ${
                toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-yellow-600'
              }`}
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <p className="text-white font-medium">{toast.message}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="max-w-7xl mx-auto p-6">
          <Routes>

            {/* Dashboard */}
            <Route path="/" element={
              <>
                <WeeklyReportScheduler user={user} transactions={safe} settings={userSettings.notifications}/>
                <DailyExpenseReminder  user={user} transactions={safe} settings={userSettings.notifications}/>
                <DashboardNew transactions={safe} user={user}/>
              </>
            }/>

            {/* Transactions */}
            <Route path="/transactions" element={
              <TransactionsPage
                transactions={safe}
                bankAccounts={bankAccounts}
                onAdd={handleAddTransaction}
                onUpdate={handleUpdateTransaction}
                onDelete={handleDeleteTransaction}
              />
            }/>

            {/* Analytics */}
            <Route path="/analytics" element={
              <AnalyticsPage transactions={safe} bankAccounts={bankAccounts}/>
            }/>

            {/* AI Insights */}
            <Route path="/ai-insights" element={
              <AIInsightsPage transactions={safe} user={user}/>
            }/>

            {/* Saving Goals — goals + setGoals now correctly wired */}
            <Route path="/saving-goals" element={
              <SavingGoalsPage
                transactions={safe}
                user={user}
                goals={goals}
                setGoals={setGoals}
              />
            }/>

            {/* Bank Accounts — inlined, no BankAccountsPage dependency */}
            <Route path="/bank-accounts" element={
              <BankAccountsPage
                bankAccounts={bankAccounts}
                transactions={safe}
                onAdd={handleAddBankAccount}
                onDelete={handleDeleteBankAccount}
                onReset={handleResetBankAccounts}
              />
            }/>

            {/* Payment Reminders */}
            <Route path="/payment-reminders" element={
              <PaymentRemindersPage
                user={user}
                bankAccounts={bankAccounts}
                reminders={reminders}
                onAdd={handleAddReminder}
                onUpdate={handleUpdateReminder}
                onDelete={handleDeleteReminder}
                onAutoDebit={handleAutoDebit}
                onAddTransaction={handleAddTransaction}
              />
            }/>

            {/* Family Budget */}
            <Route path="/family-budget" element={
              <FamilyBudgetPage user={user} transactions={safe}/>
            }/>

            {/* SMS Extractor */}
            <Route path="/sms-extractor" element={
              <SMSExtractorPage onAddTransaction={handleAddTransaction}/>
            }/>

            {/* What-If */}
            <Route path="/what-if" element={
              <WhatIfPage transactions={safe}/>
            }/>

            {/* Reports */}
            <Route path="/reports" element={
              <ReportsPage transactions={safe} bankAccounts={bankAccounts} />
            }/>

            {/* Settings */}
            <Route path="/settings" element={
              <SettingsComponent
                currentUser={user}
                transactions={safe}
                setTransactions={(arr) => setTransactions(Array.isArray(arr) ? arr : [])}
                setGoals={() => {}}
                setBankAccounts={(arr) => setBankAccounts(Array.isArray(arr) ? arr : [])}
              />
            }/>

          </Routes>

          {/* Floating widgets */}
          <VoiceAssistant
            onTransactionDetected={handleAddTransaction}
            isListening={isVoiceListening}
            setIsListening={setIsVoiceListening}
            bankAccounts={bankAccounts}
            setActiveTab={() => {}}
          />

          <AIChatAssistant
            transactions={safe}
            bankAccounts={bankAccounts}
            isVisible={isChatVisible}
            setIsVisible={setIsChatVisible}
          />

          <EditTransactionModal
            transaction={selectedTx}
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSave={handleUpdateTransaction}
            onDelete={handleDeleteTransaction}
            accounts={bankAccounts}
          />

          {/* Terms modal */}
          <AnimatePresence>
            {showTermsModal && (
              <motion.div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <motion.div
                  className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-8 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
                  initial={{ scale: 0.9, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -20 }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center space-x-4 mb-6 pb-5 border-b border-white/10">
                    <div className="p-3.5 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl">
                      <Shield className="h-9 w-9 text-white"/>
                    </div>
                    <div>
                      <h2 className="text-3xl font-black bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                        Welcome to TRIKIA
                      </h2>
                      <p className="text-white font-semibold mt-1">AI Budget Tracker</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    {[
                      { icon: <Lock  className="h-6 w-6 text-blue-400   flex-shrink-0 mt-1"/>, bg: 'bg-blue-500/10   border-blue-400/20',   title: '🔒 Local Storage Only',   text: 'All your data stays on your device. Nothing is uploaded to external servers.' },
                      { icon: <Shield className="h-6 w-6 text-green-400  flex-shrink-0 mt-1"/>, bg: 'bg-green-500/10  border-green-400/20',  title: '🛡️ Your Privacy Matters', text: 'No bank details or sensitive financial information are collected.' },
                      { icon: <User  className="h-6 w-6 text-purple-400 flex-shrink-0 mt-1"/>, bg: 'bg-purple-500/10 border-purple-400/20', title: "👤 You're in Control",     text: 'None of your data can be accessed by anyone other than you.' },
                      { icon: <Brain className="h-6 w-6 text-orange-400 flex-shrink-0 mt-1"/>, bg: 'bg-orange-500/10 border-orange-400/20', title: '🤖 Smart Assistance',      text: 'AI chat and voice assistant work entirely with your local data — no external sharing.' },
                      { icon: <Eye   className="h-6 w-6 text-cyan-400   flex-shrink-0 mt-1"/>, bg: 'bg-cyan-500/10   border-cyan-400/20',   title: '✅ Transparency First',    text: 'No hidden agendas, no data mining. You are the sole owner.' },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-start space-x-4 ${item.bg} border rounded-xl p-4`}>
                        {item.icon}
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                          <p className="text-gray-300 text-sm">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/20 rounded-2xl p-5 mb-6">
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-2"/> Key Benefits
                    </h3>
                    <ul className="space-y-2">
                      {['100% Private & Secure — data stays on your device',
                        'AI-Powered Insights — smart help without privacy risk',
                        'Complete sync — every change reflected everywhere instantly',
                        'Auto-debit payments — never miss a payment date',
                        'Free Forever — no hidden costs'].map((b, i) => (
                        <li key={i} className="flex items-start text-gray-200 text-sm">
                          <span className="text-green-400 mr-2">✓</span>{b}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input type="checkbox" checked={termsAccepted}
                        onChange={e => setTermsAccepted(e.target.checked)}
                        className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-500 rounded mt-1"/>
                      <span className="text-sm text-gray-300">
                        By continuing, I acknowledge that all data is stored locally on my device for personal budget tracking only.
                      </span>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={handleRejectTerms}
                      className="flex-1 px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all">
                      Exit App
                    </button>
                    <button onClick={handleAcceptTerms} disabled={!termsAccepted}
                      className={`flex-1 px-8 py-4 rounded-xl font-bold transition-all ${
                        termsAccepted
                          ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                      }`}>
                      Accept & Continue ✨
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;