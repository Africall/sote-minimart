
import { 
  ReceiptText, Package2, Wallet
} from 'lucide-react';
import React from 'react';

export interface ReportConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  filters: string[];
}

export const reports: ReportConfig[] = [
  {
    id: 'sales',
    title: 'Sales Report',
    description: 'Detailed breakdown by day, cashier, branch, or item',
    icon: React.createElement(ReceiptText, { className: 'h-6 w-6' }),
    filters: ['day', 'cashier', 'item']
  },
  {
    id: 'stock',
    title: 'Stock Valuation Report',
    description: 'Total stock value (quantity × cost)',
    icon: React.createElement(Package2, { className: 'h-6 w-6' }),
    filters: ['category', 'supplier']
  },
  {
    id: 'expenses',
    title: 'Expense Report',
    description: 'By category, person, or department',
    icon: React.createElement(Wallet, { className: 'h-6 w-6' }),
    filters: ['category', 'user']
  }
];
