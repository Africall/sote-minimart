
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Wallet, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CashReconciliationProps {
  dateFilter: 'today' | 'yesterday' | 'week' | 'month' | 'custom';
}

interface CashReconciliationData {
  id: string;
  cashier_name: string;
  expected_amount: number;
  declared_amount: number;
  difference: number;
  status: 'balanced' | 'short' | 'over';
}

export const CashReconciliation: React.FC<CashReconciliationProps> = ({ dateFilter }) => {
  const [reconciliations, setReconciliations] = useState<CashReconciliationData[]>([]);
  const [loading, setLoading] = useState(true);

  const getDateRange = () => {
    const today = new Date();
    const startDate = new Date();
    
    switch (dateFilter) {
      case 'today':
        return {
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return {
          startDate: yesterday.toISOString().split('T')[0],
          endDate: yesterday.toISOString().split('T')[0]
        };
      case 'week':
        startDate.setDate(today.getDate() - 7);
        return {
          startDate: startDate.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      case 'month':
        startDate.setMonth(today.getMonth() - 1);
        return {
          startDate: startDate.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      default:
        return {
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
    }
  };

  const fetchReconciliations = async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange();
      
      const { data, error } = await supabase
        .from('cash_reconciliation')
        .select(`
          id,
          expected_amount,
          declared_amount,
          difference,
          status,
          reconciliation_date,
          profiles!cash_reconciliation_cashier_id_fkey (
            name
          )
        `)
        .gte('reconciliation_date', dateRange.startDate)
        .lte('reconciliation_date', dateRange.endDate)
        .order('reconciliation_date', { ascending: false });

      if (error) throw error;
      
      const formattedData = (data || []).map(item => ({
        id: item.id,
        cashier_name: (item.profiles as any)?.name || 'Unknown',
        expected_amount: item.expected_amount,
        declared_amount: item.declared_amount,
        difference: item.difference,
        status: item.status as 'balanced' | 'short' | 'over'
      }));
      
      setReconciliations(formattedData);
    } catch (error: any) {
      console.error('Error fetching cash reconciliations:', error);
      toast.error('Failed to load cash reconciliations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliations();
  }, [dateFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'balanced': 
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'short':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'over':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'balanced': 
        return 'text-green-500';
      case 'short':
        return 'text-destructive';
      case 'over':
        return 'text-amber-500';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Wallet className="mr-2 h-5 w-5 text-primary" />
          Cash in Till (Per Cashier)
        </CardTitle>
        <CardDescription>
          Reconciliation of declared vs actual cash
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : reconciliations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No cash reconciliation data found for this period
          </div>
        ) : (
          <div className="space-y-4">
            {reconciliations.map(item => (
              <div key={item.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.cashier_name}</span>
                    {getStatusIcon(item.status)}
                  </div>
                  <div className={`text-sm font-medium ${getStatusTextColor(item.status)}`}>
                    {item.difference === 0 
                      ? 'Balanced' 
                      : item.difference > 0 
                        ? `Over by ${item.difference}` 
                        : `Short by ${Math.abs(item.difference)}`
                    }
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Expected</p>
                    <p>KES {item.expected_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Declared</p>
                    <p>KES {item.declared_amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">View Full Cash Report</Button>
      </CardFooter>
    </Card>
  );
};
