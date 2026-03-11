import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Calendar, CreditCard, Home, Utensils, X, Clock, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

const PaymentReminders = ({ user, bankAccounts = [], onAutoDeductPayment }) => {
  const [reminders, setReminders] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null); // For edit mode
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = useState(false);
  const [insufficientBalanceData, setInsufficientBalanceData] = useState(null);
  const [newReminder, setNewReminder] = useState({
    title: '',
    amount: '',
    date: '',
    type: 'credit_card',
    frequency: 'monthly',
    account: 'cash' // New field for account selection
  });
  const [errors, setErrors] = useState({});

  // Load user reminders from localStorage
  useEffect(() => {
    if (user) {
      const userRemindersKey = `payment_reminders_${user.id}`;
      const savedReminders = localStorage.getItem(userRemindersKey);
      if (savedReminders) {
        setReminders(JSON.parse(savedReminders));
      }
    }
  }, [user]);

  // Save reminders to localStorage when they change
  useEffect(() => {
    if (user && reminders.length > 0) {
      const userRemindersKey = `payment_reminders_${user.id}`;
      localStorage.setItem(userRemindersKey, JSON.stringify(reminders));
    } else if (user) {
      const userRemindersKey = `payment_reminders_${user.id}`;
      localStorage.setItem(userRemindersKey, JSON.stringify([]));
    }
  }, [reminders, user]);

  // Setup global handler for insufficient balance alerts
  useEffect(() => {
    window.showInsufficientBalanceAlert = (data) => {
      setInsufficientBalanceData(data);
      setShowInsufficientBalanceModal(true);
    };
    
    return () => {
      delete window.showInsufficientBalanceAlert;
    };
  }, []);

  // Effect to check for due reminders and AUTO-DEDUCT payments
  useEffect(() => {
    const checkDueReminders = async () => {
      const today = new Date();
      const todayDate = today.getDate();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      for (const reminder of reminders) {
        // Only process non-completed reminders that are due today
        if (!reminder.completed && parseInt(reminder.date) === todayDate) {
          // Check if already paid this month
          const alreadyPaidThisMonth = reminder.lastPaid && 
            new Date(reminder.lastPaid).getMonth() === currentMonth &&
            new Date(reminder.lastPaid).getFullYear() === currentYear;
          
          if (!alreadyPaidThisMonth) {
            const accountName = reminder.account === 'cash' 
              ? 'Cash' 
              : (bankAccounts.find(acc => acc.id === reminder.account)?.name || 'Selected Account');
            
            // Check account balance if not cash
            if (reminder.account !== 'cash') {
              const selectedAccount = bankAccounts.find(acc => acc.id === reminder.account);
              const accountBalance = selectedAccount?.balance || 0;
              const requiredAmount = parseFloat(reminder.amount);
              
              // Check if balance is insufficient 1 day before or on the due date
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              const isBeforeDueDate = todayDate === parseInt(reminder.date) || todayDate === parseInt(reminder.date) - 1;
              
              if (isBeforeDueDate && accountBalance < requiredAmount) {
                // Show insufficient balance alert/notification
                const alertTitle = `⚠️ Insufficient Balance Alert`;
                const alertMessage = `${accountName} has only ₹${accountBalance.toLocaleString()}, but ₹${requiredAmount.toLocaleString()} is needed for ${reminder.title} payment due ${todayDate === parseInt(reminder.date) ? 'TODAY' : 'TOMORROW'}!`;
                
                // Browser notification
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification(alertTitle, {
                    body: alertMessage,
                    icon: '/favicon.ico',
                    tag: `insufficient-balance-${reminder.id}`,
                    requireInteraction: true
                  });
                }
                
                // Also show in-app toast notification via parent component
                if (window.showInsufficientBalanceAlert) {
                  window.showInsufficientBalanceAlert({
                    title: alertTitle,
                    message: alertMessage,
                    account: accountName,
                    balance: accountBalance,
                    required: requiredAmount,
                    reminder: reminder
                  });
                }
                
                console.warn(`⚠️ INSUFFICIENT BALANCE: ${alertMessage}`);
              }
            }
            
            // Auto-deduct payment if callback provided
            if (onAutoDeductPayment) {
              try {
                await onAutoDeductPayment({
                  title: reminder.title,
                  amount: parseFloat(reminder.amount),
                  account: reminder.account,
                  type: reminder.type,
                  date: today.toISOString(),
                  category: reminder.type === 'credit_card' ? 'Credit Card Payment' : 
                           reminder.type === 'rent' ? 'Rent' : 'Utilities'
                });
                
                // Mark as paid
                setReminders(prev => prev.map(rem => 
                  rem.id === reminder.id 
                    ? { ...rem, completed: true, lastPaid: today.toISOString() }
                    : rem
                ));
                
                console.log(`✅ Auto-paid: ${reminder.title} - ₹${reminder.amount}`);
              } catch (error) {
                console.error('Failed to auto-deduct payment:', error);
              }
            }
            
            // Show notification
            const notificationTitle = `Payment Processed: ${reminder.title}`;
            const notificationMessage = `Amount: ₹${reminder.amount?.toLocaleString() || '0'}\nFrom: ${accountName}\nType: ${reminder.type}`;
            
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(notificationTitle, {
                body: notificationMessage,
                icon: '/favicon.ico',
                tag: `reminder-${reminder.id}`
              });
            }
          }
        }
      }
    };

    // Check for due reminders every hour
    checkDueReminders();
    const interval = setInterval(checkDueReminders, 3600000); // Every hour
    
    return () => clearInterval(interval);
  }, [reminders, bankAccounts, onAutoDeductPayment]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!newReminder.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!newReminder.amount || parseFloat(newReminder.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    
    if (!newReminder.date) {
      newErrors.date = 'Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddReminder = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const reminderExists = reminders.some(
      rem => rem.title.toLowerCase() === newReminder.title.toLowerCase() &&
             rem.date === newReminder.date
    );
    
    if (reminderExists) {
      alert('A reminder with this title and date already exists');
      return;
    }
    
    const newReminderObj = {
      id: Date.now().toString(),
      ...newReminder,
      amount: parseFloat(newReminder.amount),
      completed: false, // New field to track completion status
      createdAt: new Date().toISOString()
    };
    
    setReminders([...reminders, newReminderObj]);
    setNewReminder({
      title: '',
      amount: '',
      date: '',
      type: 'credit_card',
      frequency: 'monthly',
      account: 'cash' // Reset to default
    });
    setErrors({});
    setShowAddForm(false);
  };

  const handleDeleteReminder = (reminderId) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      setReminders(reminders.filter(rem => rem.id !== reminderId));
    }
  };

  const handleEditReminder = (reminder) => {
    setEditingReminder(reminder);
    setNewReminder({
      title: reminder.title,
      amount: reminder.amount.toString(),
      date: reminder.date,
      type: reminder.type,
      frequency: reminder.frequency,
      account: reminder.account || 'cash'
    });
    setShowAddForm(true);
  };

  const handleUpdateReminder = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setReminders(prev => prev.map(rem => 
      rem.id === editingReminder.id
        ? { 
            ...rem, 
            ...newReminder, 
            amount: parseFloat(newReminder.amount),
            lastUpdated: new Date().toISOString()
          }
        : rem
    ));
    
    setEditingReminder(null);
    setNewReminder({
      title: '',
      amount: '',
      date: '',
      type: 'credit_card',
      frequency: 'monthly',
      account: 'cash'
    });
    setErrors({});
    setShowAddForm(false);
  };

  const handleToggleCompletion = (reminderId) => {
    setReminders(prevReminders =>
      prevReminders.map(reminder =>
        reminder.id === reminderId
          ? { ...reminder, completed: !reminder.completed }
          : reminder
      )
    );
  };

  const getDueSoonReminders = () => {
    const today = new Date();
    const todayDate = today.getDate();
    
    return reminders.filter(reminder => {
      // Only consider non-completed reminders
      if (reminder.completed) return false;
      
      const reminderDate = parseInt(reminder.date);
      
      // For monthly reminders, highlight those that are due soon (within a few days)
      if (reminder.frequency === 'monthly') {
        // Check if the reminder date is today or within the next few days
        if (reminderDate === todayDate) {
          return true; // Due today
        } else if (reminderDate > todayDate && reminderDate <= todayDate + 3) {
          return true; // Due within next 3 days
        } else if (todayDate > 25 && reminderDate <= 3) {
          // Handle month-end to month-start transition (e.g., due on 1st-3rd of next month)
          return true;
        }
      }
      return false;
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'credit_card':
        return <CreditCard className="h-5 w-5" />;
      case 'rent':
        return <Home className="h-5 w-5" />;
      case 'utilities':
        return <Utensils className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'credit_card':
        return 'from-red-500 to-rose-600';
      case 'rent':
        return 'from-blue-500 to-indigo-600';
      case 'utilities':
        return 'from-green-500 to-emerald-600';
      case 'loan':
        return 'from-purple-500 to-violet-600';
      case 'subscription':
        return 'from-yellow-500 to-amber-600';
      default:
        return 'from-gray-500 to-slate-600';
    }
  };

  const getDaysUntilDue = (date) => {
    const today = new Date();
    const reminderDate = new Date(today.getFullYear(), today.getMonth(), parseInt(date));
    
    // Handle month-end to month-start transition
    if (parseInt(date) < today.getDate()) {
      reminderDate.setMonth(reminderDate.getMonth() + 1);
    }
    
    const diffTime = reminderDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const dueSoonReminders = getDueSoonReminders();

  return (
    <motion.div
      className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl classy-element"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Payment Reminders</h2>
            <p className="text-sm text-gray-400">Your scheduled payments and due dates</p>
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

      {/* All Reminders List */}
      <div className="space-y-3">
        <AnimatePresence>
          {reminders.length === 0 ? (
            <motion.div
              className="text-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Payment Reminders</h3>
              <p className="text-gray-400">Add payment reminders to track your due dates</p>
              
              {/* Quick guide for new users */}
              <div className="mt-6 max-w-md mx-auto bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
                <p className="text-sm text-blue-200 font-medium mb-2">📝 How to set up a payment reminder:</p>
                <ol className="text-xs text-gray-300 text-left space-y-1">
                  <li>1️⃣ Click the + button above</li>
                  <li>2️⃣ Enter payment details (title, amount, due date)</li>
                  <li>3️⃣ <strong>Select which account to pay from</strong> (shows balance)</li>
                  <li>4️⃣ Save - we'll remind you and auto-pay on the due date!</li>
                </ol>
                <p className="text-xs text-yellow-300 mt-3">
                  ⚠️ Make sure to select the correct bank account with sufficient balance!
                </p>
              </div>
            </motion.div>
          ) : (
            reminders.map((reminder) => {
              const reminderDate = parseInt(reminder.date);
              const today = new Date();
              const todayDate = today.getDate();
              const isDueSoon = 
                reminderDate === todayDate || 
                (reminderDate > todayDate && reminderDate <= todayDate + 3) ||
                (todayDate > 25 && reminderDate <= 3);
              
              const daysUntilDue = getDaysUntilDue(reminder.date);
              
              return (
                <motion.div
                  key={reminder.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                    isDueSoon 
                      ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/40' 
                      : reminder.completed
                        ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 opacity-70'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`p-3 bg-gradient-to-br ${getTypeColor(reminder.type)} rounded-lg`}>
                      {getTypeIcon(reminder.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={reminder.completed || false}
                          onChange={() => handleToggleCompletion(reminder.id)}
                          className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                        />
                        <h3 className={`font-semibold truncate ${reminder.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                          {reminder.title}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mt-1">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Day {reminder.date} of month</span>
                        </span>
                        <span className="flex items-center space-x-1" title={reminder.account === 'cash' ? 'Cash Payment' : `Linked to ${bankAccounts.find(acc => acc.id === reminder.account)?.name || 'Account'}`}>
                          <Wallet className="h-3 w-3" />
                          <span className="font-medium">
                            {reminder.account === 'cash' 
                              ? '💵 Cash' 
                              : (bankAccounts.find(acc => acc.id === reminder.account) 
                                  ? `🏦 ${bankAccounts.find(acc => acc.id === reminder.account).name} (₹${bankAccounts.find(acc => acc.id === reminder.account).balance?.toLocaleString() || '0'})`
                                  : 'Unknown Account')}
                          </span>
                        </span>
                        <span className="flex items-center space-x-1" title={`${reminder.frequency === 'once' ? 'One-time payment' : `Repeats ${reminder.frequency}`}`}>
                          <Clock className="h-3 w-3" />
                          <span className="font-medium">
                            {reminder.frequency === 'once' 
                              ? '⚡ Once' 
                              : reminder.frequency === 'weekly'
                                ? '📅 Weekly'
                                : reminder.frequency === 'monthly'
                                  ? '🗓️ Monthly'
                                  : '📆 Yearly'}
                          </span>
                        </span>
                        <span className="flex items-center space-x-1">
                          {daysUntilDue === 0 ? (
                            <TrendingUp className="h-3 w-3 text-red-400" />
                          ) : daysUntilDue <= 3 ? (
                            <TrendingUp className="h-3 w-3 text-yellow-400" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-green-400" />
                          )}
                          <span>
                            {daysUntilDue === 0 ? 'Due today' : 
                             daysUntilDue < 0 ? `Overdue by ${Math.abs(daysUntilDue)} days` :
                             `Due in ${daysUntilDue} days`}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 ml-4">
                    <span className={`font-semibold text-lg ${reminder.completed ? 'line-through text-gray-400' : 'text-white'}`}>₹{reminder.amount?.toLocaleString() || '0'}</span>
                    <button
                      onClick={() => handleEditReminder(reminder)}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-full transition-all duration-300"
                      title="Edit reminder"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full transition-all duration-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Due Soon Summary */}
      {dueSoonReminders.length > 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-300 font-medium">
            ⚠️ {dueSoonReminders.length} payment{dueSoonReminders.length > 1 ? 's' : ''} due soon - take action!
          </p>
        </div>
      )}

      {/* Add Reminder Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-xl font-bold text-white mb-4">
                {editingReminder ? 'Edit Payment Reminder' : 'Add Payment Reminder'}
              </h3>
              
              <form onSubmit={editingReminder ? handleUpdateReminder : handleAddReminder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                    placeholder="e.g., Credit Card Bill, Rent, Electricity"
                    className={`w-full px-4 py-3 bg-black/30 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                      errors.title ? 'border-red-500' : 'border-white/20'
                    }`}
                  />
                  {errors.title && (
                    <p className="text-red-400 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Amount (₹)</label>
                    <input
                      type="number"
                      value={newReminder.amount}
                      onChange={(e) => setNewReminder({...newReminder, amount: e.target.value})}
                      placeholder="0.00"
                      className={`w-full px-4 py-3 bg-black/30 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        errors.amount ? 'border-red-500' : 'border-white/20'
                      }`}
                    />
                    {errors.amount && (
                      <p className="text-red-400 text-sm mt-1">{errors.amount}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Day of Month</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={newReminder.date}
                      onChange={(e) => setNewReminder({...newReminder, date: e.target.value})}
                      className={`w-full px-4 py-3 bg-black/30 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        errors.date ? 'border-red-500' : 'border-white/20'
                      }`}
                    />
                    {errors.date && (
                      <p className="text-red-400 text-sm mt-1">{errors.date}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                    <select
                      value={newReminder.type}
                      onChange={(e) => setNewReminder({...newReminder, type: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="credit_card">Credit Card</option>
                      <option value="rent">Rent</option>
                      <option value="utilities">Utilities</option>
                      <option value="loan">Loan</option>
                      <option value="subscription">Subscription</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Payment Account <span className="text-blue-400">*</span>
                    </label>
                    <select
                      value={newReminder.account}
                      onChange={(e) => setNewReminder({...newReminder, account: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select an account...</option>
                      <option value="cash">💵 Cash</option>
                      {bankAccounts && bankAccounts.length > 0 ? (
                        bankAccounts.map(account => (
                          <option key={account.id} value={account.id}>
                            🏦 {account.name} (****{account.lastFourDigits}) - Balance: ₹{account.balance?.toLocaleString() || '0'}
                          </option>
                        ))
                      ) : (
                        <option disabled value="">No bank accounts added</option>
                      )}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      💡 Choose which account this payment will be deducted from
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
                    <select
                      value={newReminder.frequency}
                      onChange={(e) => setNewReminder({...newReminder, frequency: e.target.value})}
                      className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="once">⚡ Once (One-time payment)</option>
                      <option value="weekly">📅 Weekly</option>
                      <option value="monthly">🗓️ Monthly</option>
                      <option value="yearly">📆 Yearly</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      {newReminder.frequency === 'once' 
                        ? '💡 This reminder will only trigger once and won\'t repeat' 
                        : `💡 This reminder will repeat ${newReminder.frequency}`}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewReminder({
                        title: '',
                        amount: '',
                        date: '',
                        type: 'credit_card',
                        frequency: 'monthly'
                      });
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
                    Add Reminder
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insufficient Balance Alert Modal */}
      <AnimatePresence>
        {showInsufficientBalanceModal && insufficientBalanceData && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInsufficientBalanceModal(false)}
          >
            <motion.div
              className="bg-gradient-to-br from-red-900/90 to-orange-900/90 backdrop-blur-xl border-2 border-red-500/50 rounded-2xl p-8 w-full max-w-lg shadow-2xl"
              initial={{ scale: 0.9, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-red-500 rounded-full animate-pulse">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{insufficientBalanceData.title}</h3>
                  <p className="text-red-200 text-sm">Immediate action required</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-red-800/30 border border-red-400/30 rounded-lg p-4">
                  <p className="text-white font-semibold mb-2">{insufficientBalanceData.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-gray-300 text-sm mb-1">Account</p>
                    <p className="text-white font-bold">{insufficientBalanceData.account}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-gray-300 text-sm mb-1">Current Balance</p>
                    <p className="text-red-300 font-bold">₹{insufficientBalanceData.balance.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-gray-300 text-sm mb-1">Required Amount</p>
                    <p className="text-orange-300 font-bold">₹{insufficientBalanceData.required.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-gray-300 text-sm mb-1">Shortfall</p>
                    <p className="text-red-400 font-bold">₹{(insufficientBalanceData.required - insufficientBalanceData.balance).toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4">
                  <p className="text-yellow-200 text-sm">
                    💡 <strong>Tip:</strong> Add funds to your account or edit the payment amount if the bill has changed.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowInsufficientBalanceModal(false);
                    // Optionally open edit modal for the reminder
                    if (insufficientBalanceData.reminder) {
                      // Could trigger edit here
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    setShowInsufficientBalanceModal(false);
                    // Auto-add cash transaction to cover the shortfall
                    if (onAutoDeductPayment && insufficientBalanceData.reminder) {
                      onAutoDeductPayment({
                        title: `Cash added for ${insufficientBalanceData.reminder.title}`,
                        amount: insufficientBalanceData.required - insufficientBalanceData.balance,
                        account: 'cash',
                        type: 'credit',
                        date: new Date().toISOString(),
                        category: 'Cash Add'
                      });
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg transition-all font-semibold"
                >
                  Add Cash Now
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