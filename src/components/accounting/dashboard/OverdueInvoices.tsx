import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Eye } from 'lucide-react';

const overdueInvoices = [
  {
    id: 'INV-001',
    customer: 'ABC Corp',
    amount: 15000,
    daysOverdue: 45,
    dueDate: '2024-08-15',
  },
  {
    id: 'INV-015',
    customer: 'XYZ Ltd',
    amount: 8500,
    daysOverdue: 32,
    dueDate: '2024-08-28',
  },
  {
    id: 'INV-023',
    customer: 'Tech Solutions',
    amount: 21600,
    daysOverdue: 15,
    dueDate: '2024-09-15',
  },
];

export const OverdueInvoices: React.FC = () => {
  return (
    <div className="space-y-3">
      {overdueInvoices.map((invoice) => (
        <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{invoice.id}</span>
              <Badge variant="destructive">{invoice.daysOverdue} days overdue</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{invoice.customer}</p>
            <p className="text-sm font-medium">KES {invoice.amount.toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline">
              <Mail className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};