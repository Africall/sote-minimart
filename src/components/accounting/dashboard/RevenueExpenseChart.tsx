import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

export const RevenueExpenseChart: React.FC = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      // Get last 6 months of data
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push({
          name: date.toLocaleDateString('en-US', { month: 'short' }),
          month: date.getMonth() + 1,
          year: date.getFullYear()
        });
      }

      const chartData = await Promise.all(
        months.map(async (month) => {
          const startDate = new Date(month.year, month.month - 1, 1).toISOString();
          const endDate = new Date(month.year, month.month, 0).toISOString();

          const [revenueResult, expenseResult] = await Promise.all([
            supabase
              .from('transactions')
              .select('amount')
              .eq('transaction_type', 'sale')
              .gte('created_at', startDate)
              .lt('created_at', endDate),
            supabase
              .from('expenses')
              .select('amount')
              .gte('expense_date', startDate.split('T')[0])
              .lt('expense_date', endDate.split('T')[0])
          ]);

          const revenue = revenueResult.data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
          const expenses = expenseResult.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

          return {
            month: month.name,
            revenue,
            expenses
          };
        })
      );

      setData(chartData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Fallback to sample data if fetch fails
      setData([
        { month: 'Jan', revenue: 185000, expenses: 65000 },
        { month: 'Feb', revenue: 192000, expenses: 68000 },
        { month: 'Mar', revenue: 198000, expenses: 72000 },
        { month: 'Apr', revenue: 205000, expenses: 75000 },
        { month: 'May', revenue: 220000, expenses: 73000 },
        { month: 'Jun', revenue: 245000, expenses: 78000 },
      ]);
    }
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip 
          formatter={(value, name) => [
            `KES ${Number(value).toLocaleString()}`,
            name === 'revenue' ? 'Revenue' : 'Expenses'
          ]}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="revenue" 
          stroke="hsl(var(--primary))" 
          strokeWidth={3}
          name="Revenue"
        />
        <Line 
          type="monotone" 
          dataKey="expenses" 
          stroke="hsl(var(--destructive))" 
          strokeWidth={3}
          name="Expenses"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};