export interface Customer {
  id: string;
  name: string;
  phone: string;
  birthday?: string; // YYYY-MM-DD
  notes?: string;
  createdAt: number;
}

export interface Purchase {
  id: string;
  customerId: string;
  amount: number;
  items: string[];
  date: number;
  notes?: string;
}

export interface Reminder {
  id: string;
  customerId: string;
  type: 'birthday' | 'followup' | 'offer';
  date: number;
  status: 'pending' | 'sent';
  message: string;
}

export type Stats = {
  totalCustomers: number;
  totalRevenue: number;
  purchasesThisMonth: number;
  upcomingBirthdays: number;
};

export interface BusinessSettings {
  shopName: string;
  slogan: string;
  ownerName: string;
  ownerPhone: string;
  geminiApiKey?: string;
}
