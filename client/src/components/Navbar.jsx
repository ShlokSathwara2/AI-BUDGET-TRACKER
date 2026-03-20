import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Wallet, User, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Navbar({ user, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <motion.header
      className="w-full py-4 px-4 md:px-6 bg-gradient-to-r from-blue-900/80 to-indigo-900/80 backdrop-blur-lg border-b border-blue-500/20 classy-element"
      initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo + Welcome */}
        <motion.div className="flex items-center space-x-3" whileHover={{ scale: 1.03 }}>
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg animate-classy-pulse">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent tracking-tight">
              TRIKIA
            </h1>
            <p className="text-xs text-gray-400">AI Budget Tracker</p>
            {user && (
              <motion.p className="text-sm text-gray-300 italic"
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                Welcome, <span className="font-semibold text-white">{user.name}</span>
              </motion.p>
            )}
          </div>
        </motion.div>

        {/* Desktop controls */}
        <div className="hidden md:flex items-center space-x-3">
          <button onClick={toggleTheme}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300"
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
            {isDarkMode
              ? <Sun className="h-5 w-5 text-yellow-400" />
              : <Moon className="h-5 w-5 text-gray-300" />}
          </button>

          {user && (
            <motion.div className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} whileHover={{ scale: 1.05 }}>
              <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-semibold text-sm">{user.name}</span>
            </motion.div>
          )}

          {user && (
            <motion.button onClick={onLogout}
              className="flex px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-all items-center space-x-2 shadow-lg classy-button"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <LogOut className="h-4 w-4" />
              <span className="font-medium">Logout</span>
            </motion.button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div className="md:hidden mt-4 py-4 border-t border-blue-500/20"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex flex-col space-y-3">
              {user && (
                <div className="px-4 py-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg border border-blue-500/30">
                  <p className="text-blue-200 text-sm">👋 Welcome back,</p>
                  <p className="text-white font-bold text-lg">{user.name}</p>
                </div>
              )}
              <motion.button
                onClick={() => { toggleTheme(); setIsMenuOpen(false); }}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center space-x-2 w-full text-left"
                whileHover={{ x: 5 }}>
                {isDarkMode ? <Sun className="h-4 w-4 text-yellow-400" /> : <Moon className="h-4 w-4 text-gray-300" />}
                <span>Switch to {isDarkMode ? 'Light' : 'Dark'} Mode</span>
              </motion.button>
              {user && (
                <motion.button
                  onClick={() => { onLogout(); setIsMenuOpen(false); }}
                  className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg flex items-center space-x-2"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}