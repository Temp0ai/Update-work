import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getWhatsAppLink(phone: string, message: string) {
  let cleanPhone = phone.replace(/\D/g, '');
  
  // If it's a 10-digit number, prepend India country code 91
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }
  
  const encodedText = encodeURIComponent(message);
  
  // Return the web-standard link which works on desktop and mobile (with redirection)
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
}

export function getWhatsAppAppLink(phone: string, message: string) {
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }
  const encodedText = encodeURIComponent(message);
  
  // Deep link protocol for Android/iOS to force open the app
  return `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;
}
