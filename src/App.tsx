/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, History, MessageSquare, Plus, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from './lib/utils';

// Pages - to be created
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Purchases from './pages/History';
import Messages from './pages/Messages';
import CustomerDetail from './pages/CustomerDetail';

function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Home' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/messages', icon: MessageSquare, label: 'Outreach' },
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
              isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
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
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100">
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 h-14 flex items-center justify-between px-4 z-40">
          <h1 className="font-bold text-lg tracking-tight">Customer<span className="text-blue-600">Connect</span></h1>
          <button className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
            <Search size={20} />
          </button>
        </header>

        <main className="max-w-md mx-auto">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
              <Route path="/customers" element={<PageWrapper><Customers /></PageWrapper>} />
              <Route path="/customers/:id" element={<PageWrapper><CustomerDetail /></PageWrapper>} />
              <Route path="/history" element={<PageWrapper><Purchases /></PageWrapper>} />
              <Route path="/messages" element={<PageWrapper><Messages /></PageWrapper>} />
            </Routes>
          </AnimatePresence>
        </main>

        <BottomNav />
      </div>
    </Router>
  );
}
