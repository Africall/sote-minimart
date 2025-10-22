/**
 * Currency formatting utility for consistent KES display across the application
 */

export const formatCurrency = (amount: number): string => {
  return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 1000000) {
    return `KSh ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `KSh ${(amount / 1000).toFixed(1)}K`;
  }
  return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0;
};
