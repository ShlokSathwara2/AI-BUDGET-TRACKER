import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  X, 
  User, 
  Bot, 
  TrendingUp, 
  Wallet, 
  BarChart3,
  Lightbulb,
  Calculator,
  HelpCircle
} from 'lucide-react';

const AIChatAssistant = ({ transactions = [], bankAccounts = [], isVisible, setIsVisible }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI Financial Advisor. I can help you with budgeting advice, spending analysis, savings recommendations, and financial planning. What would you like to discuss today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Financial analysis functions
  const analyzeSpending = () => {
    if (!transactions || transactions.length === 0) {
      return "I don't have enough transaction data to provide insights yet. Please log some expenses first!";
    }

    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    const allExpenses = transactions.filter(tx => tx.type === 'debit');
    if (allExpenses.length === 0) return "You haven't recorded any expenses yet! You're doing great at saving, or you need to log some data.";

    const recentTransactions = allExpenses.filter(tx => new Date(tx.date || tx.createdAt) >= oneMonthAgo);
    
    if (recentTransactions.length === 0) {
      return "You have no expenses recorded in the last 30 days. Add some recent transactions for me to analyze!";
    }

    const totalSpent = recentTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const avgDailySpending = totalSpent / 30;
    
    const categorySpending = {};
    recentTransactions.forEach(tx => {
      const category = tx.category || 'Other';
      categorySpending[category] = (categorySpending[category] || 0) + (Number(tx.amount) || 0);
    });
    
    const sortedCategories = Object.entries(categorySpending).sort(([,a], [,b]) => b - a);
    const topCategory = sortedCategories[0];
    const secondCategory = sortedCategories[1];

    const biggestExpense = [...recentTransactions].sort((a,b) => Number(b.amount) - Number(a.amount))[0];
    
    let analysis = `**Last 30 Days Spending Analysis:**\n\n` +
                   `• **Total spent:** ₹${totalSpent.toLocaleString()}\n` +
                   `• **Daily burn rate:** ₹${Math.round(avgDailySpending).toLocaleString()}/day\n`;
                   
    if (topCategory) {
      analysis += `• **Highest category:** ${topCategory[0]} (₹${topCategory[1].toLocaleString()})\n`;
    }
    if (secondCategory) {
      analysis += `• **Runner up:** ${secondCategory[0]} (₹${secondCategory[1].toLocaleString()})\n`;
    }
    if (biggestExpense) {
      analysis += `• **Largest single expense:** ₹${Number(biggestExpense.amount).toLocaleString()} at ${biggestExpense.merchant || 'Unknown'}\n`;
    }
    
    // Add a smart insight
    if (topCategory && topCategory[1] > (totalSpent * 0.4)) {
      analysis += `\n**💡 Insight:** You're spending over 40% of your money just on ${topCategory[0]}. Consider setting a strict budget limit for this category!`;
    } else if (avgDailySpending > 2000) {
      analysis += `\n**💡 Insight:** Your daily burn rate is quite high (₹${Math.round(avgDailySpending).toLocaleString()}/day). Try observing a few strict "no-spend" days to bring this down.`;
    } else {
      analysis += `\n**💡 Insight:** Your spending is fairly distributed! Keep tracking your expenses to maintain this balance.`;
    }

    return analysis;
  };

  const provideSavingsAdvice = () => {
    if (!transactions || transactions.length === 0) {
      return "Please add some transactions so I can analyze your spending patterns and provide personalized savings advice.";
    }

    const incomeTransactions = transactions.filter(tx => tx.type === 'credit');
    const expenseTransactions = transactions.filter(tx => tx.type === 'debit');
    
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    // Calculate for the last 30 days for more relevant advice
    const recentIncome = incomeTransactions.filter(tx => new Date(tx.date || tx.createdAt) >= oneMonthAgo).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const recentExpenses = expenseTransactions.filter(tx => new Date(tx.date || tx.createdAt) >= oneMonthAgo).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    
    const inc = recentIncome > 0 ? recentIncome : incomeTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const exp = recentIncome > 0 ? recentExpenses : expenseTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    
    if (inc === 0) {
      return "I can't see any income recorded yet. Please log your salary or earnings so I can calculate your savings rate!";
    }
    
    const savingsRate = ((inc - exp) / inc) * 100;
    
    let advice = `Based on your recent data, your current savings rate is **${savingsRate.toFixed(1)}%**.\n\n`;
    
    if (savingsRate < 0) {
      advice += "⚠️ **Warning:** You are spending more than you earn! Immediately review your recent expenses and cut down on non-essential categories like dining or entertainment.";
    } else if (savingsRate < 10) {
      advice += "This is below the recommended 20%. Consider reducing discretionary spending. Look at your top expenses and try the 50/30/20 rule (50% Needs, 30% Wants, 20% Savings).";
    } else if (savingsRate < 20) {
      advice += "You're doing well, but could aim for the 20% savings benchmark. Look for small monthly subscriptions or impulse buys to optimize.";
    } else {
      advice += "🌟 **Excellent!** You're maintaining a healthy savings rate above 20%. Consider investing your surplus into index funds, mutual funds, or an emergency fund if you don't have one yet.";
    }
    
    return advice;
  };

  const accountAnalysis = (accountName) => {
    const safeBankAccounts = Array.isArray(bankAccounts) ? bankAccounts : [];
    
    if (!safeBankAccounts || safeBankAccounts.length === 0) {
      return "You haven't added any bank accounts yet. Please add your accounts in the Bank Accounts page first.";
    }
    
    if (!accountName || accountName.trim() === '') {
      // General overview
      const totalBalance = safeBankAccounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
      return `You have ${safeBankAccounts.length} linked account(s) with a total combined balance of **₹${totalBalance.toLocaleString()}**.\n\nYour accounts: ${safeBankAccounts.map(a => a.name).join(', ')}.`;
    }

    const account = safeBankAccounts.find(acc => 
      acc?.name?.toLowerCase().includes(accountName.toLowerCase()) || 
      acc?.lastFourDigits === accountName
    );
    
    if (!account) {
      return `I couldn't find an account matching "${accountName}". Your current accounts are: ${safeBankAccounts.map(acc => acc.name).join(', ')}`;
    }
    
    const accountTransactions = transactions.filter(tx => tx.bankAccountId === account.id);
    const income = accountTransactions.filter(tx => tx.type === 'credit').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const expenses = accountTransactions.filter(tx => tx.type === 'debit').reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const netFlow = income - expenses;
    
    return `**Analysis for ${account.name}** (ending in ${account.lastFourDigits || 'XXXX'}):\n\n` +
           `• **Current balance:** ₹${Number(account.balance).toLocaleString()}\n` +
           `• **Total income routed here:** ₹${income.toLocaleString()}\n` +
           `• **Total expenses paid from here:** ₹${expenses.toLocaleString()}\n` +
           `• **Net flow:** ${netFlow >= 0 ? '+' : ''}₹${netFlow.toLocaleString()}`;
  };

  const findHighestExpense = () => {
    const allExpenses = transactions.filter(tx => tx.type === 'debit');
    if (allExpenses.length === 0) return "You haven't recorded any expenses yet.";
    
    const biggest = allExpenses.sort((a,b) => Number(b.amount) - Number(a.amount))[0];
    const date = new Date(biggest.date || biggest.createdAt).toLocaleDateString();
    
    return `Your highest recorded expense is **₹${Number(biggest.amount).toLocaleString()}**.\n\n` +
           `It was spent on **${biggest.merchant || 'Unknown Merchant'}** (${biggest.category}) on ${date}.`;
  };

  const generateResponse = async (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Algorithmic Keyword Intent Scoring
    const intents = {
      spend_analysis: ['spend', 'spending', 'expense', 'analyze', 'analysis', 'where does my money'],
      savings_advice: ['save', 'savings', 'saving', 'advice', 'how to save'],
      account_info: ['account', 'balance', 'bank', 'wallet'],
      highest_expense: ['highest', 'biggest', 'largest', 'most expensive', 'maximum'],
      budgeting: ['budget', 'plan', 'rule', 'manage'],
      investing: ['invest', 'investment', 'grow money', 'stocks', 'mutual funds']
    };

    let matchedIntent = null;
    let maxMatches = 0;

    for (const [intent, keywords] of Object.entries(intents)) {
      const matches = keywords.filter(kw => message.includes(kw)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        matchedIntent = intent;
      }
    }

    // Exact handling for highest expense before general spending
    if (matchedIntent === 'highest_expense') {
      return findHighestExpense();
    }
    if (matchedIntent === 'spend_analysis') {
      return analyzeSpending();
    }
    if (matchedIntent === 'savings_advice') {
      return provideSavingsAdvice();
    }
    if (matchedIntent === 'account_info') {
      const accountName = message.replace(/(tell me about|what is|how much|in my|my|the|account|balance)/g, '').trim();
      return accountAnalysis(accountName);
    }
    if (matchedIntent === 'budgeting') {
      return "I strongly recommend the **50/30/20 budget framework**:\n\n" +
             "• **50% Needs:** Rent, groceries, bills, EMIs.\n" +
             "• **30% Wants:** Dining out, movies, hobbies, shopping.\n" +
             "• **20% Savings:** Investments, emergency fund, debt payoff.\n\n" +
             "Try tracking your expenses against these buckets using the Analytics page!";
    }
    if (matchedIntent === 'investing') {
      return "Before investing, ensure you have an **emergency fund** (3-6 months of expenses) saved in a liquid bank account.\n\n" +
             "Once that's secure, consider low-cost Index Mutual Funds (like Nifty 50) for long-term growth. If you want lower risk, look into Fixed Deposits or Government Bonds. Always assess your risk tolerance before investing.";
    }
    
    // Context-aware fallback
    if (transactions.length > 0) {
      const latestTx = transactions[0];
      return `I see you recently logged a ${latestTx.type} of ₹${latestTx.amount} for ${latestTx.category}. Would you like me to analyze your overall spending, review your savings rate, or check your account balances?`;
    }

    return "I am your AI Financial Advisor! You can ask me things like:\n\n• 'Analyze my spending'\n• 'How can I save more?'\n• 'What is my highest expense?'\n• 'Tell me my account balances'";
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(async () => {
      const aiResponse = await generateResponse(inputValue);
      
      const aiMessage = {
        id: messages.length + 2,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 left-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:from-blue-500 hover:to-purple-500 transition-all duration-300 z-50"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col border border-white/10 shadow-2xl"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Financial Advisor</h2>
              <p className="text-sm text-gray-400">Always here to help with your finances</p>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`p-2 rounded-full ${message.sender === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                    {message.sender === 'user' ? 
                      <User className="h-4 w-4 text-white" /> : 
                      <Bot className="h-4 w-4 text-white" />
                    }
                  </div>
                  <div className={`p-3 rounded-2xl ${message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white/10 text-white'}`}>
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex items-start space-x-2">
                <div className="p-2 bg-purple-600 rounded-full">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="p-3 rounded-2xl bg-white/10">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-2 border-t border-white/10">
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              onClick={() => setInputValue('Analyze my spending patterns')}
              className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Analyze Spending
            </button>
            <button
              onClick={() => setInputValue('How can I save more money?')}
              className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Savings Advice
            </button>
            <button
              onClick={() => setInputValue('Tell me about my accounts')}
              className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Account Analysis
            </button>
            <button
              onClick={() => setInputValue('Help with budget planning')}
              className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Budget Planning
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your finances..."
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all duration-300 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AIChatAssistant;