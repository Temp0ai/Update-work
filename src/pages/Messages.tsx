import { useState, useEffect } from 'react';
import { MessageCircle, Gift, Clock, Sparkles, Send, Check, Loader2 } from 'lucide-react';
import { storage } from '../services/storage';
import { Customer, Purchase } from '../types';
import { getWhatsAppLink, getWhatsAppAppLink, cn } from '../lib/utils';
import { format, subDays, getMonth, getDate } from 'date-fns';
import { motion } from 'motion/react';
import { generatePersonalizedMessage } from '../services/ai';

export default function Messages() {
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

    // Birthdays today
    const currentBdays = customers.filter(c => {
      if (!c.birthday) return false;
      const bday = new Date(c.birthday);
      return getMonth(bday) === getMonth(now) && getDate(bday) === getDate(now);
    });
    setBdays(currentBdays);
    setPurchases(purchases);

    // Lapsed customers (no purchase in 30 days)
    const thirtyDaysAgo = subDays(now, 30).getTime();
    const lapsedCustomers = customers.filter(c => {
      const customerPurchases = purchases.filter(p => p.customerId === c.id);
      if (customerPurchases.length === 0) return true; // Never bought
      const lastPurchase = Math.max(...customerPurchases.map(p => p.date));
      return lastPurchase < thirtyDaysAgo;
    });
    setLapsed(lapsedCustomers);
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight">Outreach Center</h2>
        <p className="text-sm text-gray-500">Engage Meraki customers with fashion updates.</p>
      </header>

      <section className="space-y-3">
        <h3 className="font-bold text-gray-700 flex items-center">
          <Gift size={18} className="mr-2 text-pink-500" />
          Birthdays Today
        </h3>
        {bdays.length > 0 ? (
          <div className="space-y-2">
            {bdays.map(c => (
              <OutreachCard 
                key={c.id} 
                customer={c} 
                purchases={purchases.filter(p => p.customerId === c.id)}
                message={`Happy Birthday ${c.name}! 🎉 ✨ Celebrating you today at Meraki. Hope you have a stylish day!`} 
                type="birthday"
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic py-2">No birthdays today.</p>
        )}
      </section>

      <section className="space-y-3">
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
          <p className="text-sm text-gray-400 italic py-2">All customers are active!</p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-bold text-gray-700 flex items-center">
           <Sparkles size={18} className="mr-2 text-pink-500" />
           Send Special Offer
        </h3>
        <p className="text-xs text-gray-400 mb-2">Broadcast a promotion to all Meraki customers.</p>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-4">
           <div className="relative">
             <textarea 
               className="w-full text-sm bg-gray-50 p-3 rounded-xl border border-gray-50 text-gray-600 h-24 focus:ring-2 focus:ring-pink-100 focus:outline-none transition-all outline-none"
               defaultValue="Exclusive Boutique Offer! 👗 Enjoy a special treat on your next visit to Meraki. Use code: MERAKI10. Valid this week!"
               id="bulk-template"
             />
           </div>
           <button 
             className="w-full py-4 bg-pink-600 text-white rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-pink-100 active:scale-95 transition-all"
             onClick={() => {
               const text = (document.getElementById('bulk-template') as HTMLTextAreaElement).value;
               setBulkQueue({
                 active: true,
                 customers: storage.getCustomers(),
                 currentIndex: 0,
                 message: text,
                 isPaused: false
               });
             }}
            >
             <MessageCircle size={18} />
             <span>Start Broadcast (4s Interval)</span>
           </button>
        </div>
      </section>

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
      // Basic validation to skip invalid/empty numbers
      if (!currentCustomer?.phone || currentCustomer.phone.trim().length < 8) {
        onUpdate({ ...queue, currentIndex: queue.currentIndex + 1 });
        setCountdown(1);
        return;
      }

      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      } else {
        // Time to send!
        // We use the app link protocol for better Android support
        const link = getWhatsAppAppLink(currentCustomer.phone, queue.message);
        
        // On some mobile devices window.open works, on others we might need window.location
        // We try window.open first as it's less disruptive.
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
              <circle
                cx="48" cy="48" r="40"
                stroke="currentColor" strokeWidth="8" fill="transparent"
                className="text-gray-100"
              />
              <circle
                cx="48" cy="48" r="40"
                stroke="currentColor" strokeWidth="8" fill="transparent"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * progress) / 100}
                className="text-pink-600 transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-pink-600">{Math.round(progress)}%</span>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-gray-900">Meraki Broadcast</h3>
            <p className="text-sm text-gray-500">
              {queue.currentIndex < queue.customers.length 
                ? `Styling: ${currentCustomer.name}` 
                : 'All styling updates sent!'}
            </p>
          </div>

          {queue.currentIndex < queue.customers.length && (
            <div className="bg-pink-50 py-3 px-4 rounded-2xl flex items-center justify-center space-x-2">
              {countdown > 0 ? (
                <>
                  <Clock size={18} className="text-pink-600 animate-pulse" />
                  <span className="font-bold text-pink-700">Next in {countdown}s...</span>
                </>
              ) : (
                <span className="font-bold text-pink-700">Opening WhatsApp...</span>
              )}
            </div>
          )}

          <div className="flex flex-col space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => onUpdate({ ...queue, isPaused: !queue.isPaused })}
                className={cn(
                  "py-4 rounded-2xl font-bold transition-all active:scale-95 text-sm",
                  queue.isPaused ? "bg-pink-600 text-white shadow-lg shadow-pink-100" : "bg-gray-100 text-gray-600"
                )}
              >
                {queue.isPaused ? 'Resume' : 'Pause'}
              </button>
              <button 
                onClick={handleSkip}
                disabled={queue.currentIndex >= queue.customers.length}
                className="py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold text-sm hover:text-pink-500 transition-colors disabled:opacity-30"
              >
                Skip Number
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
            Note: Your browser might require you to allow pop-ups for automated tab opening.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function OutreachCard({ customer, message, type, purchases }: { customer: Customer; message: string; type: 'birthday' | 'followup' | 'offer'; purchases: Purchase[]; key?: string }) {
  const [sent, setSent] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(message);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRefine, setShowRefine] = useState(false);
  const [aiOptions, setAiOptions] = useState<{
    tone: 'casual' | 'formal' | 'enthusiastic';
    length: 'short' | 'medium' | 'long';
    keywords: string;
  }>({
    tone: 'casual',
    length: 'medium',
    keywords: ''
  });

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const msg = await generatePersonalizedMessage(customer, type, purchases, aiOptions);
      setCurrentMessage(msg);
      setShowRefine(false);
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
        <button
          onClick={() => setShowRefine(!showRefine)}
          className={cn(
            "p-2 rounded-xl transition-all",
            showRefine ? "bg-pink-600 text-white" : "text-pink-600 hover:bg-pink-50"
          )}
          title="Personalize with AI"
        >
          <Sparkles size={16} />
        </button>
      </div>

      {showRefine && (
        <div className="p-3 bg-pink-50/50 rounded-xl space-y-3 border border-pink-50">
          <div className="grid grid-cols-2 gap-2">
            <select 
              value={aiOptions.tone}
              onChange={(e) => setAiOptions({...aiOptions, tone: e.target.value as any})}
              className="bg-white border-none rounded-lg text-[10px] py-1.5 px-2 focus:ring-1 focus:ring-pink-100 outline-none"
            >
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
              <option value="enthusiastic">Enthusiastic</option>
            </select>
            <select 
              value={aiOptions.length}
              onChange={(e) => setAiOptions({...aiOptions, length: e.target.value as any})}
              className="bg-white border-none rounded-lg text-[10px] py-1.5 px-2 focus:ring-1 focus:ring-pink-100 outline-none"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>
          <input 
            type="text"
            placeholder="Add keywords (optional)..."
            value={aiOptions.keywords}
            onChange={(e) => setAiOptions({...aiOptions, keywords: e.target.value})}
            className="w-full bg-white border-none rounded-lg text-[10px] py-1.5 px-2 focus:ring-1 focus:ring-pink-100 outline-none"
          />
          <button
            onClick={handleGenerateAI}
            disabled={isGenerating}
            className="w-full py-2 bg-pink-600 text-white text-[10px] font-bold rounded-lg flex items-center justify-center space-x-2"
          >
            {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <span>Apply AI Magic</span>}
          </button>
        </div>
      )}

      <div className="bg-gray-50/50 p-3 rounded-xl text-sm text-gray-700 border border-gray-50 line-clamp-3 italic">
        "{currentMessage}"
      </div>
      
      <a
        href={getWhatsAppAppLink(customer.phone, currentMessage)}
        target="_blank"
        rel="no-referrer"
        onClick={() => setSent(true)}
        className={cn(
          "w-full flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-bold transition-all",
          sent ? "bg-green-50 text-green-600" : "bg-pink-600 text-white shadow-lg shadow-pink-100 active:scale-95"
        )}
      >
        {sent ? (
          <>
            <Check size={16} />
            <span>Sent Successfully</span>
          </>
        ) : (
          <>
            <Send size={16} />
            <span>Send via WhatsApp</span>
          </>
        )}
      </a>
    </div>
  );
}
