import { useState, useEffect } from 'react';
import { Users, IndianRupee, Gift, ArrowUpRight, Plus, History as HistoryIcon, MessageSquareText } from 'lucide-react';
import { storage } from '../services/storage';
import { Customer, Purchase, Stats } from '../types';
import { formatCurrency, getWhatsAppLink, getWhatsAppAppLink, cn } from '../lib/utils';
import { format, addDays, getMonth, getDate } from 'date-fns';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const settings = storage.getSettings();
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    totalRevenue: 0,
    purchasesThisMonth: 0,
    upcomingBirthdays: 0,
  });
  const [birthdayPeeps, setBirthdayPeeps] = useState<Customer[]>([]);

  useEffect(() => {
    const customers = storage.getCustomers();
    const purchases = storage.getPurchases();
    
    // Calculate stats
    const now = new Date();
    const thisMonth = getMonth(now);
    
    const monthlyPurchases = purchases.filter(p => getMonth(new Date(p.date)) === thisMonth);
    const totalRev = purchases.reduce((acc, p) => acc + p.amount, 0);
    
    // Birthdays in next 7 days
    const next7Days = Array.from({ length: 7 }, (_, i) => addDays(now, i));
    const bdays = customers.filter(c => {
      if (!c.birthday) return false;
      const bday = new Date(c.birthday);
      return next7Days.some(d => 
        getMonth(d) === getMonth(bday) && getDate(d) === getDate(bday)
      );
    });

    setStats({
      totalCustomers: customers.length,
      totalRevenue: totalRev,
      purchasesThisMonth: monthlyPurchases.length,
      upcomingBirthdays: bdays.length,
    });
    setBirthdayPeeps(bdays);
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Overview</h2>
        <p className="text-[10px] text-pink-500 font-bold uppercase tracking-widest mb-4">{settings.slogan}</p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard 
            label="Total Customers" 
            value={stats.totalCustomers} 
            icon={Users} 
            color="bg-pink-50 text-pink-600" 
          />
          <StatCard 
            label="Revenue" 
            value={formatCurrency(stats.totalRevenue)} 
            icon={IndianRupee} 
            color="bg-rose-50 text-rose-600" 
          />
          <StatCard 
            label="Monthly Sales" 
            value={stats.purchasesThisMonth} 
            icon={ArrowUpRight} 
            color="bg-orange-50 text-orange-600" 
          />
          <StatCard 
            label="Birthdays" 
            value={stats.upcomingBirthdays} 
            icon={Gift} 
            color="bg-pink-50 text-pink-500" 
          />
        </div>
      </section>

      {birthdayPeeps.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">Upcoming Birthdays</h3>
          </div>
          <div className="space-y-2">
            {birthdayPeeps.map(customer => (
              <div key={customer.id} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{customer.name}</p>
                  <p className="text-xs text-gray-400">{customer.birthday ? format(new Date(customer.birthday), 'MMM dd') : ''}</p>
                </div>
                <a
                  href={getWhatsAppAppLink(customer.phone, `Happy Birthday ${customer.name}! 🎉 ✨ Celebrating you today at ${settings.shopName}. Hope you have a wonderful day.`)}
                  target="_blank"
                  rel="no-referrer"
                  className="p-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors shadow-lg shadow-pink-100"
                >
                  <MessageSquareText size={16} />
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="font-semibold text-gray-700 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/customers" className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-100 hover:border-pink-200 transition-all group">
            <div className="p-3 bg-pink-50 rounded-xl text-pink-600 mb-2 group-hover:scale-110 transition-transform">
              <Plus size={24} />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">New Customer</span>
          </Link>
          <Link to="/history" className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-100 hover:border-pink-200 transition-all group">
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600 mb-2 group-hover:scale-110 transition-transform">
              <HistoryIcon size={24} />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">All Sales</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-2">
      <div className={cn("p-2 rounded-lg w-fit", color)}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-bold tracking-tight">{value}</p>
      </div>
    </div>
  );
}
