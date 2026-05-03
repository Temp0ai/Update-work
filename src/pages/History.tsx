import { useState, useEffect } from 'react';
import { ShoppingBag, Search, IndianRupee, Trash2 } from 'lucide-react';
import { storage } from '../services/storage';
import { Purchase } from '../types';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function History() {
  const [purchases, setPurchases] = useState<(Purchase & { customerName: string })[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const p = storage.getPurchases();
    const c = storage.getCustomers();
    const joined = p.map(purchase => ({
      ...purchase,
      customerName: c.find(cust => cust.id === purchase.customerId)?.name || 'Unknown'
    })).sort((a, b) => b.date - a.date);
    setPurchases(joined);
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this sale record?')) {
      storage.deletePurchase(id);
      setPurchases(prev => prev.filter(p => p.id !== id));
    }
  };

  const filtered = purchases.filter(p => 
    p.customerName.toLowerCase().includes(search.toLowerCase()) ||
    p.notes?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 px-1">Recent Sales</h2>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search by customer or notes..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-pink-100 focus:outline-none transition-all outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filtered.map(purchase => (
          <div 
            key={purchase.id} 
            className="p-4 bg-white rounded-[24px] border border-gray-100 space-y-3 shadow-sm hover:border-pink-100 transition-all group"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
                  <IndianRupee size={20} />
                </div>
                <div>
                  <Link to={`/customers/${purchase.customerId}`} className="font-bold text-gray-900 flex items-center hover:text-pink-600 transition-colors">
                    {purchase.customerName}
                  </Link>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{format(purchase.date, 'MMM dd, yyyy • hh:mm a')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleDelete(purchase.id)}
                  className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </button>
                <p className="text-lg font-bold text-gray-900 tracking-tight">{formatCurrency(purchase.amount)}</p>
              </div>
            </div>
            {purchase.notes && (
              <p className="text-sm text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-50 italic">
                {purchase.notes}
              </p>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-400 font-medium tracking-tight">No sales records found</p>
          </div>
        )}
      </div>
    </div>
  );
}
