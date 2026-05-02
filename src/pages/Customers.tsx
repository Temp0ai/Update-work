import React, { useState, useEffect } from 'react';
import { Plus, Search, UserPlus, Phone, Mail, Calendar, Users } from 'lucide-react';
import { storage } from '../services/storage';
import { Customer } from '../types';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    birthday: '',
    notes: ''
  });

  useEffect(() => {
    setCustomers(storage.getCustomers());
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newCustomer: Customer = {
      ...formData,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
    storage.saveCustomer(newCustomer);
    setCustomers(prev => [...prev, newCustomer]);
    setFormData({ name: '', phone: '', email: '', birthday: '', notes: '' });
    setShowAddForm(false);
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
        <button 
          onClick={() => setShowAddForm(true)}
          className="p-2 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200"
        >
          <UserPlus size={20} />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search name or phone..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filtered.map(customer => (
          <Link 
            key={customer.id} 
            to={`/customers/${customer.id}`}
            className="block p-4 bg-white rounded-2xl border border-gray-100 hover:border-blue-100 transition-all active:scale-[0.98]"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-900">{customer.name}</p>
                <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center"><Phone size={12} className="mr-1" /> {customer.phone}</span>
                  {customer.birthday && (
                    <span className="flex items-center"><Calendar size={12} className="mr-1" /> {customer.birthday}</span>
                  )}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                {customer.name.charAt(0)}
              </div>
            </div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-400 font-medium tracking-tight">No customers found</p>
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Add Customer</h3>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 p-2">✕</button>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <Input label="Full Name" value={formData.name} onChange={v => setFormData({...formData, name: v})} required />
              <Input label="Phone Number" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} required type="tel" />
              <Input label="Email" value={formData.email} onChange={v => setFormData({...formData, email: v})} type="email" />
              <Input label="Birthday" value={formData.birthday} onChange={v => setFormData({...formData, birthday: v})} type="date" />
              
              <div className="pt-4">
                <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all">
                  Create Customer
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</label>
      <input 
        type={type} 
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-blue-200 focus:bg-white rounded-xl transition-all outline-none"
      />
    </div>
  );
}
