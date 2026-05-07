/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, History, Settings as SettingsIcon, Plus, Search, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from './lib/utils';

// WhatsApp SVG Icon
const WhatsAppIcon = ({ size = 20, active }: { size?: number; active?: boolean }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={active ? '#25D366' : '#6B7280'}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

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
    { path: '/history', icon: History, label: 'Sales' },
    { path: '/gemini', icon: Sparkles, label: 'Gemini' },
    { path: '/messages', icon: WhatsAppIcon, label: 'WhatsApp', isWhatsApp: true },
    { path: '/settings', icon: SettingsIcon, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-4 pb-safe z-50">
      {navItems.map(({ path, icon: Icon, label, isWhatsApp }) => {
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
            {isWhatsApp ? <WhatsAppIcon size={20} active={isActive} /> : <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />}
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
              <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center border border-pink-100">
                {/* Android Robot Icon */}
                <svg viewBox="0 0 24 24" width="20" height="20" fill="#A4C639">
                  <path d="M6 15a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6z"/>
                  <path d="M6 7V5a6 6 0 0 1 12 0v2" stroke="#A4C639" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  <circle cx="9" cy="11" r="1" fill="white"/>
                  <circle cx="15" cy="11" r="1" fill="white"/>
                  <path d="M8 15v2a4 4 0 0 0 8 0v-2" stroke="#A4C639" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
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
