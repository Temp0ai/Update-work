import React, { useState, useEffect } from 'react';
import { Plus, Search, UserPlus, Phone, Users, Trash2, Check, BookUser, Loader2, X, EyeOff, Eye, Filter } from 'lucide-react';
import { storage } from '../services/storage';
import { Customer } from '../types';
import { useNavigate } from 'react-router-dom';
import { cn, generateId } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Contacts } from '@capacitor-community/contacts';

interface PhoneContact {
  contactId: string;
  name: string;
  phone: string;
  selected: boolean;
}

type FilterMode = 'visible' | 'hidden' | 'all';

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('visible');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    birthday: '',
    notes: ''
  });

  // Contact picker state
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [phoneContacts, setPhoneContacts] = useState<PhoneContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    setCustomers(storage.getCustomers());
  }, []);

  // Toggle hide/unhide a customer
  const toggleHide = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    const updated = { ...customer, hidden: !customer.hidden };
    storage.saveCustomer(updated);
    setCustomers(storage.getCustomers());
    setToastMessage(updated.hidden ? 'Hidden from list' : 'Visible in list');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // Open contact picker
  const handleOpenContactPicker = async () => {
    setIsLoadingContacts(true);
    setContactSearch('');
    try {
      const permission = await Contacts.requestPermissions();
      if (permission.contacts !== 'granted') {
        alert('Contact permission is required to select contacts.');
        setIsLoadingContacts(false);
        return;
      }

      const result = await Contacts.getContacts({
        projection: {
          name: true,
          phones: true,
        }
      });

      const existingPhones = new Set(
        storage.getCustomers().map(c => c.phone.replace(/\D/g, '').slice(-10))
      );

      const contacts: PhoneContact[] = [];
      for (const contact of result.contacts) {
        const name = contact.name?.display || '';
        const phone = contact.phones?.[0]?.number || '';
        if (!name || !phone) continue;

        const cleanPhone = phone.replace(/\D/g, '');
        const last10 = cleanPhone.slice(-10);
        if (existingPhones.has(last10)) continue;

        contacts.push({
          contactId: contact.contactId || '',
          name: name.trim(),
          phone: phone.trim(),
          selected: false
        });
      }

      setPhoneContacts(contacts);
      setShowContactPicker(true);
    } catch (error) {
      console.error('Contact fetch error:', error);
      alert('Failed to load contacts. Make sure contact permission is granted.');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const toggleContactSelection = (contactId: string) => {
    setPhoneContacts(prev => prev.map(c =>
      c.contactId === contactId ? { ...c, selected: !c.selected } : c
    ));
  };

  const handleImportSelected = () => {
    const selected = phoneContacts.filter(c => c.selected);
    if (selected.length === 0) return;

    setIsImporting(true);
    const existingPhones = new Set(
      storage.getCustomers().map(c => c.phone.replace(/\D/g, '').slice(-10))
    );

    let imported = 0;
    for (const contact of selected) {
      const cleanPhone = contact.phone.replace(/\D/g, '');
      const last10 = cleanPhone.slice(-10);
      if (existingPhones.has(last10)) continue;

      let formattedPhone = contact.phone;
      if (cleanPhone.length === 10) {
        formattedPhone = `+91${cleanPhone}`;
      }

      const newCustomer: Customer = {
        id: generateId(),
        name: contact.name,
        phone: formattedPhone,
        birthday: '',
        notes: '',
        createdAt: Date.now(),
        source: 'contact',
        hidden: false
      };

      storage.saveCustomer(newCustomer);
      existingPhones.add(last10);
      imported++;
    }

    setCustomers(storage.getCustomers());
    setShowContactPicker(false);
    setPhoneContacts([]);
    setIsImporting(false);

    setToastMessage(`${imported} contact${imported !== 1 ? 's' : ''} added`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const filteredContacts = phoneContacts.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.phone.includes(contactSearch)
  );

  const selectedContactCount = phoneContacts.filter(c => c.selected).length;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newCustomer: Customer = {
      ...formData,
      id: generateId(),
      createdAt: Date.now(),
      source: 'created',
      hidden: false
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

  // Filter customers by visibility + search
  const filtered = customers.filter(c => {
    // Visibility filter
    if (filterMode === 'visible' && c.hidden) return false;
    if (filterMode === 'hidden' && !c.hidden) return false;
    // Search filter
    const matchName = c.name.toLowerCase().includes(search.toLowerCase());
    const matchPhone = c.phone.includes(search);
    return matchName || matchPhone;
  });

  const hiddenCount = customers.filter(c => c.hidden).length;
  const visibleCount = customers.filter(c => !c.hidden).length;

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

      {/* Search */}
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

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setFilterMode('visible')}
          className={cn(
            "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
            filterMode === 'visible' ? "bg-white text-pink-600 shadow-sm" : "text-gray-400"
          )}
        >
          Visible ({visibleCount})
        </button>
        <button
          onClick={() => setFilterMode('hidden')}
          className={cn(
            "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
            filterMode === 'hidden' ? "bg-white text-orange-600 shadow-sm" : "text-gray-400"
          )}
        >
          Hidden ({hiddenCount})
        </button>
        <button
          onClick={() => setFilterMode('all')}
          className={cn(
            "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
            filterMode === 'all' ? "bg-white text-gray-700 shadow-sm" : "text-gray-400"
          )}
        >
          All ({customers.length})
        </button>
      </div>

      {/* Bulk Delete Bar */}
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
            <span className="font-bold text-sm">{toastMessage}</span>
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

      {/* Customer List */}
      <div className="space-y-3">
        {filtered.map(customer => (
          <div
            key={customer.id}
            onClick={(e) => isDeleteMode ? toggleSelect(e, customer.id) : navigate(`/customers/${customer.id}`)}
            className={cn(
              "p-4 rounded-2xl border transition-all active:scale-[0.98] group relative cursor-pointer",
              customer.hidden ? "bg-orange-50/50 border-orange-100" : "",
              selectedIds.includes(customer.id) ? "bg-red-50 border-red-200" : !customer.hidden ? "bg-white border-gray-100 hover:border-pink-100 shadow-sm shadow-gray-100/50" : ""
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
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0",
                    customer.hidden ? "bg-orange-100 text-orange-400" : "bg-pink-50 text-pink-600"
                  )}>
                    {customer.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <p className={cn(
                      "font-bold transition-colors uppercase text-sm tracking-tight",
                      customer.hidden ? "text-gray-400" : "text-gray-900 group-hover:text-pink-600"
                    )}>{customer.name}</p>
                    {customer.source === 'contact' && (
                      <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Contact</span>
                    )}
                    {customer.hidden && (
                      <span className="text-[9px] font-bold text-orange-500 bg-orange-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                        <EyeOff size={8} /> Hidden
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <Phone size={10} className="text-gray-400" />
                    <p className="text-xs text-gray-400">{customer.phone}</p>
                  </div>
                </div>
              </div>

              {!isDeleteMode && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => toggleHide(e, customer.id)}
                    className={cn(
                      "p-2.5 rounded-xl transition-all",
                      customer.hidden ? "text-orange-400 hover:text-orange-600 hover:bg-orange-50" : "text-gray-300 hover:text-gray-500 hover:bg-gray-50"
                    )}
                    title={customer.hidden ? "Show in list" : "Hide from list"}
                  >
                    {customer.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(e, customer.id);
                    }}
                    className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              {filterMode === 'hidden' ? <EyeOff className="text-gray-300" size={32} /> : <Users className="text-gray-300" size={32} />}
            </div>
            <p className="text-gray-400 font-medium tracking-tight">
              {filterMode === 'hidden' ? 'No hidden customers' : 'No customers found'}
            </p>
            <p className="text-gray-300 text-xs mt-1">
              {filterMode === 'hidden' ? 'Hide contacts using the eye icon' : 'Create one or select from contacts'}
            </p>
          </div>
        )}
      </div>

      {/* Add Customer Form */}
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

            {/* Select from Contacts Button */}
            <button
              type="button"
              onClick={() => { setShowAddForm(false); handleOpenContactPicker(); }}
              className="w-full mb-4 py-3.5 bg-blue-50 text-blue-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border border-blue-200 hover:bg-blue-100 transition-all active:scale-[0.98]"
            >
              <BookUser size={18} />
              Select from Contacts
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">or create manually</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <Input label="Full Name" value={formData.name} onChange={v => setFormData({...formData, name: v})} required />
              <Input label="Phone Number" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} required type="tel" />
              <Input label="Birthday" value={formData.birthday} onChange={v => setFormData({...formData, birthday: v})} type="date" />
              <div className="pt-2">
                <button type="submit" className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold shadow-lg shadow-pink-200 active:scale-95 transition-all outline-none">
                  Create Customer
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Contact Picker Modal */}
      <AnimatePresence>
        {showContactPicker && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-lg font-bold">Select Contacts</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {filteredContacts.length} available
                    {selectedContactCount > 0 && ` · ${selectedContactCount} selected`}
                  </p>
                </div>
                <button
                  onClick={() => { setShowContactPicker(false); setPhoneContacts([]); }}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="p-3 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-pink-100 focus:outline-none text-sm"
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3">
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Users size={32} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No contacts available</p>
                    <p className="text-xs text-gray-300 mt-1">All contacts may already be in your list</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredContacts.map(contact => (
                      <button
                        key={contact.contactId}
                        onClick={() => toggleContactSelection(contact.contactId)}
                        className={cn(
                          "w-full flex items-center space-x-3 p-3 rounded-xl transition-all text-left",
                          contact.selected ? "bg-pink-50 border border-pink-200" : "hover:bg-gray-50 border border-transparent"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                          contact.selected ? "bg-pink-500 border-pink-500" : "border-gray-300"
                        )}>
                          {contact.selected && <Check size={14} className="text-white" strokeWidth={3} />}
                        </div>
                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                          {contact.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-gray-900 truncate">{contact.name}</p>
                          <p className="text-xs text-gray-400">{contact.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedContactCount > 0 && (
                <div className="p-4 border-t border-gray-100 shrink-0">
                  <button
                    onClick={handleImportSelected}
                    disabled={isImporting}
                    className="w-full py-3.5 bg-pink-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-pink-200 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
                  >
                    {isImporting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <UserPlus size={18} />
                    )}
                    <span>{isImporting ? 'Adding...' : `Add ${selectedContactCount} Contact${selectedContactCount !== 1 ? 's' : ''}`}</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
