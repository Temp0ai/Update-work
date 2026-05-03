/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, History, MessageSquare, Settings as SettingsIcon, Plus, Search, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from './lib/utils';

// Pages - to be created
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Purchases from './pages/History';
import Messages from './pages/Messages';
import CustomerDetail from './pages/CustomerDetail';
import Settings from './pages/Settings';
import Gemini from './pages/Gemini';
import { storage } from './services/storage';

function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Home' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/gemini', icon: Sparkles, label: 'Gemini' },
    { path: '/messages', icon: MessageSquare, label: 'Outreach' },
    { path: '/settings', icon: SettingsIcon, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-4 pb-safe z-50">
      {navItems.map(({ path, icon: Icon, label }) => {
        const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
        return (
          <Link
            key={path}
            to={path}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 w-full h-full transition-colors",
              isActive ? "text-pink-600" : "text-gray-500 hover:text-gray-900"
            )}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="pb-20 pt-4 px-4"
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const settings = storage.getSettings();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-pink-100">
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 h-14 flex items-center justify-between px-4 z-40">
          <Link to="/" className="flex flex-col">
            <h1 className="font-bold text-lg leading-tight tracking-tight">{settings.shopName}</h1>
            <p className="text-[8px] text-pink-500 font-bold uppercase tracking-widest leading-none">{settings.slogan}</p>
          </Link>
          <div className="flex items-center space-x-1">
            <Link to="/settings" className="p-2 text-gray-400 hover:text-pink-600 transition-colors">
              <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 border border-pink-100">
                {settings.ownerName.charAt(0)}
              </div>
            </Link>
          </div>
        </header>

        <main className="max-w-md mx-auto">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
              <Route path="/customers" element={<PageWrapper><Customers /></PageWrapper>} />
              <Route path="/customers/:id" element={<PageWrapper><CustomerDetail /></PageWrapper>} />
              <Route path="/history" element={<PageWrapper><Purchases /></PageWrapper>} />
              <Route path="/messages" element={<PageWrapper><Messages /></PageWrapper>} />
              <Route path="/gemini" element={<PageWrapper><Gemini /></PageWrapper>} />
              <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
            </Routes>
          </AnimatePresence>
        </main>

        <BottomNav />
      </div>
    </Router>
  );
}
