import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Wallet, User, BarChart3, FileText, Settings, Home, LogOut, Sun, Moon, Calculator, AlertTriangle, MessageSquare, PiggyBank, Edit3, Trash2, Users, Shield, Lock, CheckCircle, Brain, Eye } from 'lucide-react';

// Toast notification state - replaces blocking alert() calls
let globalSetToast = null; // Will be set by AppContent component

// Error Boundary Component to catch and display errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'red', backgroundColor: '#1a0000', borderRadius: '8px', margin: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⚠️ Something went wrong:</h2>
          <pre style={{ 
            backgroundColor: '#330000', 
            padding: '1rem', 
            borderRadius: '4px', 
            overflow: 'auto',
            color: '#ff6b6b',
            fontFamily: 'monospace',
            fontSize: '0.9rem'
          }}>
            {this.state.error?.message || 'Unknown error occurred'}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import SummaryCards from './components/SummaryCards';
import AddTransaction from './components/AddTransaction';
import AddCreditTransaction from './components/AddCreditTransaction';
import AddCashTransaction from './components/AddCashTransaction';
import Analytics from './components/Analytics';
import BankAccountManager from './components/BankAccountManager';
import BankAccountGraphs from './components/BankAccountGraphs';
import PaymentReminders from './components/PaymentReminders';
import PredictionCard from './components/PredictionCard';
import VoiceAssistant from './components/VoiceAssistant';
import AIChatAssistant from './components/AIChatAssistant';
import TransactionSections from './components/TransactionSections';
import Transactions from './components/Transactions';
import SavingPlanner from './components/SavingPlanner';
import Reports from './components/Reports';
import SettingsComponent from './components/Settings';
import WhatIfSimulator from './components/WhatIfSimulator';
import SmartOverspendingAlerts from './components/SmartOverspendingAlerts';
import SMSExpenseExtractor from './components/SMSExpenseExtractor';
import EditTransactionModal from './components/EditTransactionModal';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationDisplay from './components/NotificationDisplay';
import WeeklyReportScheduler from './components/WeeklyReportScheduler';
import DailyExpenseReminder from './components/DailyExpenseReminder';
import { getTransactions } from './utils/api';
import FamilyBudgetManager from './components/FamilyBudgetManager';
import MinimalAuth from './components/MinimalAuth';
import WelcomeScreen from './components/WelcomeScreen';

// Animated Background Component
const AnimatedBackground = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      width: Math.floor(Math.random() * 100) + 20,
      height: Math.floor(Math.random() * 100) + 20,
      left: Math.random() * 100,
      top: Math.random() * 100,
      xMove: Math.random() * 100 - 50,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
    }));
  }, []); // Empty dependency array ensures this only runs once

  return (
    <div className="fixed inset-0 overflow-hidden -z-10">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-black"></div>
      
      {/* Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-blue-400/20"
          style={{
            width: particle.width,
            height: particle.height,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, particle.xMove, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.delay,
          }}
        />
      ))}
      
      {/* Animated Waves */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-500/10 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-indigo-500/5 to-transparent"></div>
    </div>
  );
};

// Mobile-Friendly Navbar Component
const Navbar = ({ activeTab, setActiveTab, user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  const navItems = [
    { name: 'Dashboard', icon: Home, key: 'dashboard' },
    { name: 'Analytics', icon: BarChart3, key: 'analytics' },
    { name: 'Transactions', icon: Wallet, key: 'transactions' },
    { name: 'Family Budget', icon: Users, key: 'family-budget' },
    { name: 'Saving Goals', icon: PiggyBank, key: 'saving-goals' },
    { name: 'What-If', icon: Calculator, key: 'whatif' },
    { name: 'SMS Extractor', icon: MessageSquare, key: 'sms-extractor' },
    { name: 'Reports', icon: FileText, key: 'reports' },
    { name: 'Settings', icon: Settings, key: 'settings' },
  ];

  return (
    <motion.header 
      className="w-full py-4 px-4 md:px-6 bg-gradient-to-r from-blue-900/80 to-indigo-900/80 backdrop-blur-lg border-b border-blue-500/20 classy-element"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and User Info */}
        <div className="flex items-center space-x-6">
          <motion.div 
            className="flex items-center space-x-2 classy-element"
            whileHover={{ scale: 1.05 }}
          >
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg animate-classy-pulse">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent tracking-tight">
                TRIKIA
              </h1>
              <p className="text-xs md:text-sm font-medium text-gray-400 mt-0.5">
                AI Budget Tracker
              </p>
              {user && (
                <motion.p 
                  className="text-sm md:text-base text-gray-300 italic mt-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Welcome, <span className="font-semibold text-white">{user.name}</span>
                </motion.p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <motion.button
                key={item.name}
                className={`px-4 py-2 rounded-lg transition-all duration-300 classy-button flex items-center space-x-2 ${
                  activeTab === item.key 
                    ? 'bg-white/20 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setActiveTab(item.key)}
              >
                <IconComponent className="h-4 w-4" />
                <span>{item.name}</span>
              </motion.button>
            );
          })}
          
          {user && (
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-yellow-400" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-300" />
                )}
              </button>
              
              <motion.button
                onClick={onLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-all duration-300 classy-button flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </motion.button>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-gray-300 hover:text-white classy-button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="md:hidden mt-4 py-4 border-t border-blue-500/20 classy-element"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <motion.button
                    key={item.name}
                    className={`px-4 py-3 text-left flex items-center space-x-2 rounded-lg transition-all duration-300 classy-button ${
                      activeTab === item.key 
                        ? 'bg-white/20 text-white' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                    onClick={() => {
                      setActiveTab(item.key);
                      setIsMenuOpen(false);
                    }}
                    whileHover={{ x: 5 }}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{item.name}</span>
                  </motion.button>
                );
              })}
              {user && (
                <>
                  <motion.button
                    onClick={() => {
                      toggleTheme();
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg classy-button flex items-center space-x-2 w-full text-left"
                    whileHover={{ x: 5 }}
                  >
                    {isDarkMode ? (
                      <Sun className="h-4 w-4 text-yellow-400" />
                    ) : (
                      <Moon className="h-4 w-4 text-gray-300" />
                    )}
                    <span>Switch to {isDarkMode ? 'Light' : 'Dark'} Mode</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={() => {
                      onLogout();
                      setIsMenuOpen(false);
                    }}
                    className="mt-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg classy-button flex items-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

// Main App Component with Theme and Notification Providers
function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
        <NotificationDisplay />
      </NotificationProvider>
    </ErrorBoundary>
  );
}

// App Content Component (the actual app logic)
function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeTransactionTab, setActiveTransactionTab] = useState('expense'); // 'expense', 'credit', 'cash'
  const [bankAccounts, setBankAccounts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const { isDarkMode } = useTheme();

  // Initialize global toast reference for use outside components
  useEffect(() => {
    globalSetToast = setToast;
  }, []);

  // Auto-hide toast after delay
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Load user-specific settings
  const loadUserSettings = () => {
    if (user) {
      const userSettingsKey = `settings_${user.id}`;
      const savedSettings = localStorage.getItem(userSettingsKey);
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    }
    return {};
  };

  // Check authentication status on app load - persistent session
  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('currentUser');
    
    // Check if this is a first-time visitor (no stored authentication)
    const isFirstVisit = !storedAuth && !storedUser;
    
    // Keep user signed in if authentication data exists
    if (storedAuth === 'true' && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setIsAuthenticated(true);
        setUser(userData);
        // Load user-specific transactions
        loadUserTransactions(userData.id);
        // Load user-specific bank accounts
        loadUserBankAccounts(userData.id);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // If there's an error parsing the stored data, clear it and show welcome screen
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        setShowWelcome(true);
      }
    } else if (isFirstVisit) {
      // Show welcome screen for first-time visitors
      setShowWelcome(true);
    }
  }, []);

  const handleAuthSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    setShowWelcome(false); // Hide welcome screen after successful authentication
    
    // Check if user has already accepted terms
    const termsAcceptedKey = `terms_accepted_${userData.id}`;
    const hasAcceptedTerms = localStorage.getItem(termsAcceptedKey);
    
    if (!hasAcceptedTerms) {
      // Show Terms & Conditions modal for first-time users
      setShowTermsModal(true);
    } else {
      setTermsAccepted(true);
      setActiveTab('dashboard');
      // Load user-specific transactions
      loadUserTransactions(userData.id);
    }
  };

  const handleVerificationSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    setShowWelcome(false); // Hide welcome screen after successful verification
    
    // Check if user has already accepted terms
    const termsAcceptedKey = `terms_accepted_${userData.id}`;
    const hasAcceptedTerms = localStorage.getItem(termsAcceptedKey);
    
    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
    } else {
      setTermsAccepted(true);
      setActiveTab('dashboard');
      // Load user-specific transactions
      loadUserTransactions(userData.id);
      // Redirect to dashboard
      window.history.replaceState(null, '', '/');
    }
  };

  // Handle Terms & Conditions acceptance
  const handleAcceptTerms = () => {
    if (user && user.id) {
      const termsAcceptedKey = `terms_accepted_${user.id}`;
      localStorage.setItem(termsAcceptedKey, 'true');
      setTermsAccepted(true);
      setShowTermsModal(false);
      setActiveTab('dashboard');
      // Load user-specific transactions
      loadUserTransactions(user.id);
      // Load user-specific bank accounts
      loadUserBankAccounts(user.id);
      
      // Show success toast
      setToast({ 
        show: true, 
        message: '✅ Welcome! Let\'s start managing your budget wisely!', 
        type: 'success' 
      });
    }
  };

  // Handle Terms rejection (logout)
  const handleRejectTerms = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    setShowWelcome(true);
    setShowTermsModal(false);
    setToast({ 
      show: true, 
      message: 'You must accept the terms to continue using the app.', 
      type: 'warning' 
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('loginTimestamp');
    localStorage.removeItem('transactions_local_user'); // Remove any legacy transaction storage
    
    setIsAuthenticated(false);
    setUser(null);
    setTransactions([]);
    setShowWelcome(true); // Show welcome screen again after logout
    setActiveTab('dashboard');
  };

  // Load user-specific transactions
  const loadUserTransactions = async (userId) => {
    setLoading(true);
    try {
      // Try to get user-specific transactions from localStorage first
      const userTransactionsKey = `transactions_${userId}`;
      const storedTransactions = localStorage.getItem(userTransactionsKey);
      
      if (storedTransactions) {
        const parsedTransactions = JSON.parse(storedTransactions);
        // Ensure it's an array, if not initialize as empty array
        const transactionsArray = Array.isArray(parsedTransactions) ? parsedTransactions : [];
        setTransactions(transactionsArray);
      } else {
        // If no stored transactions, initialize with empty array for new users
        setTransactions([]);
        localStorage.setItem(userTransactionsKey, JSON.stringify([]));
      }
    } catch (err) {
      console.error('Error loading user transactions:', err);
      // Initialize with empty array if there's an error
      setTransactions([]);
      // Create a fresh empty transaction array in localStorage
      const userTransactionsKey = `transactions_${userId}`;
      localStorage.setItem(userTransactionsKey, JSON.stringify([]));
    } finally {
      setLoading(false);
    }
  };

  // Load user-specific bank accounts
  const loadUserBankAccounts = (userId) => {
    try {
      if (!userId) {
        console.warn('No user ID provided for loading bank accounts');
        setBankAccounts([]);
        return;
      }
      
      const userAccountsKey = `bank_accounts_${userId}`;
      const storedAccounts = localStorage.getItem(userAccountsKey);
      
      if (storedAccounts) {
        const accounts = JSON.parse(storedAccounts);
        if (Array.isArray(accounts)) {
          setBankAccounts(accounts);
        } else {
          console.warn('Saved bank accounts data is not an array, initializing as empty array');
          setBankAccounts([]);
          localStorage.setItem(userAccountsKey, JSON.stringify([]));
        }
      } else {
        // Initialize with empty array for new users
        setBankAccounts([]);
        localStorage.setItem(userAccountsKey, JSON.stringify([]));
      }
    } catch (err) {
      console.error('Error loading user bank accounts:', err);
      setBankAccounts([]);
    }
  };

  // Load transactions from API (fallback)
  useEffect(() => {
    if (!user) return; // Only load if user is authenticated
    
    const loadTransactions = async () => {
      setLoading(true);
      try {
        const data = await getTransactions();
        // Filter transactions by user if user data is available - SAFE version
        const allData = Array.isArray(data) ? data : [];
        const userTransactions = user ? allData.filter(tx => tx?.user === user.id) : allData;
        setTransactions(userTransactions);
      } catch (err) {
        console.error('Error loading transactions:', err);
        // Load user-specific transactions from localStorage
        loadUserTransactions(user.id);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [user]);

  const handleAddTransaction = async (newTx) => {
    console.log('handleAddTransaction called with:', newTx);
    console.log('Current user state:', user);
    console.log('Current transactions state:', transactions);
    console.log('Current bankAccounts state:', bankAccounts);
    
    try {
      // Validate required inputs
      if (!newTx) {
        console.error('No transaction data provided');
        setToast({ show: true, message: '❌ Error: No transaction data provided', type: 'error' });
        return;
      }
      
      if (!user) {
        console.error('No user authenticated');
        setToast({ show: true, message: '❌ Please log in first', type: 'error' });
        return;
      }
      
      if (!user.id) {
        console.error('User ID missing');
        setToast({ show: true, message: '❌ User ID missing. Please refresh and login again.', type: 'error' });
        return;
      }

      // Ensure amount is a valid number
      const amount = parseFloat(newTx.amount) || 0;
      if (amount <= 0) {
        setToast({ show: true, message: '❌ Amount must be greater than 0', type: 'error' });
        return;
      }

      // Add user ID and timestamp with fallbacks for empty fields
      const transactionWithUser = {
        ...newTx,
        user: user.id,
        _id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        date: newTx.date || new Date().toISOString(),
        amount: amount,
        merchant: newTx.merchant || 'Unknown',        // ← fallback
        description: newTx.description || '',          // ← fallback  
        category: newTx.category || 'Uncategorized',   // ← fallback
        type: newTx.type || 'debit',                   // ← fallback
        paymentMethod: newTx.paymentMethod || 'cash'   // ← fallback
      };
      
      console.log('Transaction with user data:', transactionWithUser);
      
      // Update transactions state - ensure we always work with arrays
      setTransactions(prev => {
        const currentTransactions = Array.isArray(prev) ? prev : [];
        console.log('Previous transactions:', prev);
        console.log('New transaction array length:', currentTransactions.length + 1);
        return [transactionWithUser, ...currentTransactions];
      });
      
      // Save to localStorage
      try {
        const userTransactionsKey = `transactions_${user.id}`;
        const currentTransactions = JSON.parse(localStorage.getItem(userTransactionsKey) || '[]');
        const updatedTransactions = [transactionWithUser, ...currentTransactions];
        localStorage.setItem(userTransactionsKey, JSON.stringify(updatedTransactions));
        console.log('Saved to localStorage successfully');
      } catch (storageError) {
        console.error('Error saving to localStorage:', storageError);
        setToast({ show: true, message: '⚠️ Saved temporarily but failed to save permanently', type: 'warning' });
      }
      
      // Update bank account balance if account selected and not cash transaction
      // Defensive check: ensure bankAccounts is an array
      const safeBankAccounts = Array.isArray(bankAccounts) ? bankAccounts : [];
      
      if (transactionWithUser.bankAccountId && safeBankAccounts.length > 0 && transactionWithUser.mode !== 'cash') {
        try {
          const amountChange = transactionWithUser.type === 'credit' 
            ? amount
            : -amount;
          
          const updatedAccounts = safeBankAccounts.map(acc => {
            if (acc && acc.id === transactionWithUser.bankAccountId) {
              const currentBalance = typeof acc.balance === 'number' ? acc.balance : 0;
              return { 
                ...acc, 
                balance: currentBalance + amountChange 
              };
            }
            return acc;
          }).filter(acc => acc && acc.id);
          
          if (updatedAccounts.length > 0) {
            setBankAccounts(updatedAccounts);
            
            // Save updated accounts
            try {
              const userAccountsKey = `bank_accounts_${user.id}`;
              localStorage.setItem(userAccountsKey, JSON.stringify(updatedAccounts));
              console.log('Bank accounts updated successfully');
            } catch (storageError) {
              console.error('Error saving bank accounts:', storageError);
            }
          }
        } catch (accountError) {
          console.error('Error updating bank account balance:', accountError);
        }
      }
      
      console.log('Transaction added successfully:', transactionWithUser);
      
      // Send notification for cross-verification
      const notificationTitle = `New ${transactionWithUser.type === 'credit' ? 'Credit' : 'Debit'} Entry`;
      const safeBankAccountsForNotif = Array.isArray(bankAccounts) ? bankAccounts : [];
      const accountName = safeBankAccountsForNotif.length > 0 && transactionWithUser.bankAccountId
        ? (safeBankAccountsForNotif.find(acc => acc.id === transactionWithUser.bankAccountId)?.name || 'N/A')
        : 'N/A';
      
      const notificationMessage = `Transaction: ${transactionWithUser.merchant || transactionWithUser.description || 'N/A'}\nAmount: ₹${amount.toLocaleString()}\nCategory: ${transactionWithUser.category}\nAccount: ${accountName}`;
      
      // Create notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notificationTitle, {
          body: notificationMessage,
          icon: '/favicon.ico',
          tag: transactionWithUser._id
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(notificationTitle, {
              body: notificationMessage,
              icon: '/favicon.ico',
              tag: transactionWithUser._id
            });
          }
        });
      }
      
      // Show success toast - replaces blocking alert()
      setToast({ 
        show: true, 
        message: `✅ ${transactionWithUser.type === 'credit' ? 'Income' : 'Expense'} of ₹${amount.toLocaleString()} added!`,
        type: 'success'
      });
      
    } catch (err) {
      console.error('Error in handleAddTransaction:', err);
      console.error('Error stack:', err.stack);
      setToast({ show: true, message: '❌ Failed to add: ' + (err.message || 'Unknown error'), type: 'error' });
    }
  };

  // Handle transaction update
  const handleUpdateTransaction = async (updatedTx) => {
    try {
      if (!user || !user.id) {
        setToast({ show: true, message: '❌ Please log in first', type: 'error' });
        return;
      }

      // Update transaction state
      setTransactions(prev => {
        return prev.map(tx => tx._id === updatedTx._id ? updatedTx : tx);
      });

      // Update localStorage
      try {
        const userTransactionsKey = `transactions_${user.id}`;
        const currentTransactions = JSON.parse(localStorage.getItem(userTransactionsKey) || '[]');
        const updatedTransactions = currentTransactions.map(tx => 
          tx._id === updatedTx._id ? updatedTx : tx
        );
        localStorage.setItem(userTransactionsKey, JSON.stringify(updatedTransactions));
        
        // Also update the main transactions array
        setTransactions(updatedTransactions);
      } catch (storageError) {
        console.error('Error updating transaction in localStorage:', storageError);
        setToast({ show: true, message: '⚠️ Saved temporarily but failed to save permanently', type: 'warning' });
      }

      // Update bank account balances
      if (Array.isArray(bankAccounts) && bankAccounts.length > 0 && updatedTx.mode !== 'cash') {
        // First, reverse the effect of the old transaction
        const oldTransaction = transactions.find(tx => tx._id === updatedTx._id);
        if (oldTransaction && oldTransaction.bankAccountId) {
          const oldAmount = oldTransaction.type === 'credit' 
            ? (oldTransaction.amount || 0)
            : -(oldTransaction.amount || 0);
          
          // Then apply the effect of the new transaction
          const newAmount = updatedTx.type === 'credit' 
            ? (updatedTx.amount || 0)
            : -(updatedTx.amount || 0);
          
          const amountDifference = newAmount - oldAmount;
          
          const updatedAccounts = bankAccounts.map(acc => {
            if (acc && acc.id === updatedTx.bankAccountId) {
              const currentBalance = typeof acc.balance === 'number' ? acc.balance : 0;
              return { 
                ...acc, 
                balance: currentBalance + amountDifference 
              };
            }
            return acc;
          }).filter(acc => acc && acc.id);
          
          if (updatedAccounts.length > 0) {
            setBankAccounts(updatedAccounts);
            
            // Save updated accounts
            try {
              const userAccountsKey = `bank_accounts_${user.id}`;
              localStorage.setItem(userAccountsKey, JSON.stringify(updatedAccounts));
            } catch (storageError) {
              console.error('Error saving bank accounts:', storageError);
            }
          }
        }
      }

      setToast({ show: true, message: '✅ Transaction updated!', type: 'success' });
    } catch (err) {
      console.error('Error updating transaction:', err);
      setToast({ show: true, message: '❌ Failed to update: ' + err.message, type: 'error' });
    }
  };

  // Handle transaction deletion
  const handleDeleteTransaction = async (transactionId) => {
    try {
      if (!user || !user.id) {
        setToast({ show: true, message: '❌ Please log in first', type: 'error' });
        return;
      }

      // Remove transaction from state
      setTransactions(prev => {
        return prev.filter(tx => tx._id !== transactionId);
      });

      // Update localStorage
      try {
        const userTransactionsKey = `transactions_${user.id}`;
        const currentTransactions = JSON.parse(localStorage.getItem(userTransactionsKey) || '[]');
        const updatedTransactions = currentTransactions.filter(tx => tx._id !== transactionId);
        localStorage.setItem(userTransactionsKey, JSON.stringify(updatedTransactions));
        
        // Update the main transactions array
        setTransactions(updatedTransactions);
      } catch (storageError) {
        console.error('Error deleting transaction from localStorage:', storageError);
        setToast({ show: true, message: '⚠️ Deleted temporarily but failed to remove permanently', type: 'warning' });
      }

      // Update bank account balance to reverse the transaction
      if (Array.isArray(bankAccounts) && bankAccounts.length > 0) {
        const deletedTransaction = transactions.find(tx => tx._id === transactionId);
        if (deletedTransaction && deletedTransaction.bankAccountId && deletedTransaction.mode !== 'cash') {
          const amount = deletedTransaction.type === 'credit' 
            ? -(deletedTransaction.amount || 0)  // Reverse the credit
            : (deletedTransaction.amount || 0);  // Reverse the debit
          
          const updatedAccounts = bankAccounts.map(acc => {
            if (acc && acc.id === deletedTransaction.bankAccountId) {
              const currentBalance = typeof acc.balance === 'number' ? acc.balance : 0;
              return { 
                ...acc, 
                balance: currentBalance + amount 
              };
            }
            return acc;
          }).filter(acc => acc && acc.id);
          
          if (updatedAccounts.length > 0) {
            setBankAccounts(updatedAccounts);
            
            // Save updated accounts
            try {
              const userAccountsKey = `bank_accounts_${user.id}`;
              localStorage.setItem(userAccountsKey, JSON.stringify(updatedAccounts));
            } catch (storageError) {
              console.error('Error saving bank accounts:', storageError);
            }
          }
        }
      }

      setToast({ show: true, message: '✅ Transaction deleted!', type: 'success' });
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setToast({ show: true, message: '❌ Failed to delete: ' + err.message, type: 'error' });
    }
  };

  const renderActiveTab = () => {
    const userSettings = loadUserSettings();
    
    switch(activeTab) {
      case 'family-budget':
        return <FamilyBudgetManager 
          currentUser={user} 
          transactions={transactions} 
          bankAccounts={bankAccounts}
          onFamilyDataUpdate={(familyMembers) => {
            console.log('Family data updated:', familyMembers);
            // Handle family data updates here
          }}
        />;
      case 'analytics':
        return <Analytics transactions={transactions} bankAccounts={bankAccounts} />;
      case 'transactions':
        return <Transactions transactions={transactions} bankAccounts={bankAccounts} />;
      case 'reports':
        return <Reports transactions={transactions} accounts={bankAccounts} />;
      case 'whatif':
        return <WhatIfSimulator transactions={transactions} bankAccounts={bankAccounts} />;

      case 'sms-extractor':
        return <SMSExpenseExtractor 
          bankAccounts={bankAccounts} 
          onAddTransaction={handleAddTransaction}
        />;
      case 'saving-goals':
        return <SavingPlanner transactions={transactions} />;
      case 'settings':
        return <SettingsComponent 
          currentUser={user} 
          transactions={transactions}
          setTransactions={setTransactions}
          setGoals={setGoals}
          setBankAccounts={setBankAccounts}
        />;
      case 'dashboard':
      default:
        // Create safe transactions array to prevent crashes
        const safeTransactions = Array.isArray(transactions) ? transactions : [];
        
        return (
          <>
            <WeeklyReportScheduler user={user} transactions={safeTransactions} settings={userSettings.notifications} />
            <DailyExpenseReminder user={user} transactions={safeTransactions} settings={userSettings.notifications} />
            {/* Dashboard Header */}
            <div className="text-center py-8 animate-elegant-entrance">
              <h1 className="text-4xl font-black bg-gradient-to-r from-green-300 via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">
                {safeTransactions.length === 0 ? 'Welcome to TRIKIA!' : `Hello, ${user.name}!`}
              </h1>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                {safeTransactions.length === 0 
                  ? 'Get started by adding your first transaction below' 
                  : 'Continue tracking your expenses with your personalized AI Budget Tracker'}
              </p>
              {safeTransactions.length === 0 && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg max-w-md mx-auto">
                  <p className="text-blue-300 text-sm">
                    <span className="font-semibold">New user:</span> Your balance is initialized to zero. Add your first transaction to get started!
                  </p>
                </div>
              )}
            </div>

            {/* Summary Cards */}
            <SummaryCards transactions={safeTransactions} />

            {/* Main Content Grid - Restructured Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column - Bank Accounts and Transaction Forms */}
              <div className="lg:col-span-2 space-y-8">
                {/* Bank Account Manager */}
                <BankAccountManager 
                  user={user} 
                  onUpdateAccounts={setBankAccounts}
                />
                
                {/* Transaction Type Tabs */}
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl classy-element">
                  <div className="flex border-b border-white/10 mb-4">
                    <button
                      className={`px-4 py-2 font-medium text-sm ${
                        activeTransactionTab === 'expense' 
                          ? 'text-white border-b-2 border-blue-500' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                      onClick={() => setActiveTransactionTab('expense')}
                    >
                      Expense
                    </button>
                    <button
                      className={`px-4 py-2 font-medium text-sm ${
                        activeTransactionTab === 'credit' 
                          ? 'text-white border-b-2 border-green-500' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                      onClick={() => setActiveTransactionTab('credit')}
                    >
                      Income
                    </button>
                    <button
                      className={`px-4 py-2 font-medium text-sm ${
                        activeTransactionTab === 'cash' 
                          ? 'text-white border-b-2 border-yellow-500' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                      onClick={() => setActiveTransactionTab('cash')}
                    >
                      Cash
                    </button>
                  </div>

                  {/* Transaction Forms */}
                  {activeTransactionTab === 'expense' ? (
                    <AddTransaction 
                      onAdd={handleAddTransaction}
                      accounts={bankAccounts}
                    />
                  ) : activeTransactionTab === 'credit' ? (
                    <AddCreditTransaction 
                      onAdd={handleAddTransaction}
                      accounts={bankAccounts}
                    />
                  ) : (
                    <AddCashTransaction 
                      onAdd={handleAddTransaction}
                      accounts={bankAccounts}
                    />
                  )}
                </div>
              </div>

              {/* Middle Column - All Transactions Section */}
              <div className="space-y-8">
                <TransactionSections 
                  transactions={safeTransactions}
                  bankAccounts={bankAccounts}
                  onEditTransaction={(transaction) => {
                    setSelectedTransaction(transaction);
                    setShowEditModal(true);
                  }}
                  onDeleteTransaction={handleDeleteTransaction}
                />
                
                <SavingPlanner transactions={safeTransactions} />
                
                <PredictionCard transactions={safeTransactions} />
              </div>

              {/* Right Column - Overspending Section */}
              <div className="space-y-8">
                <SmartOverspendingAlerts 
                  transactions={safeTransactions}
                  user={user}
                />
                
                <PaymentReminders 
                  user={user} 
                  bankAccounts={bankAccounts}
                  onAutoDeductPayment={handleAddTransaction}
                />
              </div>
            </div>
          </>
        );
    }
  };

  if (!isAuthenticated && showWelcome) {
    return (
      <>
        <WelcomeScreen 
          onComplete={() => setShowWelcome(false)} 
          isAuthenticated={isAuthenticated} 
        />
        <AnimatedBackground />
      </>
    );
  }

  if (!isAuthenticated) {
    return <MinimalAuth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen relative classy-container">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          user={user}
          onLogout={handleLogout}
        />

        {/* Toast Notification - Replaces blocking alert() */}
        {toast.show && (
          <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg transition-all animate-slide-down ${
            toast.type === 'success' ? 'bg-green-600' :
            toast.type === 'error' ? 'bg-red-600' :
            'bg-yellow-600'
          }`}>
            <p className="text-white font-medium">{toast.message}</p>
          </div>
        )}

        <main className="max-w-7xl mx-auto p-6">
          {renderActiveTab()}

          {/* Voice Assistant */}
          <VoiceAssistant 
            onTransactionDetected={handleAddTransaction}
            isListening={isVoiceListening}
            setIsListening={setIsVoiceListening}
            bankAccounts={bankAccounts}
            setActiveTab={setActiveTab}
          />

          {/* AI Chat Assistant */}
          <AIChatAssistant 
            transactions={transactions}
            bankAccounts={bankAccounts}
            isVisible={isChatVisible}
            setIsVisible={setIsChatVisible}
          />
          
          {/* Edit Transaction Modal */}
          <EditTransactionModal
            transaction={selectedTransaction}
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSave={handleUpdateTransaction}
            onDelete={handleDeleteTransaction}
            accounts={bankAccounts}
          />

          {/* Terms & Conditions Modal */}
          <AnimatePresence>
            {showTermsModal && (
              <motion.div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-8 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
                  initial={{ scale: 0.9, y: -20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: -20 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-center space-x-4 mb-6 pb-5 border-b border-white/10">
                    <motion.div 
                      className="p-3.5 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl shadow-2xl ring-2 ring-white/20"
                      whileHover={{ scale: 1.08, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Shield className="h-9 w-9 text-white drop-shadow-lg" />
                    </motion.div>
                    <div>
                      <motion.h2 
                        className="text-4xl font-black tracking-tight bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent drop-shadow-2xl"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                      >
                        Welcome to TRIKIA
                      </motion.h2>
                      <motion.p 
                        className="text-lg font-semibold text-white mt-1.5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        AI Budget Tracker
                      </motion.p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-6 mb-8">
                    {/* Privacy Feature 1 */}
                    <motion.div 
                      className="flex items-start space-x-4 bg-blue-500/10 border border-blue-400/20 rounded-xl p-4 backdrop-blur-xl"
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Lock className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
                      </motion.div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">🔒 Local Storage Only</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          All your data is stored securely on your device. Nothing is uploaded, shared, or downloaded to external servers. Your financial information never leaves your device.
                        </p>
                      </div>
                    </motion.div>

                    {/* Privacy Feature 2 */}
                    <motion.div 
                      className="flex items-start space-x-4 bg-green-500/10 border border-green-400/20 rounded-xl p-4 backdrop-blur-xl"
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Shield className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
                      </motion.div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">🛡️ Your Privacy Matters</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          No bank account details or sensitive financial information are collected. The app only tracks what you enter for your own personal use and insights.
                        </p>
                      </div>
                    </motion.div>

                    {/* Privacy Feature 3 - Phone/Bank Messages */}
                    <motion.div 
                      className="flex items-start space-x-4 bg-emerald-500/10 border border-emerald-400/20 rounded-xl p-4 backdrop-blur-xl"
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <svg className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </motion.div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">📱 Phone & Bank Messages Secure</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          None of your phone calls, SMS messages, or bank messages are being accessed by us. Your privacy is secured - we only use the transaction data you manually enter into the app.
                        </p>
                      </div>
                    </motion.div>

                    {/* Privacy Feature 3 */}
                    <motion.div 
                      className="flex items-start space-x-4 bg-purple-500/10 border border-purple-400/20 rounded-xl p-4 backdrop-blur-xl"
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <User className="h-6 w-6 text-purple-400 flex-shrink-0 mt-1" />
                      </motion.div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">👤 You're in Control</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          None of your data can be accessed by anyone other than you on this device. You have complete ownership and control over all your financial information.
                        </p>
                      </div>
                    </motion.div>

                    {/* Privacy Feature 4 */}
                    <motion.div 
                      className="flex items-start space-x-4 bg-orange-500/10 border border-orange-400/20 rounded-xl p-4 backdrop-blur-xl"
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Brain className="h-6 w-6 text-orange-400 flex-shrink-0 mt-1" />
                      </motion.div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">🤖 Smart Assistance</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          A built-in chat assistant and voice assistant are available to help you manage your budget. They work entirely with your locally stored data — no external access or data sharing.
                        </p>
                      </div>
                    </motion.div>

                    {/* Privacy Feature 5 */}
                    <motion.div 
                      className="flex items-start space-x-4 bg-cyan-500/10 border border-cyan-400/20 rounded-xl p-4 backdrop-blur-xl"
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Eye className="h-6 w-6 text-cyan-400 flex-shrink-0 mt-1" />
                      </motion.div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">✅ Transparency First</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          This app is designed purely for personal tracking and insights. You remain the sole owner of your information. No hidden agendas, no data mining, no third-party access.
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Benefits Section */}
                  <motion.div 
                    className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/20 rounded-2xl p-6 mb-6 backdrop-blur-xl shadow-2xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-xl font-black text-white mb-4 flex items-center">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
                      </motion.div>
                      Key Benefits:
                    </h3>
                    <ul className="space-y-3">
                      {['100% Private & Secure - Your data stays on your device', 'AI-Powered Insights - Smart assistance without compromising privacy', 'Complete Control - You own your data, always', 'No External Servers - Everything runs locally', 'Free Forever - No hidden costs or premium tiers'].map((benefit, index) => (
                        <motion.li 
                          key={index}
                          className="flex items-start text-gray-200"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          whileHover={{ x: 5, scale: 1.02 }}
                        >
                          <motion.span 
                            className="text-green-400 mr-3 text-lg"
                            whileHover={{ scale: 1.3, rotate: 15 }}
                          >✓</motion.span>
                          <span className="font-medium">{benefit}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* Acceptance Checkbox */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-500 rounded focus:ring-blue-500 focus:ring-2 mt-1"
                      />
                      <span className="text-sm text-gray-300">
                        By continuing, you acknowledge and agree to these terms. You understand that this app is for personal budget tracking purposes only and that all data remains stored locally on your device.
                      </span>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <motion.button
                      onClick={handleRejectTerms}
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className="flex-1 px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
                    >
                      Exit App
                    </motion.button>
                    <motion.button
                      onClick={handleAcceptTerms}
                      disabled={!termsAccepted}
                      whileHover={termsAccepted ? { scale: 1.05, y: -3 } : {}}
                      whileTap={termsAccepted ? { scale: 0.95 } : {}}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className={`flex-1 px-8 py-4 rounded-xl font-bold transition-all shadow-lg ${
                        termsAccepted
                          ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white shadow-blue-500/30 hover:shadow-blue-500/50'
                          : 'bg-gradient-to-r from-gray-700 to-gray-600 text-gray-500 cursor-not-allowed opacity-50'
                      }`}
                    >
                      Accept & Continue ✨
                    </motion.button>
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
