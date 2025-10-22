
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ArrowUpRight, BarChart } from 'lucide-react';

interface ProfitEstimateProps {
  dateFilter: 'today' | 'yesterday' | 'week' | 'month' | 'custom';
}

export const ProfitEstimate: React.FC<ProfitEstimateProps> = ({ dateFilter }) => {
  // Mock data - in a real app, this would be fetched from an API
  const mockData = {
    sales: 89750,
    cogs: 65480,
    expenses: 8700,
    profit: 15570,
    profitMargin: 17.3,
    previousPeriodProfit: 14200,
    change: 9.6
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-primary" />
          Profit Estimate
        </CardTitle>
        <CardDescription>
          Sales – Cost of Goods – Expenses
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-green-600">
              KES {mockData.profit.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
              <ArrowUpRight className="h-3 w-3" />
              <span>{mockData.change}% vs previous</span>
            </div>
          </div>
          
          <div className="space-y-3 mt-2">
            <div className="flex justify-between text-sm">
              <span>Sales</span>
              <span>KES {mockData.sales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Cost of Goods</span>
              <span className="text-destructive">- KES {mockData.cogs.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Expenses</span>
              <span className="text-destructive">- KES {mockData.expenses.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="pt-2 border-t flex items-center justify-between">
            <span className="text-sm">Profit Margin</span>
            <span className="text-sm font-medium">{mockData.profitMargin}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
