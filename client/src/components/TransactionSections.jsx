import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Filter,
  Eye,
  EyeOff,
  Search,
  Calendar,
  Hash
} from 'lucide-react';

const TransactionSections = ({ transactions = [], bankAccounts = [], onEditTransaction, onDeleteTransaction }) => {
  const [activeView, setActiveView] = useState('all'); // 'all', 'account-<id>'
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'week', 'month', 'year'
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all'); // 'all', 'upi', 'netbanking', 'creditcard', 'debitcard', 'cash'
  const [showAmounts, setShowAmounts] = useState(true);
  
  // Defensive checks - ensure arrays
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeBankAccounts = Array.isArray(bankAccounts) ? bankAccounts : [];

  // Filter transactions based on search and date
  const filterTransactions = (transactionsToFilter) => {
    let filtered = Array.isArray(transactionsToFilter) ? transactionsToFilter : [];

    // Date filtering
    if (dateFilter !== 'all') {
      const now = new Date();
      let filterDate;
      
      switch (dateFilter) {
        case 'week':
          filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          break;
        case 'month':
          filterDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case 'year':
          filterDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          filterDate = new Date(0);
      }
      
      filtered = filtered.filter(tx => {
        try {
          return new Date(tx?.date || Date.now()) >= filterDate;
        } catch (e) {
          return false;
        }
      });
    }

    // Payment method filtering
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(tx => {
        const txPaymentMethod = tx?.paymentMethod?.toLowerCase() || '';
        switch (paymentMethodFilter) {
          case 'upi':
            return txPaymentMethod === 'upi';
          case 'netbanking':
            return txPaymentMethod === 'netbanking';
          case 'creditcard':
            return txPaymentMethod === 'creditcard';
          case 'debitcard':
            return txPaymentMethod === 'debitcard';
          case 'cash':
            return txPaymentMethod === 'cash';
          default:
            return true;
        }
      });
    }

    // Search filtering
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx?.merchant?.toLowerCase().includes(searchLower) ||
        tx?.category?.toLowerCase().includes(searchLower) ||
        tx?.description?.toLowerCase().includes(searchLower) ||
        tx?.amount?.toString().includes(searchTerm)
      );
    }

    return filtered.sort((a, b) => {
      try {
        return new Date(b?.date || Date.now()) - new Date(a?.date || Date.now());
      } catch (e) {
        return 0;
      }
    });
  };

  // Get transactions for a specific account
  const getAccountTransactions = (accountId) => {
    return safeTransactions.filter(tx => tx?.bankAccountId === accountId);
  };

  // Get account by ID
  const getAccountById = (accountId) => {
    return safeBankAccounts.find(acc => acc?.id === accountId);
  };

  // Format currency
  const formatAmount = (amount) => {
    if (!showAmounts) return '••••';
    return `₹${amount?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0.00'}`;
  };

  // Get all unique categories
  const getCategories = () => {
    const categories = [...new Set(safeTransactions.map(tx => tx?.category || 'Other'))];
    return categories.filter(cat => cat).sort();
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl classy-element"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Transactions</h2>
            <p className="text-sm text-gray-400">View and manage all your transactions</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAmounts(!showAmounts)}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          title={showAmounts ? "Hide amounts" : "Show amounts"}
        >
          {showAmounts ? <Eye className="h-4 w-4 text-white" /> : <EyeOff className="h-4 w-4 text-white" />}
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveView('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'all'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          All Transactions
        </button>
        
        {safeBankAccounts.map(account => (
          <button
            key={account?.id}
            onClick={() => setActiveView(`account-${account?.id}`)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
              activeView === `account-${account?.id}`
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <span>{account?.name || 'Unknown'}</span>
            <span className="text-xs opacity-75">(****{account?.lastFourDigits || ''})</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date Filter */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="all" className="bg-gray-800">All Time</option>
            <option value="week" className="bg-gray-800">Last Week</option>
            <option value="month" className="bg-gray-800">Last Month</option>
            <option value="year" className="bg-gray-800">Last Year</option>
          </select>
        </div>

        {/* Payment Method Filter */}
        <div className="relative">
          <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="all" className="bg-gray-800">All Payment Methods</option>
            <option value="upi" className="bg-gray-800">UPI</option>
            <option value="netbanking" className="bg-gray-800">Net Banking</option>
            <option value="creditcard" className="bg-gray-800">Credit Card</option>
            <option value="debitcard" className="bg-gray-800">Debit Card</option>
            <option value="cash" className="bg-gray-800">Cash</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            onChange={(e) => {
              if (e.target.value) {
                setSearchTerm(e.target.value);
              }
            }}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="" className="bg-gray-800">Filter by Category</option>
            {getCategories().map(category => (
              <option key={category} value={category} className="bg-gray-800">
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activeView === 'all' ? (
          // All Transactions View - FIXED: Use safeTransactions instead of raw transactions prop
          filterTransactions(safeTransactions).length > 0 ? (
            filterTransactions(safeTransactions).map((transaction) => {
              // Safe field access with defaults
              const txAmount = typeof transaction?.amount === 'number' ? transaction.amount : 0;
              const txDate = new Date(transaction?.date || transaction?.createdAt || Date.now());
              const txCategory = transaction?.category || 'Other';
              const txMerchant = transaction?.merchant || 'Unknown Merchant';
              const txType = transaction?.type || 'debit';
              const txId = transaction?._id || transaction?.id || 'unknown';
              
              const account = getAccountById(transaction?.bankAccountId);
              
              return (
                <motion.div
                  key={`${txId}`}
                  className="p-4 bg-white/5 rounded-xl border border-white/10 classy-element flex justify-between items-center hover:bg-white/10 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <div className={`p-1 rounded ${txType === 'credit' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {txType === 'credit' ? 
                          <TrendingUp className="h-3 w-3 text-green-400" /> : 
                          <TrendingDown className="h-3 w-3 text-red-400" />
                        }
                      </div>
                      <div className="font-medium text-white">{txMerchant}</div>
                      {account && (
                        <div className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded">
                          {account.name || 'Unknown'} (****{account?.lastFourDigits || ''})
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>{txCategory}</span>
                      <span>•</span>
                      <span>{txDate.toLocaleDateString()}</span>
                      {transaction?.description && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-xs">{transaction.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`font-semibold text-lg ${txType === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                      {txType === 'credit' ? '+' : '-'}{formatAmount(txAmount)}
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => onEditTransaction && onEditTransaction(transaction)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                        title="Edit transaction"
                      >
                        <Hash className="w-4 h-4 text-blue-300" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this transaction?')) {
                            onDeleteTransaction && onDeleteTransaction(txId);
                          }
                        }}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                        title="Delete transaction"
                      >
                        <TrendingDown className="w-4 h-4 text-red-300" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No transactions found</h3>
              <p className="text-gray-400">
                {searchTerm || dateFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Add your first transaction to get started'}
              </p>
            </div>
          )
        ) : (
          // Individual Account View
          (() => {
            const accountId = activeView.split('-')[1];
            const account = getAccountById(accountId);
            const accountTransactions = filterTransactions(getAccountTransactions(accountId));
            
            return accountTransactions.length > 0 ? (
              <>
                <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-white">{account.name}</h3>
                      <p className="text-sm text-gray-400">**** **** **** {account.lastFourDigits}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Account Balance</p>
                      <p className="text-xl font-bold text-white">
                        {formatAmount(
                          accountTransactions
                            .filter(tx => tx.type === 'credit')
                            .reduce((sum, tx) => sum + (tx.amount || 0), 0) -
                          accountTransactions
                            .filter(tx => tx.type === 'debit')
                            .reduce((sum, tx) => sum + (tx.amount || 0), 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                {accountTransactions.map((transaction) => {
                  // Safe field access with defaults
                  const txAmount = typeof transaction?.amount === 'number' ? transaction.amount : 0;
                  const txDate = new Date(transaction?.date || transaction?.createdAt || Date.now());
                  const txCategory = transaction?.category || 'Other';
                  const txMerchant = transaction?.merchant || 'Unknown Merchant';
                  const txType = transaction?.type || 'debit';
                  const txId = transaction?._id || transaction?.id || 'unknown';
                  
                  return (
                    <motion.div
                      key={`${txId}`}
                      className="p-4 bg-white/5 rounded-xl border border-white/10 classy-element flex justify-between items-center hover:bg-white/10 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <div className={`p-1 rounded ${txType === 'credit' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            {txType === 'credit' ? 
                              <TrendingUp className="h-3 w-3 text-green-400" /> : 
                              <TrendingDown className="h-3 w-3 text-red-400" />
                            }
                          </div>
                          <div className="font-medium text-white">{txMerchant}</div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>{txCategory}</span>
                          <span>•</span>
                          <span>{txDate.toLocaleDateString()}</span>
                          {transaction?.description && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-xs">{transaction.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className={`font-semibold text-lg ${txType === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                          {txType === 'credit' ? '+' : '-'}{formatAmount(txAmount)}
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => onEditTransaction && onEditTransaction(transaction)}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                            title="Edit transaction"
                          >
                            <Hash className="w-4 h-4 text-blue-300" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this transaction?')) {
                                onDeleteTransaction && onDeleteTransaction(txId);
                              }
                            }}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                            title="Delete transaction"
                          >
                            <TrendingDown className="w-4 h-4 text-red-300" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-12">
                <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No transactions for this account</h3>
                <p className="text-gray-400">
                  {searchTerm || dateFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Add transactions to this account to see them here'}
                </p>
              </div>
            );
          })()
        )}
      </div>
    </motion.div>
  );
};

export default TransactionSections;