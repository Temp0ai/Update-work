import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Gift, Clock, Sparkles, Send, Check, Loader2, Users, Search, ChevronDown, X, Download, ExternalLink, FileSpreadsheet, Pencil, Plus, ArrowLeft, Trash2, Smartphone, Camera, ImageIcon, Paperclip, Tag, ShoppingBag } from 'lucide-react';
import { storage } from '../services/storage';
import { Customer, Purchase } from '../types';
import { getWhatsAppLink, getWhatsAppAppLink, cn, generateId } from '../lib/utils';
import { format, subDays, getMonth, getDate } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { generatePersonalizedMessage } from '../services/ai';
import { Contacts } from '@capacitor-community/contacts';

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
        <h2 className="text-2xl font-bold tracking-tight">WhatsApp</h2>
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
interface ContactGroup {
  id: string;
  name: string;
  contactIds: string[];
  createdAt: number;
}

function WhatsAppBulkTab({ onBulkQueue }: { onBulkQueue: (q: BulkQueue) => void }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [activeView, setActiveView] = useState<'groups' | 'manage' | 'compose'>('groups');
  const [selectedGroup, setSelectedGroup] = useState<ContactGroup | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'custom' | 'ai_offer' | 'ai_followup' | 'ai_new_collection'>('custom');
  const [isGenerating, setIsGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [manageGroupId, setManageGroupId] = useState<string | null>(null);
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(null); // base64 data URL
  const [attachedPhotoName, setAttachedPhotoName] = useState<string>('');
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const GROUPS_KEY = 'meraki_contact_groups';

  useEffect(() => {
    setCustomers(storage.getCustomers());
    const saved = localStorage.getItem(GROUPS_KEY);
    if (saved) setGroups(JSON.parse(saved));
  }, []);

  const saveGroups = (updated: ContactGroup[]) => {
    setGroups(updated);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(updated));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachedPhoto(ev.target?.result as string);
      setAttachedPhotoName(file.name);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const removePhoto = () => {
    setAttachedPhoto(null);
    setAttachedPhotoName('');
  };

  const shareToWhatsApp = async (phone: string, text: string, photoBase64?: string | null) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    if (photoBase64 && navigator.share) {
      try {
        // Convert base64 to File for Web Share API
        const res = await fetch(photoBase64);
        const blob = await res.blob();
        const ext = photoBase64.includes('png') ? 'png' : 'jpg';
        const file = new File([blob], `offer.${ext}`, { type: blob.type });
        await navigator.share({
          title: 'Check this out!',
          text: text,
          files: [file],
        });
        return true;
      } catch (err: any) {
        if (err.name === 'AbortError') return false; // user cancelled
        console.warn('Share API failed, falling back to text-only:', err);
      }
    }
    // Fallback: text-only wa.me link
    const link = getWhatsAppAppLink(phone, text);
    window.open(link, '_blank');
    return true;
  };

  const createGroup = () => {
    if (!newGroupName.trim()) return;
    const newId = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const group: ContactGroup = {
      id: newId,
      name: newGroupName.trim(),
      contactIds: [],
      createdAt: Date.now()
    };
    const updated = [...groups, group];
    saveGroups(updated);
    setNewGroupName('');
    setShowNewGroup(false);
    // Open manage contacts view for the new group
    setManageGroupId(newId);
    setActiveView('manage');
    setSearch('');
  };

  const renameGroup = (groupId: string) => {
    if (!editName.trim()) return;
    saveGroups(groups.map(g => g.id === groupId ? { ...g, name: editName.trim() } : g));
    setEditingGroup(null);
    setEditName('');
  };

  const deleteGroup = (groupId: string) => {
    saveGroups(groups.filter(g => g.id !== groupId));
    if (selectedGroup?.id === groupId) setSelectedGroup(null);
    if (manageGroupId === groupId) setManageGroupId(null);
  };

  const addContactToGroup = (groupId: string, contactId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    if (group.contactIds.length >= 100) return alert('Group limit: 100 contacts max');
    if (group.contactIds.includes(contactId)) return;
    saveGroups(groups.map(g => g.id === groupId ? { ...g, contactIds: [...g.contactIds, contactId] } : g));
  };

  const removeContactFromGroup = (groupId: string, contactId: string) => {
    saveGroups(groups.map(g => g.id === groupId ? { ...g, contactIds: g.contactIds.filter(id => id !== contactId) } : g));
  };

  const addAllToGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const filtered = filteredManage;
    const newIds = filtered.map(c => c.id).filter(id => !group.contactIds.includes(id));
    const capped = newIds.slice(0, 100 - group.contactIds.length);
    saveGroups(groups.map(g => g.id === groupId ? { ...g, contactIds: [...g.contactIds, ...capped] } : g));
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Global sync: import ALL phone contacts into CRM (not into any group)
  const syncAllPhoneContacts = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const permission = await Contacts.requestPermissions();
      if (permission.contacts !== 'granted') {
        alert('Contact permission is required. Please allow contacts in app settings.');
        setIsSyncing(false);
        return;
      }

      const result = await Contacts.getContacts({
        projection: { name: true, phones: true }
      });

      const existingPhones = new Set(
        customers.map(c => c.phone.replace(/\D/g, '').slice(-10))
      );
      let imported = 0;
      let skipped = 0;

      for (const contact of result.contacts) {
        const name = contact.name?.display || '';
        const phone = contact.phones?.[0]?.number || '';
        if (!name || !phone) { skipped++; continue; }

        const cleanPhone = phone.replace(/\D/g, '');
        const last10 = cleanPhone.slice(-10);

        if (existingPhones.has(last10)) {
          skipped++;
          continue;
        }

        const newCustomer: Customer = {
          id: generateId(),
          name: name.trim(),
          phone: phone.trim(),
          birthday: '',
          notes: '',
          createdAt: Date.now()
        };
        storage.saveCustomer(newCustomer);
        customers.push(newCustomer);
        existingPhones.add(last10);
        imported++;
      }

      setCustomers(storage.getCustomers());
      setSyncResult(`Synced ${imported} new contacts (${skipped} already in CRM)`);
      setTimeout(() => setSyncResult(null), 5000);
    } catch (error) {
      console.error('Contact sync error:', error);
      alert('Failed to sync contacts.');
    } finally {
      setIsSyncing(false);
    }
  };

  const startBroadcast = () => {
    if (!selectedGroup || !message.trim()) return;
    const groupCustomers = customers.filter(c => selectedGroup.contactIds.includes(c.id));
    if (groupCustomers.length === 0) return;
    onBulkQueue({
      active: true,
      customers: groupCustomers,
      currentIndex: 0,
      message: message.trim(),
      isPaused: false,
      photo: attachedPhoto
    });
  };

  const handleAIGenerate = async (type: 'offer' | 'followup' | 'new_collection') => {
    setIsGenerating(true);
    try {
      const sampleCustomer = customers[0];
      if (!sampleCustomer) { setIsGenerating(false); return; }
      const aiType = type === 'new_collection' ? 'new_collection' : type;
      const msg = await generatePersonalizedMessage(sampleCustomer, aiType, [], { tone: 'enthusiastic', length: 'medium' });
      setMessage(msg);
      if (type === 'offer') setMessageType('ai_offer');
      else if (type === 'new_collection') setMessageType('ai_new_collection');
      else setMessageType('ai_followup');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredManage = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const currentManageGroup = groups.find(g => g.id === manageGroupId);

  /* ── Groups List View ── */
  if (activeView === 'groups') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{groups.length} group{groups.length !== 1 ? 's' : ''} • {customers.length} contacts</p>
          <div className="flex gap-2">
            <button 
              onClick={syncAllPhoneContacts} 
              disabled={isSyncing}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95",
                isSyncing 
                  ? "bg-blue-100 text-blue-600" 
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
              )}
            >
              {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <Smartphone size={14} />}
              {isSyncing ? 'Syncing...' : 'Sync Contacts'}
            </button>
            <button onClick={() => setShowNewGroup(true)} className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366] text-white rounded-xl text-xs font-bold shadow-lg shadow-green-100 active:scale-95 transition-all">
              <Plus size={14} />
              New Group
            </button>
          </div>
        </div>

        {/* Sync Result Banner */}
        {syncResult && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2"
          >
            <Check size={16} className="text-blue-600" />
            <p className="text-xs font-bold text-blue-700">{syncResult}</p>
          </motion.div>
        )}

        {/* New Group Input */}
        <AnimatePresence>
          {showNewGroup && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="bg-white rounded-2xl border border-green-200 p-4 space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Group Name</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="e.g. VIP Customers, Sale Group, Wholesale..."
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-green-200 focus:bg-white rounded-xl transition-all outline-none text-sm"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && createGroup()}
                />
                <div className="flex gap-2">
                  <button onClick={createGroup} className="flex-1 py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-bold">Create Group</button>
                  <button onClick={() => { setShowNewGroup(false); setNewGroupName(''); }} className="px-4 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold">Cancel</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Group Cards */}
        {customers.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Smartphone size={20} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-blue-800">No contacts yet</p>
              <p className="text-[10px] text-blue-600 mt-0.5">Tap "Sync Contacts" above to import your phone contacts first, then add them to groups.</p>
            </div>
          </div>
        )}

        {groups.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              {WHATSAPP_SVG}
            </div>
            <p className="text-gray-800 font-bold mb-1">No Groups Yet</p>
            <p className="text-gray-400 text-sm">Create a group to start bulk messaging</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map(group => {
              const groupContacts = customers.filter(c => group.contactIds.includes(c.id));
              return (
                <div key={group.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  {/* Group Header */}
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#25D366]/10 rounded-xl flex items-center justify-center shrink-0">
                      {WHATSAPP_SVG}
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingGroup === group.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="flex-1 text-sm font-bold px-2 py-1 border border-green-200 rounded-lg outline-none"
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') renameGroup(group.id); if (e.key === 'Escape') setEditingGroup(null); }}
                          />
                          <button onClick={() => renameGroup(group.id)} className="p-1 text-green-600"><Check size={16} /></button>
                          <button onClick={() => setEditingGroup(null)} className="p-1 text-gray-400"><X size={16} /></button>
                        </div>
                      ) : (
                        <p className="font-bold text-gray-900 truncate">{group.name}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {group.contactIds.length}/100 contacts
                        {groupContacts.length > 0 && <span className="text-gray-300"> • </span>}
                        {groupContacts.slice(0, 3).map(c => c.name).join(', ')}
                        {groupContacts.length > 3 && ` +${groupContacts.length - 3} more`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingGroup(group.id); setEditName(group.name); }}
                        className="p-2 text-gray-300 hover:text-blue-500 rounded-lg transition-colors"
                        title="Rename"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => { setManageGroupId(group.id); setActiveView('manage'); setSearch(''); }}
                        className="p-2 text-gray-300 hover:text-green-600 rounded-lg transition-colors"
                        title="Manage contacts"
                      >
                        <Users size={14} />
                      </button>
                      <button
                        onClick={() => deleteGroup(group.id)}
                        className="p-2 text-gray-300 hover:text-red-500 rounded-lg transition-colors"
                        title="Delete group"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Send to Group Button */}
                  <button
                    onClick={() => { setSelectedGroup(group); setActiveView('compose'); setMessage(''); }}
                    disabled={group.contactIds.length === 0}
                    className={cn(
                      "w-full py-3 flex items-center justify-center gap-2 text-xs font-bold transition-all",
                      group.contactIds.length > 0
                        ? "bg-[#25D366] text-white hover:bg-[#20BD5A]"
                        : "bg-gray-50 text-gray-300 cursor-not-allowed"
                    )}
                  >
                    {WHATSAPP_SVG}
                    <span>Send to {group.name}</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ── Manage Contacts View ── */
  if (activeView === 'manage' && currentManageGroup) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setActiveView('groups'); setManageGroupId(null); }} className="p-2 text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">{currentManageGroup.name}</h3>
            <p className="text-[10px] text-gray-400">{currentManageGroup.contactIds.length}/100 in group • {customers.length} total contacts</p>
          </div>
          <button
            onClick={() => { setActiveView('groups'); setManageGroupId(null); }}
            className="px-4 py-2 bg-[#25D366] text-white rounded-xl text-xs font-bold shadow-lg shadow-green-100 active:scale-95 transition-all"
          >
            Save
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => addAllToGroup(currentManageGroup.id)}
            disabled={currentManageGroup.contactIds.length >= 100}
            className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-[10px] font-bold disabled:opacity-40"
          >
            + Add All
          </button>
          <p className="text-[10px] text-gray-400">Tap contacts to add/remove</p>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-[#25D366] rounded-full transition-all"
            style={{ width: `${(currentManageGroup.contactIds.length / 100) * 100}%` }}
          />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search contacts to add..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-100 focus:outline-none transition-all outline-none text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Contact List */}
        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {filteredManage.map(customer => {
            const inGroup = currentManageGroup.contactIds.includes(customer.id);
            return (
              <button
                key={customer.id}
                onClick={() => inGroup
                  ? removeContactFromGroup(currentManageGroup.id, customer.id)
                  : addContactToGroup(currentManageGroup.id, customer.id)
                }
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                  inGroup
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-gray-100 hover:border-green-100"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                  inGroup ? "bg-green-500 border-green-500" : "border-gray-300"
                )}>
                  {inGroup && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">{customer.name}</p>
                  <p className="text-[10px] text-gray-400">{customer.phone}</p>
                </div>
                {inGroup && (
                  <button
                    onClick={e => { e.stopPropagation(); removeContactFromGroup(currentManageGroup.id, customer.id); }}
                    className="p-1 text-gray-300 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                )}
              </button>
            );
          })}
          {filteredManage.length === 0 && (
            <p className="text-center py-8 text-gray-400 text-sm italic">No contacts found</p>
          )}
        </div>

        {/* Done */}
        <button
          onClick={() => { setActiveView('groups'); setManageGroupId(null); }}
          className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold"
        >
          Done — {currentManageGroup.contactIds.length} contacts in group
        </button>
      </div>
    );
  }

  /* ── Compose & Send View ── */
  return (
    <div className="space-y-4">
      {/* Back */}
      <div className="flex items-center gap-3">
        <button onClick={() => { setActiveView('groups'); setSelectedGroup(null); setMessage(''); setAttachedPhoto(null); setAttachedPhotoName(''); }} className="p-2 text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h3 className="font-bold text-gray-900">Send to {selectedGroup?.name}</h3>
          <p className="text-[10px] text-gray-400">{selectedGroup?.contactIds.length} recipients</p>
        </div>
      </div>

      {/* AI Template Buttons */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">AI Message Templates</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleAIGenerate('offer')}
            disabled={isGenerating}
            className={cn(
              "flex items-center gap-2 p-3 rounded-xl border text-left transition-all",
              messageType === 'ai_offer'
                ? "bg-orange-50 border-orange-200 text-orange-700"
                : "bg-white border-gray-100 text-gray-600 hover:border-orange-200"
            )}
          >
            {isGenerating && messageType === 'ai_offer' ? <Loader2 size={16} className="animate-spin text-orange-500" /> : <Tag size={16} className="text-orange-500" />}
            <div>
              <p className="text-xs font-bold">🏷️ Offers & Discounts</p>
              <p className="text-[9px] text-gray-400">Sale, discount, promo</p>
            </div>
          </button>
          <button
            onClick={() => handleAIGenerate('new_collection')}
            disabled={isGenerating}
            className={cn(
              "flex items-center gap-2 p-3 rounded-xl border text-left transition-all",
              messageType === 'ai_new_collection'
                ? "bg-purple-50 border-purple-200 text-purple-700"
                : "bg-white border-gray-100 text-gray-600 hover:border-purple-200"
            )}
          >
            {isGenerating && messageType === 'ai_new_collection' ? <Loader2 size={16} className="animate-spin text-purple-500" /> : <ShoppingBag size={16} className="text-purple-500" />}
            <div>
              <p className="text-xs font-bold">👗 New Collection</p>
              <p className="text-[9px] text-gray-400">New arrivals, launch</p>
            </div>
          </button>
          <button
            onClick={() => handleAIGenerate('followup')}
            disabled={isGenerating}
            className={cn(
              "flex items-center gap-2 p-3 rounded-xl border text-left transition-all",
              messageType === 'ai_followup'
                ? "bg-pink-50 border-pink-200 text-pink-700"
                : "bg-white border-gray-100 text-gray-600 hover:border-pink-200"
            )}
          >
            {isGenerating && messageType === 'ai_followup' ? <Loader2 size={16} className="animate-spin text-pink-500" /> : <Clock size={16} className="text-pink-500" />}
            <div>
              <p className="text-xs font-bold">💝 Follow-up</p>
              <p className="text-[9px] text-gray-400">Re-engage inactive</p>
            </div>
          </button>
          <button
            onClick={() => setMessageType('custom')}
            className={cn(
              "flex items-center gap-2 p-3 rounded-xl border text-left transition-all",
              messageType === 'custom'
                ? "bg-gray-50 border-gray-300 text-gray-800"
                : "bg-white border-gray-100 text-gray-600 hover:border-gray-300"
            )}
          >
            <Pencil size={16} className="text-gray-500" />
            <div>
              <p className="text-xs font-bold">✏️ Custom</p>
              <p className="text-[9px] text-gray-400">Write your own</p>
            </div>
          </button>
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-2">
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={messageType === 'custom' ? "Type your message..." : "AI generating... or edit this message"}
          className="w-full text-sm bg-gray-50 p-3 rounded-xl border border-gray-50 text-gray-700 h-32 focus:ring-2 focus:ring-green-100 focus:border-green-300 focus:outline-none transition-all outline-none resize-none"
        />
        <p className="text-[10px] text-gray-400 px-1">{message.length} chars • {selectedGroup?.contactIds.length} recipients</p>
      </div>

      {/* Photo Attachment */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Attach Photo (Optional)</p>
        
        {attachedPhoto ? (
          <div className="relative">
            <img src={attachedPhoto} alt="Attached" className="w-full h-48 object-cover rounded-xl border border-gray-100" />
            <button
              onClick={removePhoto}
              className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            >
              <X size={14} />
            </button>
            <p className="text-[10px] text-gray-400 mt-1 truncate">{attachedPhotoName}</p>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-green-300 hover:bg-green-50/50 transition-all"
            >
              <Camera size={18} />
              <span className="text-xs font-bold">Camera</span>
            </button>
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-green-300 hover:bg-green-50/50 transition-all"
            >
              <ImageIcon size={18} />
              <span className="text-xs font-bold">Gallery</span>
            </button>
          </div>
        )}

        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoSelect}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          className="hidden"
        />

        {attachedPhoto && (
          <p className="text-[10px] text-green-600 flex items-center gap-1 px-1">
            <Check size={10} /> Photo will be shared with each message via WhatsApp
          </p>
        )}
      </div>

      {/* Recipients Preview */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Recipients</p>
        <div className="flex flex-wrap gap-1.5">
          {customers
            .filter(c => selectedGroup?.contactIds.includes(c.id))
            .slice(0, 12)
            .map(c => (
              <span key={c.id} className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-lg font-medium border border-green-100">
                {c.name}
              </span>
            ))
          }
          {(selectedGroup?.contactIds.length || 0) > 12 && (
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-lg font-medium">
              +{(selectedGroup?.contactIds.length || 0) - 12} more
            </span>
          )}
        </div>
      </div>

      {/* Start Broadcast */}
      <button
        onClick={startBroadcast}
        disabled={!message.trim() || !selectedGroup || selectedGroup.contactIds.length === 0}
        className={cn(
          "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.98]",
          message.trim() && selectedGroup && selectedGroup.contactIds.length > 0
            ? "bg-[#25D366] text-white shadow-green-200 hover:bg-[#20BD5A]"
            : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
        )}
      >
        {WHATSAPP_SVG}
        <span>Send to {selectedGroup?.contactIds.length} Contacts{attachedPhoto ? ' 📎' : ''}</span>
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
  photo?: string | null; // base64 data URL
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
        // If photo attached, try Share API first (opens WhatsApp share sheet)
        if (queue.photo) {
          (async () => {
            try {
              const res = await fetch(queue.photo!);
              const blob = await res.blob();
              const ext = queue.photo!.includes('png') ? 'png' : 'jpg';
              const file = new File([blob], `offer.${ext}`, { type: blob.type });
              if (navigator.share) {
                await navigator.share({ title: '', text: queue.message, files: [file] });
              } else {
                // Fallback: text-only
                window.open(getWhatsAppAppLink(currentCustomer.phone, queue.message), '_blank');
              }
            } catch {
              // User cancelled or error — skip to next
            }
          })();
        } else {
          window.open(getWhatsAppAppLink(currentCustomer.phone, queue.message), '_blank');
        }
        
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
            <div className="space-y-2">
              <div className="bg-green-50 py-3 px-4 rounded-2xl flex items-center justify-center space-x-2">
                {countdown > 0 ? (
                  <>
                    <Clock size={18} className="text-green-600 animate-pulse" />
                    <span className="font-bold text-green-700">Next in {countdown}s...</span>
                  </>
                ) : (
                  <span className="font-bold text-green-700">{queue.photo ? 'Share via WhatsApp...' : 'Opening WhatsApp...'}</span>
                )}
              </div>
              {queue.photo && (
                <div className="flex items-center justify-center gap-2 text-[10px] text-purple-600 font-medium">
                  <ImageIcon size={12} />
                  <span>Photo attached — will open share sheet</span>
                </div>
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
