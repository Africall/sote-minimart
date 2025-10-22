import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface TransactionData {
  id: string;
  amount: number;
  transaction_type: string;
  created_at: string;
  payment_type?: string;
}

export const RecentTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);

  useEffect(() => {
    fetchRecentTransactions();
  }, []);

  const fetchRecentTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
    }
  };

  const getInitials = (type: string) => {
    return type === 'sale' ? 'S' : 'E';
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const transactionDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{getInitials(transaction.transaction_type)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {transaction.transaction_type === 'sale' ? 'Sale Transaction' : 'Expense Transaction'}
            </p>
            <p className="text-sm text-muted-foreground">{getTimeAgo(transaction.created_at)}</p>
          </div>
          <div className="ml-auto">
            <div className={`text-sm font-medium ${
              transaction.transaction_type === 'sale' ? 'text-green-600' : 'text-red-600'
            }`}>
              {transaction.transaction_type === 'sale' ? '+' : '-'}KES {Number(transaction.amount).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground text-right">
              {transaction.transaction_type === 'sale' ? 'Sale' : 'Expense'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};