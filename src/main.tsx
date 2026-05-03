import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed: ', err));
  });
}

// Inject sample data if empty
const STORAGE_KEYS = {
  CUSTOMERS: 'crm_customers',
  PURCHASES: 'crm_purchases',
};

if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
  const sampleCustomers = [
    { id: '1', name: 'Sophia Chen', phone: '1234567890', birthday: '1995-05-02', notes: 'Loves silk fabrics and floral prints.', createdAt: Date.now() },
    { id: '2', name: 'Emma Watson', phone: '0987654321', birthday: '1992-08-15', notes: 'Prefers minimalist chic, high-waisted trousers.', createdAt: Date.now() },
    { id: '3', name: 'Olivia Rose', phone: '5550001111', notes: 'Occasion wear, weddings.', createdAt: Date.now() },
  ];
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(sampleCustomers));
  
  const samplePurchases = [
    { id: 'p1', customerId: '1', amount: 8500, date: Date.now() - 86400000 * 5, items: [], notes: 'Silk Summer Dress - Blue' },
    { id: 'p2', customerId: '2', amount: 4200, date: Date.now() - 86400000 * 45, items: [], notes: 'Cashmere Scarf' },
  ];
  localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(samplePurchases));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
