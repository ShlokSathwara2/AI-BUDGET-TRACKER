import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CreditCard, X, Wallet } from 'lucide-react';

/**
 * FULLY CONTROLLED — no internal `accounts` state.
 * The parent (App via useAppData) owns the accounts array and persists it.
 *
 * Props:
 *   accounts       : array  — live accounts from App state
 *   onAdd(obj)     : called when user adds a new account
 *   onDelete(id)   : called when user deletes an account
 *   onReset()      : called when user resets all accounts
 *
 * Why this matters: the old version had its own useState copy of accounts AND
 * called onUpdateAccounts inside a useEffect that listed it as a dependency.
 * This caused an infinite re-render loop that reset state to [] on every
 * navigation. Removing internal accounts state fixes this permanently.
 */
const BankAccountManager = ({ accounts = [], onAdd, onDelete, onReset }) => {
  const safeAccounts = Array.isArray(accounts) ? accounts : [];

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccount, setNewAccount]   = useState({ name: '', lastFourDigits: '' });
  const [errors, setErrors]           = useState({});

  const validateForm = () => {
    const e = {};
    if (!newAccount.name.trim())
      e.name = 'Account name is required';
    if (!newAccount.lastFourDigits.trim())
      e.lastFourDigits = 'Last 4 digits are required';
    else if (!/^\d{4}$/.test(newAccount.lastFourDigits))
      e.lastFourDigits = 'Must be exactly 4 digits';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddAccount = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const duplicate = safeAccounts.some(
      acc => acc &&
        (acc.name.toLowerCase() === newAccount.name.toLowerCase() ||
         acc.lastFourDigits === newAccount.lastFourDigits)
    );
    if (duplicate) {
      alert('An account with this name or last 4 digits already exists.');
      return;
    }

    onAdd && onAdd({
      id:             `acc_${Date.now()}`,
      name:           newAccount.name.trim(),
      lastFourDigits: newAccount.lastFourDigits,
      balance:        0,
      createdAt:      new Date().toISOString(),
    });

    setNewAccount({ name: '', lastFourDigits: '' });
    setErrors({});
    setShowAddForm(false);
  };

  const handleDeleteAccount = (id) => {
    if (!id) return;
    if (window.confirm('Delete this bank account? This cannot be undone.')) {
      onDelete && onDelete(id);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset ALL bank accounts? Balances will be cleared.')) {
      onReset && onReset();
    }
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-2 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Bank Accounts</h2>
            <p className="text-sm text-gray-400">
              {safeAccounts.length} account{safeAccounts.length !== 1 ? 's' : ''} · entries persist across navigation
            </p>
          </div>
        </div>
        <motion.button
          onClick={() => setShowAddForm(true)}
          className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-500 hover:to-indigo-500 transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Account List */}
      <div className="space-y-4">
        <AnimatePresence>
          {safeAccounts.length === 0 ? (
            <motion.div
              className="text-center py-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-5" />
              <h3 className="text-lg font-semibold text-white mb-3">No Bank Accounts</h3>
              <p className="text-gray-400">Add your first bank account to get started</p>
            </motion.div>
          ) : (
            safeAccounts.map((account) => (
              <motion.div
                key={account.id}
                className="flex items-center justify-between p-5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{account.name}</h3>
                    <p className="text-sm text-gray-400">**** **** **** {account.lastFourDigits}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-white font-medium">
                    ₹{(account.balance || 0).toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-all duration-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Add Account Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-xl font-bold text-white mb-6">Add New Bank Account</h3>
              <form onSubmit={handleAddAccount} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Account Name</label>
                  <input
                    type="text"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    placeholder="e.g., HDFC Savings, SBI Current"
                    className={`w-full px-4 py-4 bg-black/30 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.name ? 'border-red-500' : 'border-white/20'
                    }`}
                  />
                  {errors.name && <p className="text-red-400 text-sm mt-2">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Last 4 Digits</label>
                  <input
                    type="text"
                    value={newAccount.lastFourDigits}
                    onChange={(e) =>
                      setNewAccount({
                        ...newAccount,
                        lastFourDigits: e.target.value.replace(/\D/g, '').slice(0, 4),
                      })
                    }
                    placeholder="e.g., 1234"
                    maxLength="4"
                    className={`w-full px-4 py-4 bg-black/30 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.lastFourDigits ? 'border-red-500' : 'border-white/20'
                    }`}
                  />
                  {errors.lastFourDigits && (
                    <p className="text-red-400 text-sm mt-2">{errors.lastFourDigits}</p>
                  )}
                </div>

                <div className="flex space-x-4 mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewAccount({ name: '', lastFourDigits: '' });
                      setErrors({});
                    }}
                    className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg transition-all"
                  >
                    Add Account
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset */}
      {safeAccounts.length > 0 && (
        <div className="mt-8 pt-6 border-t border-white/10">
          <button
            onClick={handleReset}
            className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>Reset All Bank Accounts</span>
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default BankAccountManager;