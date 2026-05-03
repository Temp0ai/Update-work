import { Customer, Purchase, Reminder, BusinessSettings } from '../types';

const STORAGE_KEYS = {
  CUSTOMERS: 'crm_customers',
  PURCHASES: 'crm_purchases',
  REMINDERS: 'crm_reminders',
  SETTINGS: 'crm_settings',
};

export const storage = {
  getSettings: (): BusinessSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : {
      shopName: 'Meraki',
      slogan: "Let's style speak",
      ownerName: 'Bharti Jain',
      ownerPhone: '7219473436'
    };
  },
  saveSettings: (settings: BusinessSettings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : [];
  },
  saveCustomer: (customer: Customer) => {
    const customers = storage.getCustomers();
    
    // Ensure phone number has +91 prefix if it's 10 digits
    let clean = customer.phone.replace(/\D/g, '');
    if (clean.length === 10) {
      customer.phone = `+91${clean}`;
    }

    const index = customers.findIndex(c => c.id === customer.id);
    if (index >= 0) {
      customers[index] = customer;
    } else {
      customers.push(customer);
    }
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  },
  deleteCustomer: (id: string) => {
    const customers = storage.getCustomers().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    // Also cleanup purchases
    const purchases = storage.getPurchases().filter(p => p.customerId !== id);
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  },
  deleteCustomersBulk: (ids: string[]) => {
    const customers = storage.getCustomers().filter(c => !ids.includes(c.id));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    // Also cleanup purchases
    const purchases = storage.getPurchases().filter(p => !ids.includes(p.customerId));
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  },

  // Format all numbers with +91 if they are 10 digits
  runCleanup: () => {
    let customers = storage.getCustomers();
    
    // Prefix all numbers with +91 if they are 10 digits
    customers = customers.map(c => {
      let clean = c.phone.replace(/\D/g, '');
      if (clean.length === 10) {
        return { ...c, phone: `+91${clean}` };
      }
      return c;
    });

    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    return customers.length;
  },

  getPurchases: (): Purchase[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    return data ? JSON.parse(data) : [];
  },
  savePurchase: (purchase: Purchase) => {
    const purchases = storage.getPurchases();
    purchases.push(purchase);
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  },
  deletePurchase: (id: string) => {
    const purchases = storage.getPurchases().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  },

  getReminders: (): Reminder[] => {
    const data = localStorage.getItem(STORAGE_KEYS.REMINDERS);
    return data ? JSON.parse(data) : [];
  },
  saveReminder: (reminder: Reminder) => {
    const reminders = storage.getReminders();
    reminders.push(reminder);
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  }
};
