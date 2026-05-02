import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, Mail, Calendar, MessageSquare, Plus, ArrowLeft, Trash2, ShoppingBag, Send, Sparkles, Loader2 } from 'lucide-react';
import { storage } from '../services/storage';
import { Customer, Purchase } from '../types';
import { formatCurrency, getWhatsAppLink, cn } from '../lib/utils';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { generatePersonalizedMessage } from '../services/ai';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [newPurchase, setNewPurchase] = useState({ amount: '', notes: '' });
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiOptions, setAiOptions] = useState<{
    tone: 'casual' | 'formal' | 'enthusiastic';
    length: 'short' | 'medium' | 'long';
    keywords: string;
  }>({
    tone: 'casual',
    length: 'medium',
    keywords: ''
  });

  useEffect(() => {
    if (!id) return;
    const c = storage.getCustomers().find(c => c.id === id);
    if (!c) {
      navigate('/customers');
      return;
    }
    setCustomer(c);
    setPurchases(storage.getPurchases().filter(p => p.customerId === id).sort((a, b) => b.date - a.date));
  }, [id, navigate]);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      storage.deleteCustomer(id!);
      navigate('/customers');
    }
  };

  const handleAddPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const purchase: Purchase = {
      id: crypto.randomUUID(),
      customerId: id!,
      amount: parseFloat(newPurchase.amount),
      date: Date.now(),
      items: [],
      notes: newPurchase.notes
    };
    storage.savePurchase(purchase);
    setPurchases(prev => [purchase, ...prev]);
    setNewPurchase({ amount: '', notes: '' });
    setShowAddPurchase(false);
  };

  const handleGenerateAI = async (type: 'birthday' | 'followup' | 'offer') => {
    if (!customer) return;
    setIsGenerating(true);
    try {
      const msg = await generatePersonalizedMessage(customer, type, purchases, aiOptions);
      setAiMessage(msg);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!customer) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleDelete}
            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <Trash2 size={20} />
          </button>
          <a
            href={getWhatsAppLink(customer.phone, aiMessage || `Hello ${customer.name}, just checking in!`)}
            target="_blank"
            rel="no-referrer"
            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-lg shadow-green-100"
          >
            <Send size={20} />
          </a>
        </div>
      </div>

      <header className="text-center space-y-2">
        <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-3xl font-bold mx-auto shadow-xl shadow-blue-100 mb-4">
          {customer.name.charAt(0)}
        </div>
        <h2 className="text-2xl font-bold tracking-tight">{customer.name}</h2>
        <div className="flex flex-col items-center space-y-1 text-sm text-gray-500">
          <span className="flex items-center"><Phone size={14} className="mr-2" /> {customer.phone}</span>
          {customer.email && <span className="flex items-center"><Mail size={14} className="mr-2" /> {customer.email}</span>}
          {customer.birthday && <span className="flex items-center"><Calendar size={14} className="mr-2" /> {customer.birthday}</span>}
        </div>
      </header>

      <section className="bg-white rounded-3xl border border-gray-100 p-6 space-y-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center text-blue-600">
            <Sparkles size={18} className="mr-2" />
            AI Outreach
          </h3>
          {aiMessage && (
            <button 
              onClick={() => setAiMessage(null)}
              className="text-[10px] font-bold text-gray-400 uppercase tracking-widest"
            >
              Clear
            </button>
          )}
        </div>

        {!aiMessage && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Tone</label>
                <select 
                  value={aiOptions.tone}
                  onChange={(e) => setAiOptions({...aiOptions, tone: e.target.value as any})}
                  className="w-full bg-gray-50 border-none rounded-xl text-xs py-2 px-3 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                  <option value="enthusiastic">Enthusiastic</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Length</label>
                <select 
                  value={aiOptions.length}
                  onChange={(e) => setAiOptions({...aiOptions, length: e.target.value as any})}
                  className="w-full bg-gray-50 border-none rounded-xl text-xs py-2 px-3 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Bonus Keywords (Optional)</label>
              <input 
                type="text"
                placeholder="Sale, coffee, thanks..."
                value={aiOptions.keywords}
                onChange={(e) => setAiOptions({...aiOptions, keywords: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl text-xs py-2.5 px-3 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        )}

        {aiMessage ? (
          <div className="space-y-4">
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-sm leading-relaxed text-gray-800 italic relative group">
              "{aiMessage}"
              <button 
                onClick={() => setAiMessage(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
            <div className="flex space-x-2">
              <a
                href={getWhatsAppLink(customer.phone, aiMessage)}
                target="_blank"
                rel="no-referrer"
                className="flex-1 bg-green-500 text-white py-3.5 rounded-xl font-bold text-sm text-center flex items-center justify-center space-x-2 shadow-lg shadow-green-100"
              >
                <Send size={16} />
                <span>Send WhatsApp</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleGenerateAI('followup')}
              disabled={isGenerating}
              className="flex items-center justify-center space-x-2 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} className="text-blue-500" />}
              <span>Follow-up AI</span>
            </button>
            <button
              onClick={() => handleGenerateAI('offer')}
              disabled={isGenerating}
              className="flex items-center justify-center space-x-2 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-orange-500" />}
              <span>Offer AI</span>
            </button>
          </div>
        )}
      </section>

      <section className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center">
            <ShoppingBag size={18} className="mr-2 text-blue-600" />
            Purchase History
          </h3>
          <button 
            onClick={() => setShowAddPurchase(true)}
            className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full"
          >
            Add New
          </button>
        </div>

        <div className="space-y-3">
          {purchases.map(p => (
            <div key={p.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="font-bold text-gray-800">{formatCurrency(p.amount)}</p>
                <p className="text-xs text-gray-400">{format(p.date, 'MMM dd, yyyy')}</p>
                {p.notes && <p className="text-xs text-gray-500 italic mt-0.5">{p.notes}</p>}
              </div>
            </div>
          ))}
          {purchases.length === 0 && (
            <p className="text-center py-8 text-gray-400 text-sm italic">No purchases recorded yet</p>
          )}
        </div>
      </section>

      {showAddPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Add Purchase</h3>
              <button onClick={() => setShowAddPurchase(false)} className="text-gray-400 p-2">✕</button>
            </div>
            
            <form onSubmit={handleAddPurchase} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    autoFocus
                    value={newPurchase.amount}
                    onChange={e => setNewPurchase({...newPurchase, amount: e.target.value})}
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-transparent focus:border-blue-200 focus:bg-white rounded-xl transition-all outline-none"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Notes (Optional)</label>
                <textarea 
                  value={newPurchase.notes}
                  onChange={e => setNewPurchase({...newPurchase, notes: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-blue-200 focus:bg-white rounded-xl transition-all outline-none h-24 resize-none"
                />
              </div>
              
              <div className="pt-4">
                <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all">
                  Save Purchase
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
