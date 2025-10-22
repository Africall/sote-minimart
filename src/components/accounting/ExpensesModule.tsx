import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Filter, Eye, Edit, Paperclip, Loader2, Trash2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CreateExpenseDialog } from './CreateExpenseDialog';

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  description: string;
  receipt_url: string | null;
}

const categories = [
  'Office', 'Utilities', 'Marketing', 'Rent', 'Transport', 'Equipment', 'Supplies', 'Professional Services'
];

export const ExpensesModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseStats, setExpenseStats] = useState({
    today: 0,
    week: 0,
    month: 0,
    average: 0
  });

  useEffect(() => {
    fetchExpenses();
    fetchExpenseStats();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch expenses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenseStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [todayResult, weekResult, monthResult] = await Promise.all([
        supabase.from('expenses').select('amount').eq('expense_date', today),
        supabase.from('expenses').select('amount').gte('expense_date', weekAgo),
        supabase.from('expenses').select('amount').gte('expense_date', monthAgo)
      ]);

      const todayTotal = todayResult.data?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const weekTotal = weekResult.data?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      const monthTotal = monthResult.data?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

      setExpenseStats({
        today: todayTotal,
        week: weekTotal,
        month: monthTotal,
        average: monthTotal / 30
      });
    } catch (error) {
      console.error('Error fetching expense stats:', error);
    }
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowViewDialog(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowCreateDialog(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
      if (error) throw error;
      
      toast({
        title: 'Expense Deleted',
        description: 'Expense has been deleted successfully',
      });
      
      fetchExpenses();
      fetchExpenseStats();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete expense',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Expenses</h2>
          <p className="text-muted-foreground">Track and manage business expenses</p>
        </div>
        <Button onClick={() => {
          setSelectedExpense(null);
          setShowCreateDialog(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {expenseStats.today.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{expenses.filter(e => e.expense_date === new Date().toISOString().split('T')[0]).length} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {expenseStats.week.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{expenses.filter(e => new Date(e.expense_date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {expenseStats.month.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{expenses.filter(e => new Date(e.expense_date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Daily</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {Math.round(expenseStats.average).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Based on 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expense ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.id}</TableCell>
                      <TableCell>{expense.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{expense.category}</Badge>
                      </TableCell>
                      <TableCell>KES {Number(expense.amount).toLocaleString()}</TableCell>
                      <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
                      <TableCell className="max-w-48 truncate">{expense.description}</TableCell>
                      <TableCell>
                        {expense.receipt_url ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <Paperclip className="h-3 w-3 mr-1" />
                            Attached
                          </Badge>
                        ) : (
                          <Badge variant="secondary">No Receipt</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewExpense(expense)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEditExpense(expense)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                                    <span className="text-red-500">Delete Expense</span>
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this expense? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteExpense(expense.id)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateExpenseDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onExpenseCreated={() => {
          fetchExpenses();
          fetchExpenseStats();
        }}
      />
      
      {/* View Expense Dialog */}
      {selectedExpense && (
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Expense Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Expense ID</h4>
                  <p className="text-sm text-muted-foreground">{selectedExpense.id}</p>
                </div>
                <div>
                  <h4 className="font-medium">Category</h4>
                  <Badge variant="secondary">{selectedExpense.category}</Badge>
                </div>
              </div>
              <div>
                <h4 className="font-medium">Title</h4>
                <p className="text-sm text-muted-foreground">{selectedExpense.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Amount</h4>
                  <p className="text-lg font-bold">KES {Number(selectedExpense.amount).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="font-medium">Date</h4>
                  <p className="text-sm text-muted-foreground">{new Date(selectedExpense.expense_date).toLocaleDateString()}</p>
                </div>
              </div>
              {selectedExpense.description && (
                <div>
                  <h4 className="font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedExpense.description}</p>
                </div>
              )}
              {selectedExpense.receipt_url && (
                <div>
                  <h4 className="font-medium">Receipt</h4>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <Paperclip className="h-3 w-3 mr-1" />
                    Receipt Attached
                  </Badge>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};