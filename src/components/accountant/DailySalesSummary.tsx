
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, ArrowUpDown, TrendingDown, TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getLiveSalesAnalytics } from '@/utils/reportUtils';
import { useQueryClient } from '@tanstack/react-query';

interface DailySalesSummaryProps {
  dateFilter: 'today' | 'yesterday' | 'week' | 'month' | 'custom';
}

interface SalesStats {
  total_sales: number;
  total_refunds: number;
  total_discounts: number;
  total_transactions: number;
}

export const DailySalesSummary: React.FC<DailySalesSummaryProps> = ({ dateFilter }) => {
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

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

  const fetchStats = React.useCallback(async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange();
      console.log('Fetching sales analytics with date range:', dateRange);
      const data = await getLiveSalesAnalytics(dateRange);
      console.log('Sales analytics data received:', data);
      
      if (data) {
        // Ensure all numeric values have defaults
        const safeStats = {
          total_sales: Number(data.total_sales) || 0,
          total_refunds: Number(data.total_refunds) || 0,
          total_discounts: Number(data.total_discounts) || 0,
          total_transactions: Number(data.total_transactions) || 0,
        };
        console.log('Setting safe stats:', safeStats);
        setStats(safeStats);
      } else {
        console.log('No data received, setting default stats');
        setStats({
          total_sales: 0,
          total_refunds: 0,
          total_discounts: 0,
          total_transactions: 0,
        });
      }
    } catch (err: any) {
      console.error('Error fetching sales summary:', err.message);
      toast.error(`Error fetching sales summary: ${err.message}`);
      // Set default values on error
      setStats({
        total_sales: 0,
        total_refunds: 0,
        total_discounts: 0,
        total_transactions: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    let isMounted = true;
    
    const loadStats = async () => {
      if (isMounted) {
        await fetchStats();
      }
    };
    
    loadStats();
    
    return () => {
      isMounted = false;
    };
  }, [fetchStats]);

  // Listen for transaction-related query invalidations to refetch data
  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (isMounted && event?.type === 'updated' && 
          (event.query.queryKey.includes('transactions') || 
           event.query.queryKey.includes('sales') ||
           event.query.queryKey.includes('dailyStats'))) {
        console.log('Transaction-related query updated, refetching sales stats');
        fetchStats();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [queryClient, fetchStats]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  // Safe number formatting with fallbacks
  const formatNumber = (value: number | undefined | null): string => {
    const safeValue = Number(value) || 0;
    return safeValue.toLocaleString();
  };

  const formatCurrency = (value: number | undefined | null): string => {
    const safeValue = Number(value) || 0;
    return `KES ${safeValue.toLocaleString()}`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <BarChart3 className="mr-2 h-5 w-5 text-primary" />
          Daily Sales Summary
        </CardTitle>
        <CardDescription>
          {dateFilter === 'today' && "Today's sales, refunds and discounts"}
          {dateFilter === 'week' && "This week's sales, refunds and discounts"}
          {dateFilter === 'month' && "This month's sales, refunds and discounts"}
          {dateFilter === 'custom' && "Sales, refunds and discounts for selected period"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Sales</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(stats.total_sales)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Transactions</p>
            <p className="text-2xl font-bold">{formatNumber(stats.total_transactions)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Refunds</p>
            <p className="text-lg font-medium text-destructive">{formatCurrency(stats.total_refunds)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Discounts</p>
            <p className="text-lg font-medium text-amber-500">{formatCurrency(stats.total_discounts)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
