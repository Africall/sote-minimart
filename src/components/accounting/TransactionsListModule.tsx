import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/currencyFormat';
import { ArrowDownUp, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  payment_type: string;
  created_at: string;
  cashier_id: string;
  profiles?: {
    name: string;
  };
}

export const TransactionsListModule: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles:cashier_id(name)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading transactions',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'sale' ? 'bg-green-500' : 'bg-red-500';
  };

  const getPaymentColor = (payment: string) => {
    const colors: Record<string, string> = {
      cash: 'bg-blue-500',
      mpesa: 'bg-green-600',
      card: 'bg-purple-500',
      split: 'bg-orange-500',
    };
    return colors[payment] || 'bg-gray-500';
  };

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = searchTerm === '' || 
      (txn.profiles as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || txn.transaction_type === filterType;
    const matchesPayment = filterPayment === 'all' || txn.payment_type === filterPayment;
    
    return matchesSearch && matchesType && matchesPayment;
  });

  const totalSales = filteredTransactions
    .filter(t => t.transaction_type === 'sale')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownUp className="h-5 w-5" />
              All Transactions
            </CardTitle>
            <CardDescription>
              Complete transaction history from all cashiers | {filteredTransactions.length} transactions
            </CardDescription>
          </div>
          <Button onClick={loadTransactions} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by cashier or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sale">Sales</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPayment} onValueChange={setFilterPayment}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mpesa">M-PESA</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="split">Split</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Total Sales</div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalSales)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Total Expenses</div>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Net</div>
                <div className={`text-2xl font-bold ${totalSales - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalSales - totalExpenses)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Table */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {format(new Date(txn.created_at), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(txn.created_at), 'HH:mm:ss')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {(txn.profiles as any)?.name || 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(txn.transaction_type)}>
                          {txn.transaction_type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPaymentColor(txn.payment_type)}>
                          {txn.payment_type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`font-mono font-semibold ${
                          txn.transaction_type === 'sale' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {txn.transaction_type === 'sale' ? '+' : '-'}
                          {formatCurrency(txn.amount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs text-muted-foreground">
                          {txn.id.substring(0, 8)}...
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
