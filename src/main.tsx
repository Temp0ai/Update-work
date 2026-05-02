import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Inject sample data if empty
const STORAGE_KEYS = {
  CUSTOMERS: 'crm_customers',
  PURCHASES: 'crm_purchases',
};

if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
  const sampleCustomers = [
    { id: '1', name: 'John Doe', phone: '1234567890', birthday: '1990-05-02', createdAt: Date.now() },
    { id: '2', name: 'Jane Smith', phone: '0987654321', birthday: '1992-08-15', createdAt: Date.now() },
    { id: '3', name: 'Sam Wilson', phone: '5550001111', createdAt: Date.now() },
  ];
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(sampleCustomers));
  
  const samplePurchases = [
    { id: 'p1', customerId: '1', amount: 150.00, date: Date.now() - 86400000 * 2, items: [], notes: 'Monthly subscription' },
    { id: 'p2', customerId: '2', amount: 45.00, date: Date.now() - 86400000 * 45, items: [], notes: 'Shoes' },
  ];
  localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(samplePurchases));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
