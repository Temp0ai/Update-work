import React, { useState, useEffect } from 'react';
import { Plus, Search, UserPlus, Phone, Mail, Calendar, Users, Trash2, Check } from 'lucide-react';
import { storage } from '../services/storage';
import { Customer } from '../types';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { cn, generateId } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    birthday: '',
    notes: ''
  });

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setCustomers(storage.getCustomers());
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newCustomer: Customer = {
      ...formData,
      id: generateId(),
      createdAt: Date.now()
    };
    storage.saveCustomer(newCustomer);
    setCustomers(prev => [...prev, newCustomer]);
    setFormData({ name: '', phone: '', birthday: '', notes: '' });
    setShowAddForm(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const executeSingleDelete = (id: string) => {
    storage.deleteCustomer(id);
    setCustomers(prev => prev.filter(c => c.id !== id));
    setSelectedIds(prev => prev.filter(i => i !== id));
    setConfirmDeleteId(null);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmDelete(false);
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    
    setIsDeleting(true);
    storage.deleteCustomersBulk(selectedIds);
    
    const remaining = storage.getCustomers();
    setCustomers(remaining);
    setSelectedIds([]);
    setIsDeleteMode(false);
    setIsDeleting(false);
    setConfirmDelete(false);
    
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Customers</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => {
              setIsDeleteMode(!isDeleteMode);
              if (isDeleteMode) {
                setSelectedIds([]);
                setConfirmDelete(false);
              }
            }}
            className={cn(
              "p-2 rounded-full transition-all border",
              isDeleteMode ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-100" : "bg-white border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100"
            )}
            title={isDeleteMode ? "Cancel Delete" : "Delete Customers"}
          >
            <Trash2 size={20} />
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            className="p-2 bg-pink-600 text-white rounded-full shadow-lg shadow-pink-200 hover:bg-pink-700 transition-all"
          >
            <UserPlus size={20} />
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search name or phone..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-pink-100 focus:outline-none transition-all outline-none text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isDeleteMode && selectedIds.length > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          type="button"
          disabled={isDeleting}
          onClick={(e) => {
            e.preventDefault();
            if (!confirmDelete) {
              setConfirmDelete(true);
            } else {
              handleBulkDelete();
            }
          }}
          className={cn(
            "w-full py-4 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98]",
            isDeleting ? "bg-gray-400 text-white cursor-not-allowed" : 
            confirmDelete ? "bg-orange-500 text-white shadow-orange-100 animate-pulse" : "bg-red-600 text-white shadow-red-100 hover:bg-red-700"
          )}
        >
          {isDeleting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : confirmDelete ? (
            <Check size={18} />
          ) : (
            <Trash2 size={16} />
          )}
          <span>
            {isDeleting ? 'Deleting...' : 
             confirmDelete ? `Confirm Delete ${selectedIds.length} names?` : 
             `Delete ${selectedIds.length} Selected`}
          </span>
        </motion.button>
      )}

      {/* Success Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-center space-x-2 z-[60]"
          >
            <Check size={18} className="text-green-400" />
            <span className="font-bold text-sm">Customers deleted successfully</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Delete Customer?</h3>
                <p className="text-sm text-gray-500">This will permanently remove the customer and all related purchase records.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => executeSingleDelete(confirmDeleteId)}
                  className="py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-100 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {filtered.map(customer => (
          <div 
            key={customer.id} 
            onClick={(e) => isDeleteMode ? toggleSelect(e, customer.id) : navigate(`/customers/${customer.id}`)}
            className={cn(
              "p-4 rounded-2xl border transition-all active:scale-[0.98] group relative cursor-pointer",
              selectedIds.includes(customer.id) ? "bg-red-50 border-red-200" : "bg-white border-gray-100 hover:border-pink-100 shadow-sm shadow-gray-100/50"
            )}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                {isDeleteMode ? (
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    selectedIds.includes(customer.id) ? "bg-red-500 border-red-500 shadow-sm" : "bg-white border-gray-300"
                  )}>
                    {selectedIds.includes(customer.id) && <Check size={14} className="text-white" strokeWidth={3} />}
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 font-bold shrink-0">
                    {customer.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900 group-hover:text-pink-600 transition-colors uppercase text-sm tracking-tight">{customer.name}</p>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <Phone size={10} className="text-gray-400" />
                    <p className="text-xs text-gray-400">{customer.phone}</p>
                  </div>
                </div>
              </div>
              
              {!isDeleteMode && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(e, customer.id);
                  }}
                  className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
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
              <Input label="Birthday" value={formData.birthday} onChange={v => setFormData({...formData, birthday: v})} type="date" />
              
              <div className="pt-4">
                <button type="submit" className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold shadow-lg shadow-pink-200 active:scale-95 transition-all outline-none">
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
        className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-pink-200 focus:bg-white rounded-xl transition-all outline-none"
      />
    </div>
  );
}
