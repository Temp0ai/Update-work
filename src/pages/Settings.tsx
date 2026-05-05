import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { BusinessSettings } from '../types';
import { Store, User, Phone, Save, CheckCircle2, Search, Trash2, X, Key, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Customer } from '../types';

export default function Settings() {
  const [settings, setSettings] = useState<BusinessSettings>(storage.getSettings());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [cleaningStatus, setCleaningStatus] = useState<'idle' | 'cleaning' | 'done'>('idle');
  const [showDeletionSection, setShowDeletionSection] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    setCustomers(storage.getCustomers());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleFormatNumbers = () => {
    setCleaningStatus('cleaning');
    storage.runCleanup();
    setTimeout(() => {
      setCleaningStatus('done');
      setCustomers(storage.getCustomers());
      setTimeout(() => setCleaningStatus('idle'), 3000);
    }, 800);
  };

  const toggleSelect = (id: string) => {
    setConfirmDelete(false);
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    
    storage.deleteCustomersBulk(selectedIds);
    const remaining = storage.getCustomers();
    setCustomers(remaining);
    setSelectedIds([]);
    setConfirmDelete(false);
    setCleaningStatus('done');
    setTimeout(() => setCleaningStatus('idle'), 2000);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight">Business Profile</h2>
        <p className="text-sm text-gray-500">Manage your boutique details and owner information.</p>
      </header>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-2">
            <label className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
              <Store size={14} className="mr-2" /> Shop Name
            </label>
            <input 
              type="text" 
              required
              value={settings.shopName}
              onChange={e => setSettings({...settings, shopName: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-pink-200 focus:bg-white rounded-xl transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
              <span className="mr-2 italic">"</span> Slogan
            </label>
            <input 
              type="text" 
              required
              value={settings.slogan}
              onChange={e => setSettings({...settings, slogan: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-pink-200 focus:bg-white rounded-xl transition-all outline-none font-medium text-pink-600"
            />
          </div>

          <div className="pt-2 border-t border-gray-50"></div>

          <div className="space-y-2">
            <label className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
              <User size={14} className="mr-2" /> Owner Name
            </label>
            <input 
              type="text" 
              required
              value={settings.ownerName}
              onChange={e => setSettings({...settings, ownerName: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-pink-200 focus:bg-white rounded-xl transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
              <Phone size={14} className="mr-2" /> Contact Number
            </label>
            <input
              type="tel"
              required
              value={settings.ownerPhone}
              onChange={e => setSettings({...settings, ownerPhone: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-pink-200 focus:bg-white rounded-xl transition-all outline-none"
            />
          </div>

          <div className="pt-2 border-t border-gray-50"></div>

          <div className="space-y-2">
            <label className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
              <Key size={14} className="mr-2" /> Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={settings.geminiApiKey || ''}
                onChange={e => setSettings({...settings, geminiApiKey: e.target.value})}
                placeholder="Enter your Gemini API key"
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-transparent focus:border-pink-200 focus:bg-white rounded-xl transition-all outline-none text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 px-1">Required for AI Content Studio and personalized messages. Get yours at <span className="text-pink-500">aistudio.google.com</span></p>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold shadow-lg shadow-pink-100 flex items-center justify-center space-x-2 active:scale-95 transition-all outline-none"
            >
              {saved ? (
                <>
                  <CheckCircle2 size={20} />
                  <span>Profile Saved!</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Database Maintenance</h3>
          <button 
            onClick={() => setShowDeletionSection(!showDeletionSection)}
            className="text-xs font-bold text-pink-600"
          >
            {showDeletionSection ? 'Hide Section' : 'Manage Deletion'}
          </button>
        </div>

        <button 
          onClick={handleFormatNumbers}
          disabled={cleaningStatus !== 'idle' || showDeletionSection}
          className={cn(
            "w-full py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all outline-none border-2 mb-4",
            cleaningStatus === 'idle' ? "border-gray-50 text-gray-700 hover:bg-gray-50" : 
            cleaningStatus === 'cleaning' ? "border-gray-50 text-gray-400" :
            "border-green-50 text-green-500 bg-green-50"
          )}
        >
          {cleaningStatus === 'idle' && <CheckCircle2 size={18} className="text-pink-400" />}
          <span>
            {cleaningStatus === 'idle' ? 'Auto-Format Numbers (+91)' : 
             cleaningStatus === 'cleaning' ? 'Formatting...' : 
             'Numbers Formatted!'}
          </span>
        </button>

        <AnimatePresence>
          {showDeletionSection && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 pt-4 border-t border-gray-50"
            >
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search customer to delete..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-transparent focus:border-pink-100 focus:bg-white rounded-xl outline-none"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {filteredCustomers.length === 0 ? (
                  <p className="text-center py-8 text-xs text-gray-400">No customers found.</p>
                ) : (
                  filteredCustomers.map(customer => (
                    <div 
                      key={customer.id}
                      onClick={() => toggleSelect(customer.id)}
                      className={cn(
                        "flex items-center p-3 rounded-xl cursor-pointer transition-all border",
                        selectedIds.includes(customer.id) 
                          ? "bg-red-50 border-red-100" 
                          : "bg-white border-transparent hover:bg-gray-50"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors",
                        selectedIds.includes(customer.id) ? "bg-red-500 border-red-500" : "border-gray-300 bg-white"
                      )}>
                        {selectedIds.includes(customer.id) && <X size={10} className="text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800">{customer.name}</p>
                        <p className="text-[10px] text-gray-500">{customer.phone}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {selectedIds.length > 0 && (
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  onClick={() => {
                    if (!confirmDelete) {
                      setConfirmDelete(true);
                    } else {
                      handleDeleteSelected();
                    }
                  }}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-all text-white",
                    confirmDelete ? "bg-orange-500 shadow-orange-100 animate-pulse" : "bg-red-500 shadow-red-100"
                  )}
                >
                  <Trash2 size={18} />
                  <span>{confirmDelete ? "Confirm Permanent Delete?" : `Delete ${selectedIds.length} Selected`}</span>
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[10px] text-gray-400 mt-3 text-center px-4 leading-relaxed italic">
          * Delete Selected will remove them permanently. Auto-Format will ensure all numbers are in the correct format for WhatsApp outreach.
        </p>
      </div>


      <div className="p-6 bg-pink-50 rounded-3xl border border-pink-100">
        <h4 className="font-bold text-pink-700 mb-1 flex items-center">
           <Store size={16} className="mr-2" /> Meraki Boutique
        </h4>
        <p className="text-xs text-pink-600/80 leading-relaxed">
          This information is used across the app for branding and within AI-generated messages to personalize your customer outreach.
        </p>
      </div>
    </div>
  );
}
