import React, { useState, useEffect } from 'react';
import { MessageCircle, Gift, Clock, Sparkles, Send, Check, Loader2, Users, Search, ChevronDown, X, Download, ExternalLink, FileSpreadsheet, Pencil } from 'lucide-react';
import { storage } from '../services/storage';
import { Customer, Purchase } from '../types';
import { getWhatsAppLink, getWhatsAppAppLink, cn } from '../lib/utils';
import { format, subDays, getMonth, getDate } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { generatePersonalizedMessage } from '../services/ai';

type Tab = 'whatsapp' | 'birthdays' | 'followup' | 'sheets';

const WHATSAPP_SVG = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#25D366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function Messages() {
  const [activeTab, setActiveTab] = useState<Tab>('whatsapp');
  const [bdays, setBdays] = useState<Customer[]>([]);
  const [lapsed, setLapsed] = useState<Customer[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [bulkQueue, setBulkQueue] = useState<BulkQueue>({
    active: false,
    customers: [],
    currentIndex: 0,
    message: '',
    isPaused: false
  });

  useEffect(() => {
    const customers = storage.getCustomers();
    const purchases = storage.getPurchases();
    const now = new Date();

    const currentBdays = customers.filter(c => {
      if (!c.birthday) return false;
      const bday = new Date(c.birthday);
      return getMonth(bday) === getMonth(now) && getDate(bday) === getDate(now);
    });
    setBdays(currentBdays);
    setPurchases(purchases);

    const thirtyDaysAgo = subDays(now, 30).getTime();
    const lapsedCustomers = customers.filter(c => {
      const customerPurchases = purchases.filter(p => p.customerId === c.id);
      if (customerPurchases.length === 0) return true;
      const lastPurchase = Math.max(...customerPurchases.map(p => p.date));
      return lastPurchase < thirtyDaysAgo;
    });
    setLapsed(lapsedCustomers);
  }, []);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'whatsapp', label: 'WhatsApp', icon: WHATSAPP_SVG },
    { key: 'birthdays', label: 'Birthdays', icon: <Gift size={16} className="text-pink-500" /> },
    { key: 'followup', label: 'Follow-up', icon: <Clock size={16} className="text-pink-400" /> },
    { key: 'sheets', label: 'Sheets', icon: <FileSpreadsheet size={16} className="text-green-600" /> },
  ];

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-bold tracking-tight">Outreach Center</h2>
        <p className="text-sm text-gray-500">Engage Meraki customers with fashion updates.</p>
      </header>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-1",
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'whatsapp' && <WhatsAppBulkTab onBulkQueue={setBulkQueue} />}
          {activeTab === 'birthdays' && <BirthdayTab bdays={bdays} purchases={purchases} />}
          {activeTab === 'followup' && <FollowUpTab lapsed={lapsed} purchases={purchases} />}
          {activeTab === 'sheets' && <SheetsTab />}
        </motion.div>
      </AnimatePresence>

      {bulkQueue.active && (
        <BulkSenderModal 
          queue={bulkQueue} 
          onClose={() => setBulkQueue(prev => ({ ...prev, active: false }))}
          onUpdate={(newQueue) => setBulkQueue(newQueue)}
        />
      )}
    </div>
  );
}

/* ─── WhatsApp Bulk Tab ─── */
function WhatsAppBulkTab({ onBulkQueue }: { onBulkQueue: (q: BulkQueue) => void }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [showBroadcastLists, setShowBroadcastLists] = useState(false);
  const [savedLists, setSavedLists] = useState<{ name: string; ids: string[] }[]>([]);
  const [newListName, setNewListName] = useState('');
  const [showSaveList, setShowSaveList] = useState(false);

  useEffect(() => {
    setCustomers(storage.getCustomers());
    const lists = localStorage.getItem('meraki_broadcast_lists');
    if (lists) setSavedLists(JSON.parse(lists));
  }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const toggleCustomer = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => setSelected(filtered.map(c => c.id));
  const clearSelection = () => setSelected([]);

  const loadList = (ids: string[]) => {
    setSelected(ids);
    setShowBroadcastLists(false);
  };

  const saveCurrentAsList = () => {
    if (!newListName.trim() || selected.length === 0) return;
    const updated = [...savedLists, { name: newListName.trim(), ids: [...selected] }];
    setSavedLists(updated);
    localStorage.setItem('meraki_broadcast_lists', JSON.stringify(updated));
    setNewListName('');
    setShowSaveList(false);
  };

  const deleteList = (index: number) => {
    const updated = savedLists.filter((_, i) => i !== index);
    setSavedLists(updated);
    localStorage.setItem('meraki_broadcast_lists', JSON.stringify(updated));
  };

  const startBroadcast = () => {
    if (selected.length === 0 || !message.trim()) return;
    const selectedCustomers = customers.filter(c => selected.includes(c.id));
    onBulkQueue({
      active: true,
      customers: selectedCustomers,
      currentIndex: 0,
      message: message.trim(),
      isPaused: false
    });
  };

  return (
    <div className="space-y-4">
      {/* Message Template */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-3">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Broadcast Message</label>
        <textarea 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your WhatsApp broadcast message..."
          className="w-full text-sm bg-gray-50 p-3 rounded-xl border border-gray-50 text-gray-700 h-24 focus:ring-2 focus:ring-green-100 focus:border-green-300 focus:outline-none transition-all outline-none resize-none"
        />
        <p className="text-[10px] text-gray-400 px-1">{selected.length} recipient{selected.length !== 1 ? 's' : ''} selected</p>
      </div>

      {/* Broadcast Lists */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <button 
          onClick={() => setShowBroadcastLists(!showBroadcastLists)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {WHATSAPP_SVG}
            <span className="font-bold text-sm text-gray-800">Broadcast Lists</span>
            {savedLists.length > 0 && (
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                {savedLists.length}
              </span>
            )}
          </div>
          <ChevronDown size={18} className={cn("text-gray-400 transition-transform", showBroadcastLists && "rotate-180")} />
        </button>

        <AnimatePresence>
          {showBroadcastLists && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2">
                {savedLists.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3 italic">No saved lists yet. Select contacts and save as a list.</p>
                ) : (
                  savedLists.map((list, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                      <button 
                        onClick={() => loadList(list.ids)}
                        className="flex-1 text-left"
                      >
                        <p className="text-sm font-bold text-gray-800">{list.name}</p>
                        <p className="text-[10px] text-gray-400">{list.ids.length} contacts</p>
                      </button>
                      <button onClick={() => deleteList(i)} className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Save as list */}
      {selected.length > 0 && (
        <div className="bg-green-50 rounded-2xl border border-green-100 p-3 flex items-center gap-2">
          {showSaveList ? (
            <>
              <input 
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name..."
                className="flex-1 text-sm bg-white px-3 py-2 rounded-xl border border-green-200 outline-none focus:ring-1 focus:ring-green-300"
                autoFocus
              />
              <button onClick={saveCurrentAsList} className="px-3 py-2 bg-green-600 text-white text-xs font-bold rounded-xl">Save</button>
              <button onClick={() => setShowSaveList(false)} className="p-2 text-gray-400"><X size={14} /></button>
            </>
          ) : (
            <button onClick={() => setShowSaveList(true)} className="text-xs font-bold text-green-700 flex items-center gap-1">
              <Download size={14} />
              Save as Broadcast List
            </button>
          )}
        </div>
      )}

      {/* Contact Selection */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input 
          type="text" 
          placeholder="Search contacts..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-100 focus:outline-none transition-all outline-none text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <button onClick={selectAll} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors">
          Select All ({filtered.length})
        </button>
        <button onClick={clearSelection} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors">
          Clear
        </button>
      </div>

      <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
        {filtered.map(customer => (
          <button
            key={customer.id}
            onClick={() => toggleCustomer(customer.id)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
              selected.includes(customer.id)
                ? "bg-green-50 border-green-200"
                : "bg-white border-gray-100 hover:border-green-100"
            )}
          >
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
              selected.includes(customer.id) ? "bg-green-500 border-green-500" : "border-gray-300"
            )}>
              {selected.includes(customer.id) && <Check size={12} className="text-white" strokeWidth={3} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-900 truncate">{customer.name}</p>
              <p className="text-[10px] text-gray-400">{customer.phone}</p>
            </div>
            {selected.includes(customer.id) && (
              <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                {selected.indexOf(customer.id) + 1}
              </span>
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-8 text-gray-400 text-sm italic">No contacts found</p>
        )}
      </div>

      {/* Start Broadcast Button */}
      <button 
        onClick={startBroadcast}
        disabled={selected.length === 0 || !message.trim()}
        className={cn(
          "w-full py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 shadow-lg transition-all active:scale-[0.98]",
          selected.length > 0 && message.trim()
            ? "bg-[#25D366] text-white shadow-green-200 hover:bg-[#20BD5A]"
            : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
        )}
      >
        {WHATSAPP_SVG}
        <span>Start Broadcast to {selected.length} Contact{selected.length !== 1 ? 's' : ''}</span>
        <ExternalLink size={16} />
      </button>
    </div>
  );
}

/* ─── Birthday Tab ─── */
function BirthdayTab({ bdays, purchases }: { bdays: Customer[]; purchases: Purchase[] }) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-gray-700 flex items-center">
        <Gift size={18} className="mr-2 text-pink-500" />
        Birthdays Today
      </h3>
      {bdays.length > 0 ? (
        <div className="space-y-3">
          {bdays.map(c => (
            <BirthdayCard 
              key={c.id} 
              customer={c} 
              purchases={purchases.filter(p => p.customerId === c.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Gift className="text-pink-300" size={28} />
          </div>
          <p className="text-gray-400 font-medium text-sm">No birthdays today</p>
          <p className="text-gray-300 text-xs mt-1">Check back tomorrow!</p>
        </div>
      )}
    </div>
  );
}

function BirthdayCard({ customer, purchases }: { customer: Customer; purchases: Purchase[]; key?: React.Key }) {
  const settings = storage.getSettings();
  const defaultMessage = `Happy Birthday ${customer.name}! 🎉✨ Celebrating you today at ${settings.shopName}. Hope you have a stylish day!`;
  const [message, setMessage] = useState(defaultMessage);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sent, setSent] = useState(false);
  const [aiOptions, setAiOptions] = useState({ tone: 'enthusiastic' as const, length: 'medium' as const, keywords: '' });

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    try {
      const msg = await generatePersonalizedMessage(customer, 'birthday', purchases, aiOptions);
      setMessage(msg);
      setIsEditing(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-3 shadow-sm">
      {/* Customer Header - Bold name with Meraki */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-900 text-lg">{customer.name}</p>
          <p className="text-xs text-pink-500 font-bold tracking-wide">
            🎂 Birthday at <span className="font-extrabold">{settings.shopName}</span>
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "p-2 rounded-xl transition-all",
              isEditing ? "bg-pink-600 text-white" : "text-gray-400 hover:bg-pink-50 hover:text-pink-600"
            )}
            title="Edit message"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={handleAIGenerate}
            disabled={isGenerating}
            className={cn(
              "p-2 rounded-xl transition-all",
              isGenerating ? "bg-yellow-100 text-yellow-600" : "text-yellow-500 hover:bg-yellow-50"
            )}
            title="AI Generate"
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          </button>
        </div>
      </div>

      {/* AI Options (when generating) */}
      {isGenerating && (
        <div className="bg-yellow-50 rounded-xl p-3 space-y-2 border border-yellow-100">
          <div className="grid grid-cols-2 gap-2">
            <select 
              value={aiOptions.tone}
              onChange={(e) => setAiOptions({...aiOptions, tone: e.target.value as any})}
              className="bg-white border-none rounded-lg text-[10px] py-1.5 px-2 focus:ring-1 focus:ring-yellow-200"
            >
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
              <option value="enthusiastic">Enthusiastic</option>
            </select>
            <select 
              value={aiOptions.length}
              onChange={(e) => setAiOptions({...aiOptions, length: e.target.value as any})}
              className="bg-white border-none rounded-lg text-[10px] py-1.5 px-2 focus:ring-1 focus:ring-yellow-200"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>
          <input 
            type="text"
            placeholder="Keywords (e.g. special discount, gift)..."
            value={aiOptions.keywords}
            onChange={(e) => setAiOptions({...aiOptions, keywords: e.target.value})}
            className="w-full bg-white border-none rounded-lg text-[10px] py-1.5 px-2 focus:ring-1 focus:ring-yellow-200 outline-none"
          />
        </div>
      )}

      {/* Message Display / Edit */}
      {isEditing ? (
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full text-sm bg-pink-50/50 p-3 rounded-xl border border-pink-100 text-gray-700 h-24 focus:ring-2 focus:ring-pink-200 focus:outline-none transition-all outline-none resize-none"
          autoFocus
        />
      ) : (
        <div className="bg-pink-50/50 p-3 rounded-xl border border-pink-50 text-sm leading-relaxed text-gray-700">
          {/* Bold name, shop, and offer in the message */}
          <span dangerouslySetInnerHTML={{ __html: highlightBirthdayMessage(message, customer.name, settings.shopName) }} />
        </div>
      )}

      {/* Send Button */}
      <a
        href={getWhatsAppAppLink(customer.phone, message)}
        target="_blank"
        rel="no-referrer"
        onClick={() => setSent(true)}
        className={cn(
          "w-full flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-bold transition-all",
          sent ? "bg-green-50 text-green-600 border border-green-100" : "bg-[#25D366] text-white shadow-lg shadow-green-100 active:scale-95"
        )}
      >
        {sent ? (
          <><Check size={16} /><span>Sent!</span></>
        ) : (
          <>{WHATSAPP_SVG}<span>Send Birthday Wish</span></>
        )}
      </a>
    </div>
  );
}

function highlightBirthdayMessage(message: string, name: string, shopName: string): string {
  let result = message;
  // Bold customer name
  result = result.replace(new RegExp(`(${escapeRegex(name)})`, 'gi'), '<strong class="text-gray-900">$1</strong>');
  // Bold shop name
  result = result.replace(new RegExp(`(${escapeRegex(shopName)})`, 'gi'), '<strong class="text-pink-600">$1</strong>');
  // Bold common offer words
  result = result.replace(/(\d+%\s*off|special\s+(?:offer|discount|treat|gift)|exclusive|free|save|code[:\s]*\S+)/gi, '<strong class="text-orange-600">$1</strong>');
  return result;
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ─── Follow-up Tab ─── */
function FollowUpTab({ lapsed, purchases }: { lapsed: Customer[]; purchases: Purchase[] }) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-gray-700 flex items-center">
        <Clock size={18} className="mr-2 text-pink-400" />
        Style Follow-up (30+ days)
      </h3>
      {lapsed.length > 0 ? (
        <div className="space-y-2">
          {lapsed.map(c => (
            <OutreachCard 
              key={c.id} 
              customer={c} 
              purchases={purchases.filter(p => p.customerId === c.id)}
              message={`Hi ${c.name}, your style speaks but we haven't heard from you lately! 👗 We've got new seasonal arrivals at Meraki you'll love.`} 
              type="followup"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check className="text-green-400" size={28} />
          </div>
          <p className="text-gray-400 font-medium text-sm">All customers are active!</p>
        </div>
      )}
    </div>
  );
}

/* ─── Google Sheets Tab ─── */
function SheetsTab() {
  const [exporting, setExporting] = useState(false);

  const exportToCSV = () => {
    setExporting(true);
    const customers = storage.getCustomers();
    const purchases = storage.getPurchases();

    const rows = [['Customer Name', 'Phone Number', 'Birthday', 'Recent Sales Count', 'Total Amount (₹)', 'Last Sale Date', 'Notes']];

    customers.forEach(c => {
      const custPurchases = purchases.filter(p => p.customerId === c.id);
      const totalAmount = custPurchases.reduce((sum, p) => sum + p.amount, 0);
      const lastSale = custPurchases.length > 0 
        ? format(new Date(Math.max(...custPurchases.map(p => p.date))), 'yyyy-MM-dd')
        : 'No sales';
      rows.push([
        c.name,
        c.phone,
        c.birthday || 'Not set',
        custPurchases.length.toString(),
        totalAmount.toString(),
        lastSale,
        c.notes || ''
      ]);
    });

    const csv = rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meraki_customers_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setTimeout(() => setExporting(false), 1000);
  };

  const openGoogleSheet = () => {
    // Create a Google Sheet with pre-filled headers via URL
    const headers = ['Customer Name', 'Phone Number', 'Birthday', 'Recent Sales', 'Amount (₹)'];
    const customers = storage.getCustomers();
    const purchases = storage.getPurchases();

    // Build rows for copy-paste
    let sheetData = headers.join('\t') + '\n';
    customers.forEach(c => {
      const custPurchases = purchases.filter(p => p.customerId === c.id);
      const totalAmount = custPurchases.reduce((sum, p) => sum + p.amount, 0);
      sheetData += [c.name, c.phone, c.birthday || '', custPurchases.length.toString(), totalAmount.toString()].join('\t') + '\n';
    });

    // Copy to clipboard for easy paste into Google Sheets
    navigator.clipboard.writeText(sheetData).then(() => {
      // Then open Google Sheets
      window.open('https://sheets.google.com/create', '_blank');
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <FileSpreadsheet size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Google Sheets Export</h3>
            <p className="text-xs text-gray-400">Export customer data to Google Sheets</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Columns included:</p>
          <div className="flex flex-wrap gap-1.5">
            {['Customer Name', 'Phone Number', 'Birthday', 'Recent Sales', 'Amount'].map(col => (
              <span key={col} className="text-[10px] bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded-lg font-medium">
                {col}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button 
            onClick={openGoogleSheet}
            className="w-full py-3.5 bg-white border-2 border-green-200 text-green-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-50 transition-colors active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#25D366" strokeWidth="2"/>
              <line x1="3" y1="9" x2="21" y2="9" stroke="#25D366" strokeWidth="1.5"/>
              <line x1="3" y1="15" x2="21" y2="15" stroke="#25D366" strokeWidth="1.5"/>
              <line x1="9" y1="3" x2="9" y2="21" stroke="#25D366" strokeWidth="1.5"/>
              <line x1="15" y1="3" x2="15" y2="21" stroke="#25D366" strokeWidth="1.5"/>
            </svg>
            Open Google Sheet & Paste Data
          </button>
          
          <button 
            onClick={exportToCSV}
            disabled={exporting}
            className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors active:scale-[0.98] disabled:opacity-50"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {exporting ? 'Exporting...' : 'Download as CSV'}
          </button>
        </div>

        <p className="text-[10px] text-gray-400 text-center leading-relaxed">
          "Open Google Sheet" copies data to clipboard and opens a new sheet — just paste (Ctrl+V) to import.
        </p>
      </div>
    </div>
  );
}

/* ─── Bulk Sender Modal ─── */
interface BulkQueue {
  active: boolean;
  customers: Customer[];
  currentIndex: number;
  message: string;
  isPaused: boolean;
}

function BulkSenderModal({ queue, onClose, onUpdate }: { 
  queue: BulkQueue; 
  onClose: () => void;
  onUpdate: (q: BulkQueue) => void;
}) {
  const [countdown, setCountdown] = useState(0);
  const currentCustomer = queue.customers[queue.currentIndex];
  const progress = ((queue.currentIndex) / queue.customers.length) * 100;

  useEffect(() => {
    let timer: any;
    if (queue.active && !queue.isPaused && queue.currentIndex < queue.customers.length) {
      if (!currentCustomer?.phone || currentCustomer.phone.trim().length < 8) {
        onUpdate({ ...queue, currentIndex: queue.currentIndex + 1 });
        setCountdown(1);
        return;
      }

      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      } else {
        const link = getWhatsAppAppLink(currentCustomer.phone, queue.message);
        window.open(link, '_blank');
        
        if (queue.currentIndex < queue.customers.length - 1) {
          onUpdate({ ...queue, currentIndex: queue.currentIndex + 1 });
          setCountdown(4);
        } else {
          onUpdate({ ...queue, currentIndex: queue.currentIndex + 1, isPaused: true });
        }
      }
    }
    return () => clearTimeout(timer);
  }, [queue, countdown, currentCustomer]);

  const handleSkip = () => {
    if (queue.currentIndex < queue.customers.length) {
      onUpdate({ ...queue, currentIndex: queue.currentIndex + 1 });
      setCountdown(queue.currentIndex < queue.customers.length - 1 ? 4 : 0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl"
      >
        <div className="p-8 space-y-6 text-center">
          <div className="relative w-24 h-24 mx-auto">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
              <circle
                cx="48" cy="48" r="40"
                stroke="currentColor" strokeWidth="8" fill="transparent"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * progress) / 100}
                className="text-[#25D366] transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-[#25D366]">{Math.round(progress)}%</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              {WHATSAPP_SVG}
              <h3 className="text-xl font-bold text-gray-900">WhatsApp Broadcast</h3>
            </div>
            <p className="text-sm text-gray-500">
              {queue.currentIndex < queue.customers.length 
                ? `Sending to: ${currentCustomer.name}` 
                : 'All messages sent!'}
            </p>
          </div>

          {queue.currentIndex < queue.customers.length && (
            <div className="bg-green-50 py-3 px-4 rounded-2xl flex items-center justify-center space-x-2">
              {countdown > 0 ? (
                <>
                  <Clock size={18} className="text-green-600 animate-pulse" />
                  <span className="font-bold text-green-700">Next in {countdown}s...</span>
                </>
              ) : (
                <span className="font-bold text-green-700">Opening WhatsApp...</span>
              )}
            </div>
          )}

          <div className="flex flex-col space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => onUpdate({ ...queue, isPaused: !queue.isPaused })}
                className={cn(
                  "py-4 rounded-2xl font-bold transition-all active:scale-95 text-sm",
                  queue.isPaused ? "bg-[#25D366] text-white shadow-lg shadow-green-100" : "bg-gray-100 text-gray-600"
                )}
              >
                {queue.isPaused ? 'Resume' : 'Pause'}
              </button>
              <button 
                onClick={handleSkip}
                disabled={queue.currentIndex >= queue.customers.length}
                className="py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold text-sm hover:text-green-500 transition-colors disabled:opacity-30"
              >
                Skip
              </button>
            </div>
            <button 
              onClick={onClose}
              className="w-full py-4 text-gray-400 font-bold hover:text-red-500 transition-colors"
            >
              Stop Broadcast
            </button>
          </div>

          <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">
            Allow pop-ups for automated WhatsApp tab opening
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Outreach Card (for follow-up) ─── */
function OutreachCard({ customer, message, type, purchases }: { customer: Customer; message: string; type: 'birthday' | 'followup' | 'offer'; purchases: Purchase[]; key?: React.Key }) {
  const [sent, setSent] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(message);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRefine, setShowRefine] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [aiOptions, setAiOptions] = useState<{ tone: 'casual' | 'formal' | 'enthusiastic'; length: 'short' | 'medium' | 'long'; keywords: string }>({
    tone: 'casual', length: 'medium', keywords: ''
  });

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const msg = await generatePersonalizedMessage(customer, type, purchases, aiOptions);
      setCurrentMessage(msg);
      setShowRefine(false);
      setIsEditing(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-900">{customer.name}</p>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{type}</p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={cn("p-2 rounded-xl transition-all", isEditing ? "bg-pink-600 text-white" : "text-gray-400 hover:bg-pink-50")}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setShowRefine(!showRefine)}
            className={cn("p-2 rounded-xl transition-all", showRefine ? "bg-pink-600 text-white" : "text-pink-600 hover:bg-pink-50")}
          >
            <Sparkles size={14} />
          </button>
        </div>
      </div>

      {showRefine && (
        <div className="p-3 bg-pink-50/50 rounded-xl space-y-3 border border-pink-50">
          <div className="grid grid-cols-2 gap-2">
            <select value={aiOptions.tone} onChange={(e) => setAiOptions({...aiOptions, tone: e.target.value as any})} className="bg-white border-none rounded-lg text-[10px] py-1.5 px-2 focus:ring-1 focus:ring-pink-100 outline-none">
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
              <option value="enthusiastic">Enthusiastic</option>
            </select>
            <select value={aiOptions.length} onChange={(e) => setAiOptions({...aiOptions, length: e.target.value as any})} className="bg-white border-none rounded-lg text-[10px] py-1.5 px-2 focus:ring-1 focus:ring-pink-100 outline-none">
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>
          <input type="text" placeholder="Add keywords (optional)..." value={aiOptions.keywords} onChange={(e) => setAiOptions({...aiOptions, keywords: e.target.value})} className="w-full bg-white border-none rounded-lg text-[10px] py-1.5 px-2 focus:ring-1 focus:ring-pink-100 outline-none" />
          <button onClick={handleGenerateAI} disabled={isGenerating} className="w-full py-2 bg-pink-600 text-white text-[10px] font-bold rounded-lg flex items-center justify-center space-x-2">
            {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <span>Apply AI Magic</span>}
          </button>
        </div>
      )}

      {isEditing ? (
        <textarea
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          className="w-full text-sm bg-gray-50 p-3 rounded-xl border border-gray-100 text-gray-700 h-20 focus:ring-2 focus:ring-pink-100 focus:outline-none transition-all outline-none resize-none"
          autoFocus
        />
      ) : (
        <div className="bg-gray-50/50 p-3 rounded-xl text-sm text-gray-700 border border-gray-50 line-clamp-3 italic">
          "{currentMessage}"
        </div>
      )}

      <a
        href={getWhatsAppAppLink(customer.phone, currentMessage)}
        target="_blank"
        rel="no-referrer"
        onClick={() => setSent(true)}
        className={cn(
          "w-full flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-bold transition-all",
          sent ? "bg-green-50 text-green-600 border border-green-100" : "bg-[#25D366] text-white shadow-lg shadow-green-100 active:scale-95"
        )}
      >
        {sent ? <><Check size={16} /><span>Sent</span></> : <>{WHATSAPP_SVG}<span>Send via WhatsApp</span></>}
      </a>
    </div>
  );
}
