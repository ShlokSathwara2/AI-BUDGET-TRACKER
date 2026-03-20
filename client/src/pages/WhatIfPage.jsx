import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator, TrendingUp } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import WhatIfSimulator from '../components/WhatIfSimulator';

const WhatIfPage = ({ transactions }) => {
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
                <Calculator className="w-8 h-8 text-slate-400" />
                <span>What-If Analysis</span>
              </h1>
              <p className="text-gray-400 mt-1">Simulate financial scenarios and plan ahead</p>
            </div>
          </div>

          {/* What-If Simulator */}
          <WhatIfSimulator transactions={transactions} />
        </motion.main>
      </div>
    </div>
  );
};

export default WhatIfPage;
