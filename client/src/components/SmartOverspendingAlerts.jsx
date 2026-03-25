import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingUp, TrendingDown, Bell, Wallet, Target, Clock } from 'lucide-react';

const SmartOverspendingAlerts = ({ transactions = [], user }) => {
  const [alerts, setAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const [notifiedCategories, setNotifiedCategories] = useState({});

  // Calculate spending baselines and detect anomalies
  const analyzeSpendingPatterns = useMemo(() => {
    if (!transactions || transactions.length === 0) return {};

    // Group transactions by category
    const categoryGroups = {};
    const now = new Date();
    
    // Calculate weekly and monthly spending
    const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    transactions.forEach(tx => {
      if (!tx.category || tx.type !== 'debit') return; // Only consider expenses
      
      const txDate = new Date(tx.date);
      if (isNaN(txDate.getTime())) return; // Skip invalid dates
      
      const category = tx.category;
      
      if (!categoryGroups[category]) {
        categoryGroups[category] = {
          all: [],
          weekly: [],
          monthly: []
        };
      }
      
      categoryGroups[category].all.push(tx);
      
      if (txDate >= oneWeekAgo) {
        categoryGroups[category].weekly.push(tx);
      }
      
      if (txDate >= oneMonthAgo) {
        categoryGroups[category].monthly.push(tx);
      }
    });

    // Calculate baselines
    const baselines = {};
    Object.keys(categoryGroups).forEach(category => {
      const allTransactions = categoryGroups[category].all;
      const weeklyTransactions = categoryGroups[category].weekly;
      const monthlyTransactions = categoryGroups[category].monthly;
      
      // Calculate average weekly spending for this category
      const weeklySpendingHistory = [];
      for (let i = 0; i < 4; i++) { // Look at last 4 weeks
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (7 * (i + 1)));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        
        const weekTransactions = allTransactions.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= weekStart && txDate <= weekEnd;
        });
        
        const weekTotal = weekTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        weeklySpendingHistory.push(weekTotal);
      }
      
      // Safe weekly spending calculation
      const safeWeeklyHistory = Array.isArray(weeklySpendingHistory) ? weeklySpendingHistory : [];
      const avgWeeklySpending = safeWeeklyHistory.length > 0 
        ? safeWeeklyHistory.reduce((sum, val) => sum + val, 0) / safeWeeklyHistory.length
        : 0;
      
      const currentWeeklySpending = weeklyTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      
      // Calculate average monthly spending for this category
      const monthlySpendingHistory = [];
      for (let i = 0; i < 3; i++) { // Look at last 3 months
        const monthStart = new Date(now.getFullYear(), now.getMonth() - (i + 1), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i, 0);
        
        const monthTransactions = allTransactions.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= monthStart && txDate <= monthEnd;
        });
        
        const monthTotal = monthTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        monthlySpendingHistory.push(monthTotal);
      }
      
      // Safe monthly spending calculation
      const safeMonthlyHistory = Array.isArray(monthlySpendingHistory) ? monthlySpendingHistory : [];
      const avgMonthlySpending = safeMonthlyHistory.length > 0 
        ? safeMonthlyHistory.reduce((sum, val) => sum + val, 0) / safeMonthlyHistory.length
        : 0;
      
      const currentMonthlySpending = monthlyTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      
      baselines[category] = {
        avgWeeklySpending,
        currentWeeklySpending,
        avgMonthlySpending,
        currentMonthlySpending,
        weeklyAnomaly: currentWeeklySpending > avgWeeklySpending * 1.5, // 150% of baseline
        monthlyAnomaly: currentMonthlySpending > avgMonthlySpending * 1.3 // 130% of baseline
      };
    });

    return baselines;
  }, [transactions]);

  // Generate alerts based on detected anomalies
  useEffect(() => {
    if (!user || !transactions || transactions.length === 0) return;

    const newAlerts = [];
    const currentDate = new Date();
    const currentMonthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;

    // Check for category-wise weekly anomalies
    Object.entries(analyzeSpendingPatterns).forEach(([category, data]) => {
      if (data.weeklyAnomaly && data.currentWeeklySpending > 0) {
        const multiplier = (data.currentWeeklySpending / data.avgWeeklySpending).toFixed(1);
        const notificationKey = `weekly-${category}-${currentMonthKey}`;
        
        // Only send notification once per month
        if (!notifiedCategories[notificationKey]) {
          newAlerts.push({
            id: `weekly-${category}-${Date.now()}`,
            type: 'warning',
            title: `High spending detected`,
            message: `You spent ${multiplier}× more on ${category} this week compared to your average.`,
            timestamp: new Date().toISOString(),
            severity: 'high',
            notificationKey
          });
        }
      }

      if (data.monthlyAnomaly && data.currentMonthlySpending > 0) {
        const multiplier = (data.currentMonthlySpending / data.avgMonthlySpending).toFixed(1);
        const notificationKey = `monthly-${category}-${currentMonthKey}`;
        
        // Only send notification once per month
        if (!notifiedCategories[notificationKey]) {
          newAlerts.push({
            id: `monthly-${category}-${Date.now()}`,
            type: 'warning',
            title: `Monthly budget concern`,
            message: `Your ${category} spending this month is ${multiplier}× higher than usual.`,
            timestamp: new Date().toISOString(),
            severity: 'medium',
            notificationKey
          });
        }
      }
    });

    // Check for recent large purchases
    const recentTransactions = transactions
      .filter(tx => tx.type === 'debit' && new Date(tx.date) >= new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    recentTransactions.forEach(tx => {
      const categoryData = analyzeSpendingPatterns[tx.category];
      if (categoryData && tx.amount > categoryData.avgWeeklySpending * 0.5) { // Purchase > 50% of weekly average for category
        const safeAllArray = Array.isArray(categoryData.all) ? categoryData.all : [];
        const avgPerTransaction = categoryData.avgWeeklySpending / Math.max(safeAllArray.length, 1);
        const multiplier = (tx.amount / avgPerTransaction).toFixed(1);
        
        newAlerts.push({
          id: `purchase-${tx._id || Date.now()}`,
          type: 'info',
          title: `Large purchase detected`,
          message: `This ${tx.category} purchase is ${multiplier}× larger than your typical transaction in this category.`,
          timestamp: tx.date,
          severity: 'low'
        });
      }
    });

    // Limit to last 10 alerts
    setAlerts(prev => {
      const combined = [...prev, ...newAlerts].slice(-10);
      return combined;
    });
    
    // Update notified categories to prevent duplicate notifications this month
    if (newAlerts.length > 0) {
      setNotifiedCategories(prev => {
        const updated = { ...prev };
        newAlerts.forEach(alert => {
          if (alert.notificationKey) {
            updated[alert.notificationKey] = true;
          }
        });
        return updated;
      });
    }
  }, [analyzeSpendingPatterns, transactions, user]);

  const dismissAlert = (alertId) => {
    setDismissedAlerts(prev => new Set(prev).add(alertId));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
    setDismissedAlerts(new Set());
  };

  const activeAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

  return (
    <motion.div
      className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl classy-element"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Smart Overspending Alerts</h2>
            <p className="text-sm text-gray-400">Real-time behavioral AI monitoring</p>
          </div>
        </div>
        
        {activeAlerts.length > 0 && (
          <button
            onClick={clearAllAlerts}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 rounded-lg transition-colors text-sm font-medium"
          >
            Clear All Alerts
          </button>
        )}
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {activeAlerts.length === 0 ? (
            <motion.div
              className="text-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Spending Alerts</h3>
              <p className="text-gray-400">Your spending patterns look normal. Keep up the good work!</p>
            </motion.div>
          ) : (
            activeAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                className={`flex items-start justify-between p-4 rounded-xl border transition-all duration-300 ${
                  alert.severity === 'high' 
                    ? 'bg-red-500/20 border-red-500/40' 
                    : alert.severity === 'medium'
                      ? 'bg-yellow-500/20 border-yellow-500/40'
                      : 'bg-blue-500/20 border-blue-500/40'
                }`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`p-2 rounded-lg ${
                      alert.severity === 'high' 
                        ? 'bg-red-500/30' 
                        : alert.severity === 'medium'
                          ? 'bg-yellow-500/30'
                          : 'bg-blue-500/30'
                    }`}>
                      {alert.severity === 'high' ? (
                        <TrendingUp className="h-4 w-4 text-red-400" />
                      ) : alert.severity === 'medium' ? (
                        <Target className="h-4 w-4 text-yellow-400" />
                      ) : (
                        <Wallet className="h-4 w-4 text-blue-400" />
                      )}
                    </div>
                    <h4 className="font-semibold text-white">{alert.title}</h4>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{alert.message}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="ml-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300"
                >
                  ×
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Insights Section */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-green-400" />
          <span>Spending Insights</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex flex-col h-full">
            <h4 className="text-sm font-medium text-gray-300 mb-3 pb-2 border-b border-white/5">Category Breakdown This Month</h4>
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar flex-1">
              {Object.entries(analyzeSpendingPatterns)
                .sort((a, b) => b[1].currentMonthlySpending - a[1].currentMonthlySpending)
                .map(([category, data]) => (
                  <div key={category} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors px-1 rounded-md">
                    <span className="text-white text-sm">{category}</span>
                    <span className="text-gray-300 text-sm font-semibold">₹{data.currentMonthlySpending.toLocaleString()}</span>
                  </div>
                ))}
              {Object.keys(analyzeSpendingPatterns).length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4 italic">No spending data for this month</p>
              )}
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex flex-col">
            <h4 className="text-sm font-medium text-gray-300 mb-3 pb-2 border-b border-white/5">Anomaly Detection Status</h4>
            <div className="space-y-4 flex-1">
              <div className="flex justify-between items-center">
                <span className="text-white text-sm">Weekly Patterns</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  Object.values(analyzeSpendingPatterns).some(data => data.weeklyAnomaly) 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  {Object.values(analyzeSpendingPatterns).some(data => data.weeklyAnomaly) ? 'Anomalies Found' : 'Normal'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white text-sm">Monthly Patterns</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  Object.values(analyzeSpendingPatterns).some(data => data.monthlyAnomaly) 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  {Object.values(analyzeSpendingPatterns).some(data => data.monthlyAnomaly) ? 'Anomalies Found' : 'Normal'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-white text-sm">Overall Risk Profile</span>
                  <div className="group relative">
                    <span className="text-xs text-gray-500 cursor-help underline decoration-dotted">?</span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 border border-white/10 rounded text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      Risk is calculated based on current active alerts and anomaly counts.
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  activeAlerts.length > 2 ? 'bg-red-500 text-white' : 
                  activeAlerts.length > 0 ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
                }`}>
                  {activeAlerts.length > 2 ? 'High Risk' : 
                   activeAlerts.length > 0 ? 'Medium Risk' : 'Healthy'}
                </span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-300">
                <span className="font-bold">AI Tip:</span> {activeAlerts.length > 0 
                  ? "Consider reviewing the high-spend categories listed on the left to optimize your budget."
                  : "Maintain your current spending pace to hit your monthly savings goal."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SmartOverspendingAlerts;