import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Receipt, 
  BarChart3, 
  Brain, 
  PiggyBank, 
  Bell, 
  Users, 
  MessageSquare,
  FileText,
  Calculator,
  Wallet,
  TrendingUp,
  Shield,
  Landmark,
  Settings
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import AnimatedBackground from '../components/AnimatedBackground';
import SummaryCards from '../components/SummaryCards';
import PredictionCard from '../components/PredictionCard';

const Dashboard = ({ transactions = [], user }) => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  // Feature sections configuration
  const featureSections = [
    {
      title: 'Core Features',
      features: [
        {
          id: 'transactions',
          label: 'Transactions',
          icon: Receipt,
          color: 'from-blue-500 to-cyan-500',
          description: 'Manage income & expenses'
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart3,
          color: 'from-purple-500 to-pink-500',
          description: 'Spending insights & charts'
        },
        {
          id: 'ai-insights',
          label: 'AI Insights',
          icon: Brain,
          color: 'from-indigo-500 to-violet-500',
          description: 'Smart spending alerts'
        }
      ]
    },
    {
      title: 'Accounts & Goals',
      features: [
        {
          id: 'bank-accounts',
          label: 'Bank Accounts',
          icon: Landmark,
          color: 'from-green-500 to-emerald-500',
          description: 'Manage your bank accounts'
        },
        {
          id: 'saving-goals',
          label: 'Saving Goals',
          icon: PiggyBank,
          color: 'from-teal-500 to-cyan-500',
          description: 'Track savings progress'
        },
        {
          id: 'payment-reminders',
          label: 'Payment Reminders',
          icon: Bell,
          color: 'from-orange-500 to-red-500',
          description: 'Never miss a payment'
        }
      ]
    },
    {
      title: 'Advanced Tools',
      features: [
        {
          id: 'family-budget',
          label: 'Family Budget',
          icon: Users,
          color: 'from-rose-500 to-pink-500',
          description: 'Shared expense management'
        },
        {
          id: 'sms-extractor',
          label: 'SMS Extractor',
          icon: MessageSquare,
          color: 'from-amber-500 to-yellow-500',
          description: 'Auto-import from SMS'
        },
        {
          id: 'what-if',
          label: 'What-If Analysis',
          icon: Calculator,
          color: 'from-slate-500 to-gray-500',
          description: 'Financial scenario planning'
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: FileText,
          color: 'from-blue-600 to-indigo-600',
          description: 'Detailed financial reports'
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          color: 'from-indigo-500 to-purple-500',
          description: 'Profile, notifications & privacy'
        }
      ]
    }
  ];

  const handleFeatureClick = (featureId) => {
    navigate(`/${featureId}`);
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      <motion.main 
          className="max-w-7xl mx-auto p-4 md:p-6 space-y-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Welcome Header */}
          <motion.div 
            className="text-center py-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-300 via-blue-300 to-purple-300 bg-clip-text text-transparent mb-3">
              {transactions && transactions.length === 0 ? 'Welcome to TRIKIA!' : `Hello, ${user?.name || 'User'}!`}
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto text-lg">
              {transactions && transactions.length === 0 
                ? 'Get started by adding your first transaction below' 
                : 'Continue tracking your expenses with your personalized AI Budget Tracker'}
            </p>
            {transactions && transactions.length === 0 && (
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg max-w-md mx-auto">
                <p className="text-blue-300 text-sm">
                  <span className="font-semibold">New user:</span> Your balance is initialized to zero. Add your first transaction to get started!
                </p>
              </div>
            )}
          </motion.div>

          {/* Progress Cards - Top Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <SummaryCards 
              transactions={transactions} 
              currency="INR"
              currencySymbol="₹"
            />
          </motion.div>

          {/* Prediction Card - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <PredictionCard transactions={transactions} currency="INR" currencySymbol="₹" />
          </motion.div>

          {/* Feature Navigation Hub */}
          <div className="space-y-8">
            {featureSections.map((section, sectionIndex) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + (sectionIndex * 0.1) }}
              >
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-white mb-2">{section.title}</h2>
                  <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {section.features.map((feature, featureIndex) => {
                    const IconComponent = feature.icon;
                    return (
                      <motion.button
                        key={feature.id}
                        onClick={() => handleFeatureClick(feature.id)}
                        className={`relative group p-6 bg-gradient-to-br ${feature.color}/20 backdrop-blur-xl border border-white/20 rounded-2xl hover:border-white/40 transition-all duration-300 transform hover:scale-105`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + (featureIndex * 0.05) }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {/* Glow Effect */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl`}></div>
                        
                        {/* Icon */}
                        <div className={`relative z-10 p-4 bg-gradient-to-br ${feature.color} rounded-xl mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                          <IconComponent className="w-8 h-8 text-white" />
                        </div>
                        
                        {/* Label */}
                        <h3 className="relative z-10 text-base font-semibold text-white text-center mb-1">
                          {feature.label}
                        </h3>
                        
                        {/* Description */}
                        <p className="relative z-10 text-xs text-gray-300 text-center line-clamp-2">
                          {feature.description}
                        </p>

                        {/* Hover Indicator */}
                        <div className="relative z-10 mt-2 flex justify-center">
                          <div className="w-8 h-1 bg-white/20 rounded-full group-hover:bg-white/40 transition-colors duration-300"></div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Stats Footer */}
          <motion.div
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <span>Quick Overview</span>
              </h3>
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Total Transactions</p>
                <p className="text-xl font-bold text-white">{transactions.length}</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Income</p>
                <p className="text-xl font-bold text-green-400">
                  ₹{transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Expenses</p>
                <p className="text-xl font-bold text-red-400">
                  ₹{transactions.filter(t => t.type !== 'credit').reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Balance</p>
                <p className="text-xl font-bold text-blue-400">
                  ₹{(transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + (t.amount || 0), 0) - 
                     transactions.filter(t => t.type !== 'credit').reduce((sum, t) => sum + (t.amount || 0), 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.main>
    </div>
  );
};

export default Dashboard;