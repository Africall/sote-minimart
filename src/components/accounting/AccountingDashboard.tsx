import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, FileText, AlertTriangle } from 'lucide-react';
import { RevenueExpenseChart } from './dashboard/RevenueExpenseChart';
import { RecentTransactions } from './dashboard/RecentTransactions';
import { OverdueInvoices } from './dashboard/OverdueInvoices';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/supabaseUtils';

export const AccountingDashboard: React.FC = () => {
  // Optimized data fetching with React Query
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['accounting-dashboard'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [salesResult, expensesResult, invoicesResult] = await Promise.all([
        supabase.from('sales').select('total_amount').gte('created_at', thirtyDaysAgo).eq('payment_status', 'completed'),
        supabase.from('expenses').select('amount').gte('expense_date', thirtyDaysAgo),
        supabase.from('invoices').select('total_amount, outstanding_balance, status')
      ]);

      const totalRevenue = salesResult.data?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const totalExpenses = expensesResult.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const outstandingInvoices = invoicesResult.data?.reduce((sum, i) => sum + Number(i.outstanding_balance || 0), 0) || 0;
      const overdueCount = invoicesResult.data?.filter(inv => inv.status === 'overdue').length || 0;

      return {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        outstandingInvoices,
        overdueCount,
        taxesPayable: totalRevenue * 0.16 // 16% VAT estimate
      };
    },
    staleTime: 60000, // 1 minute
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const StatCard = ({ title, value, icon: Icon, trend, isLoading: loading }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-32" /> : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Accounting Dashboard</h2>
        <p className="text-muted-foreground">Real-time overview of your financial performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Revenue (30d)"
          value={formatCurrency(dashboardData?.totalRevenue || 0)}
          icon={DollarSign}
          trend="+20.1% from last month"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Expenses (30d)"
          value={formatCurrency(dashboardData?.totalExpenses || 0)}
          icon={TrendingDown}
          trend="-5.2% from last month"
          isLoading={isLoading}
        />
        <StatCard
          title="Net Profit (30d)"
          value={formatCurrency(dashboardData?.netProfit || 0)}
          icon={TrendingUp}
          trend="+28.4% from last month"
          isLoading={isLoading}
        />
        <StatCard
          title="Outstanding Invoices"
          value={formatCurrency(dashboardData?.outstandingInvoices || 0)}
          icon={FileText}
          trend={`${dashboardData?.overdueCount || 0} overdue`}
          isLoading={isLoading}
        />
        <StatCard
          title="Taxes Payable (VAT)"
          value={formatCurrency(dashboardData?.taxesPayable || 0)}
          icon={AlertTriangle}
          trend="16% VAT estimate"
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RevenueExpenseChart />
        <OverdueInvoices />
      </div>

      <RecentTransactions />
    </div>
  );
};