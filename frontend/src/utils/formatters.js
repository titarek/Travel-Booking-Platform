import { CURRENCY_SYMBOLS } from './constants.js';

/**
 * Format currency with selected currency and exchange rate
 */
export const formatCurrency = (amountInUsd, currency = 'USD', rates = { USD: 1, BDT: 121.5, EUR: 0.92 }) => {
  const rate = rates[currency] || 1;
  const converted = amountInUsd * rate;
  const symbol = CURRENCY_SYMBOLS[currency] || '$';

  return `${symbol}${Math.round(converted).toLocaleString()}`;
};

/**
 * Format date to readable string like "Mon, 28 Oct 2024"
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format time to "09:30 AM"
 */
export const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
