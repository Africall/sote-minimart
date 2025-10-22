
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Banknote, Wallet, Phone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PaymentBreakdownProps {
  dateFilter: 'today' | 'yesterday' | 'week' | 'month' | 'custom';
}

interface PaymentData {
  cash: number;
  mpesa: number;
  card: number;
  split: number;
}

export const PaymentBreakdown: React.FC<PaymentBreakdownProps> = ({ dateFilter }) => {
  const [data, setData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [dateFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      // Get date range
      const today = new Date();
      let startDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          startDate = today;
          break;
        case 'yesterday':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(today.getMonth() - 1);
          break;
        default:
          startDate = today;
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];

      // Get payment data from transactions table (which now has correct payment_type)
      const { data: transactionData, error } = await supabase
        .from('transactions')
        .select('payment_type, amount')
        .eq('transaction_type', 'sale')
        .gte('created_at', startDateStr + 'T00:00:00')
        .lte('created_at', endDateStr + 'T23:59:59');

      if (error) throw error;

      // Process the data
      const paymentBreakdown: PaymentData = {
        cash: 0,
        mpesa: 0,
        card: 0,
        split: 0
      };

      transactionData?.forEach(transaction => {
        const amount = Number(transaction.amount);
        
        switch (transaction.payment_type) {
          case 'cash':
            paymentBreakdown.cash += amount;
            break;
          case 'mpesa':
            paymentBreakdown.mpesa += amount;
            break;
          case 'card':
            paymentBreakdown.card += amount;
            break;
          case 'split':
            paymentBreakdown.split += amount;
            break;
        }
      });

      setData(paymentBreakdown);
    } catch (error: any) {
      console.error('Error fetching payments:', error.message);
      toast.error('Failed to load payment breakdown');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">No payment data available</p>
        </CardContent>
      </Card>
    );
  }

  const total = data.cash + data.mpesa + data.card + data.split;

  const calculatePercentage = (value: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <CreditCard className="mr-2 h-5 w-5 text-primary" />
          Payment Type Breakdown
        </CardTitle>
        <CardDescription>How customers are paying for their purchases</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-4">
          {[
            { label: 'Cash', value: data.cash, icon: <Banknote className="h-4 w-4 mr-2 text-green-500" /> },
            { label: 'M-PESA', value: data.mpesa, icon: <Phone className="h-4 w-4 mr-2 text-blue-500" /> },
            { label: 'Card', value: data.card, icon: <CreditCard className="h-4 w-4 mr-2 text-purple-500" /> },
            { label: 'Split Payment', value: data.split, icon: <Wallet className="h-4 w-4 mr-2 text-amber-500" /> },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center">{item.icon}<span>{item.label}</span></div>
              <div className="flex items-center gap-2">
                <span className="font-medium">KES {item.value.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">({calculatePercentage(item.value)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
