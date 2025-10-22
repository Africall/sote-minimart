
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Wallet, CreditCard, Banknote, Phone, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CashierSalesData {
  cashier_id: string;
  cashier_name: string;
  total_sales: number;
  total_transactions: number;
  cash_sales: number;
  mpesa_sales: number;
  card_sales: number;
  split_sales: number;
  average_transaction: number;
}

interface CashierSalesBreakdownProps {
  dateFilter: 'today' | 'yesterday' | 'week' | 'month' | 'custom';
}

export const CashierSalesBreakdown: React.FC<CashierSalesBreakdownProps> = ({ dateFilter }) => {
  const [cashierData, setCashierData] = useState<CashierSalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCashierSales();
  }, [dateFilter]);

  const fetchCashierSales = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('CashierSalesBreakdown - Fetching data for filter:', dateFilter);
      
      // Get date range
      const today = new Date();
      let startDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          break;
        case 'yesterday':
          startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
          break;
        case 'week':
          startDate = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
          break;
        case 'month':
          startDate = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
          break;
        default:
          startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      }

      const startDateStr = startDate.toISOString();
      const endDateStr = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();

      console.log('CashierSalesBreakdown - Date range:', startDateStr, 'to', endDateStr);

      // First, check if we have any sales data at all
      const { data: allSales, error: allSalesError } = await supabase
        .from('sales')
        .select('id, cashier_id, total_amount, payment_method, created_at')
        .limit(5);

      if (allSalesError) {
        console.error('Error checking sales table:', allSalesError);
        throw new Error(`Database error: ${allSalesError.message}`);
      }

      console.log('CashierSalesBreakdown - Sample sales data:', allSales);

      // Get sales data with cashier information
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          cashier_id,
          total_amount,
          payment_method,
          created_at
        `)
        .gte('created_at', startDateStr)
        .lt('created_at', endDateStr)
        .not('cashier_id', 'is', null);

      if (salesError) {
        console.error('CashierSalesBreakdown - Sales query error:', salesError);
        throw new Error(`Failed to fetch sales data: ${salesError.message}`);
      }

      // Get cashier profiles separately
      const cashierIds = Array.from(new Set(salesData?.map(sale => sale.cashier_id).filter(Boolean) || []));
      let profilesData: any[] = [];
      
      if (cashierIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', cashierIds);

        if (!profilesError && profiles) {
          profilesData = profiles;
        }
      }


      console.log('CashierSalesBreakdown - Filtered sales data:', salesData?.length || 0, 'records');

      // Get transaction data for payment method breakdown
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('cashier_id, payment_type, amount, created_at')
        .eq('transaction_type', 'sale')
        .gte('created_at', startDateStr)
        .lt('created_at', endDateStr)
        .not('cashier_id', 'is', null);

      if (transactionError) {
        console.error('CashierSalesBreakdown - Transaction query error:', transactionError);
        // Don't throw error, just log it as payment breakdown is optional
      }

      console.log('CashierSalesBreakdown - Transaction data:', transactionData?.length || 0, 'records');

      // Process the data
      const cashierMap = new Map<string, CashierSalesData>();
      const profilesMap = new Map(profilesData.map(profile => [profile.id, profile.name]));

      // Process sales data
      salesData?.forEach(sale => {
        if (!sale.cashier_id) return;
        
        const cashierId = sale.cashier_id;
        const cashierName = profilesMap.get(cashierId) || `Cashier ${cashierId.slice(-4)}`;
        
        if (!cashierMap.has(cashierId)) {
          cashierMap.set(cashierId, {
            cashier_id: cashierId,
            cashier_name: cashierName,
            total_sales: 0,
            total_transactions: 0,
            cash_sales: 0,
            mpesa_sales: 0,
            card_sales: 0,
            split_sales: 0,
            average_transaction: 0
          });
        }

        const cashier = cashierMap.get(cashierId)!;
        const amount = Number(sale.total_amount) || 0;
        cashier.total_sales += amount;
        cashier.total_transactions += 1;

        // Basic payment method breakdown from sales payment_method
        const paymentMethod = sale.payment_method?.toLowerCase() || 'cash';
        switch (paymentMethod) {
          case 'cash':
            cashier.cash_sales += amount;
            break;
          case 'mpesa':
          case 'm-pesa':
            cashier.mpesa_sales += amount;
            break;
          case 'card':
            cashier.card_sales += amount;
            break;
          case 'split':
            cashier.split_sales += amount;
            break;
          default:
            cashier.cash_sales += amount; // Default to cash if unknown
        }
      });

      // Enhanced payment method breakdown from transactions if available
      if (transactionData && transactionData.length > 0) {
        // Reset payment method amounts to recalculate from transactions
        cashierMap.forEach(cashier => {
          cashier.cash_sales = 0;
          cashier.mpesa_sales = 0;
          cashier.card_sales = 0;
          cashier.split_sales = 0;
        });

        transactionData.forEach(transaction => {
          if (!transaction.cashier_id) return;
          
          const cashier = cashierMap.get(transaction.cashier_id);
          if (!cashier) return;

          const amount = Number(transaction.amount) || 0;
          
          switch (transaction.payment_type?.toLowerCase()) {
            case 'cash':
              cashier.cash_sales += amount;
              break;
            case 'mpesa':
            case 'm-pesa':
              cashier.mpesa_sales += amount;
              break;
            case 'card':
              cashier.card_sales += amount;
              break;
            case 'split':
              cashier.split_sales += amount;
              break;
          }
        });
      }

      // Calculate averages
      Array.from(cashierMap.values()).forEach(cashier => {
        if (cashier.total_transactions > 0) {
          cashier.average_transaction = cashier.total_sales / cashier.total_transactions;
        }
      });

      const result = Array.from(cashierMap.values()).sort((a, b) => b.total_sales - a.total_sales);
      console.log('CashierSalesBreakdown - Processed cashier data:', result);
      
      setCashierData(result);

      if (result.length === 0) {
        console.log('CashierSalesBreakdown - No data found for period');
      }

    } catch (error: any) {
      console.error('CashierSalesBreakdown - Error fetching data:', error);
      setError(error.message || 'Failed to load cashier sales data');
      toast.error('Failed to load cashier sales data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary" />
            Cashier Sales Breakdown
          </CardTitle>
          <CardDescription>Loading sales data...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary" />
            Cashier Sales Breakdown
          </CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-red-600">
            <AlertCircle className="mr-2 h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5 text-primary" />
          Cashier Sales Breakdown
        </CardTitle>
        <CardDescription>
          Sales performance by cashier for the selected period ({dateFilter})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {cashierData.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-center text-muted-foreground">
              No sales data available for the selected period
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Try selecting a different date range or ensure sales have been recorded
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {cashierData.map((cashier) => (
              <div key={cashier.cashier_id} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{cashier.cashier_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {cashier.total_transactions} transaction{cashier.total_transactions !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl text-green-600">{formatCurrency(cashier.total_sales)}</div>
                    <div className="text-sm text-muted-foreground">
                      Avg: {formatCurrency(cashier.average_transaction)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <Banknote className="h-4 w-4 text-green-600" />
                    <div className="text-sm">
                      <div className="font-medium">Cash</div>
                      <div className="text-green-600">{formatCurrency(cashier.cash_sales)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <div className="text-sm">
                      <div className="font-medium">M-PESA</div>
                      <div className="text-blue-600">{formatCurrency(cashier.mpesa_sales)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                    <div className="text-sm">
                      <div className="font-medium">Card</div>
                      <div className="text-purple-600">{formatCurrency(cashier.card_sales)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-amber-50 rounded">
                    <Wallet className="h-4 w-4 text-amber-600" />
                    <div className="text-sm">
                      <div className="font-medium">Split</div>
                      <div className="text-amber-600">{formatCurrency(cashier.split_sales)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
