import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import Analytics from '../components/Analytics';
import AccountAnalytics from '../components/AccountAnalytics';

const AnalyticsPage = ({ transactions = [], bankAccounts = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <motion.main 
          className="max-w-7xl mx-auto p-4 md:p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => navigate('/')}
              className="p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl hover:bg-white/20 transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
                <BarChart3 className="w-8 h-8 text-purple-400" />
                <span>Analytics & Insights</span>
              </h1>
              <p className="text-gray-400 mt-1">Visualize your spending patterns and financial health</p>
            </div>
          </div>

          {/* Analytics Components */}
          <div className="space-y-6">
            <Analytics transactions={transactions} bankAccounts={bankAccounts} currency="INR" />
            <AccountAnalytics transactions={transactions} />
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default AnalyticsPage;
