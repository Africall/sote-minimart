
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Plus, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DailyExpensesProps {
  dateFilter: 'today' | 'yesterday' | 'week' | 'month' | 'custom';
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  recorded_by: string | null;
  profiles?: { name: string } | null;
}

export const DailyExpenses: React.FC<DailyExpensesProps> = ({ dateFilter }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const handleAddExpense = () => {
    toast.info('Add expense dialog would open here');
  };

  const handleViewExpense = (expenseId: string) => {
    toast.info(`Viewing expense details for ${expenseId}`);
  };

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

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange();
      
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          id,
          title,
          amount,
          category,
          recorded_by,
          profiles:recorded_by (
            name
          )
        `)
        .gte('expense_date', dateRange.startDate)
        .lte('expense_date', dateRange.endDate)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setExpenses((data as any) || []);
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [dateFilter]);

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'transport': return 'bg-blue-100 text-blue-800';
      case 'staff': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-purple-100 text-purple-800';
      case 'utilities': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <Wallet className="mr-2 h-5 w-5 text-primary" />
            Expenses Today
          </CardTitle>
          <Button size="sm" variant="outline" className="h-8" onClick={handleAddExpense}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        <CardDescription>
          Total: KES {totalExpenses.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No expenses found for this period
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map(expense => (
              <div key={expense.id} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                <div>
                  <p className="text-sm font-medium">{expense.title}</p>
                  <div className="flex gap-2 items-center mt-1">
                    <Badge variant="outline" className={getCategoryBadgeColor(expense.category)}>
                      {expense.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {(expense.profiles as any)?.name || 'Unknown'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">KES {expense.amount.toLocaleString()}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => handleViewExpense(expense.id)}
                  >
                    <FileText className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
