import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/currencyFormat';
import { BookOpen, Download, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useReportExport } from '@/hooks/useReportExport';

interface CashbookRow {
  tx_date: string;
  ref: string;
  memo: string;
  dr: number;
  cr: number;
  balance: number;
}

const CASH_ACCOUNTS = [
  { code: '1100', name: 'Cash on Hand (Tills)' },
  { code: '1110', name: 'M-PESA Till' },
  { code: '1120', name: 'Bank Current Account' },
];

export const CashbookModule: React.FC = () => {
  const [data, setData] = useState<CashbookRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState('1100');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const { toast } = useToast();
  const { exportReport, exporting } = useReportExport();

  useEffect(() => {
    loadCashbook();
  }, [account, dateRange]);

  const loadCashbook = async () => {
    setLoading(true);
    try {
      const { data: cbData, error } = await supabase.rpc('v_cashbook', {
        p_account_code: account,
        p_start: format(dateRange.from, 'yyyy-MM-dd'),
        p_end: format(dateRange.to, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      setData(cbData || []);
    } catch (error: any) {
      toast({
        title: 'Error loading cashbook',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount = CASH_ACCOUNTS.find(a => a.code === account);
  const totalDR = data.reduce((sum, r) => sum + r.dr, 0);
  const totalCR = data.reduce((sum, r) => sum + r.cr, 0);
  const closingBalance = data.length > 0 ? data[data.length - 1].balance : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Cashbook
            </CardTitle>
            <CardDescription>
              {selectedAccount?.name} | {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={account} onValueChange={setAccount}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CASH_ACCOUNTS.map(acc => (
                  <SelectItem key={acc.code} value={acc.code}>
                    {acc.code} - {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Period
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={exporting}
              onClick={() => exportReport({ reportType: 'cashbook', format: 'excel' })}
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No transactions found for selected period
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Receipts (DR)</TableHead>
                    <TableHead className="text-right">Payments (CR)</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(row.tx_date), 'MMM dd')}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{row.ref}</TableCell>
                      <TableCell className="text-sm">{row.memo}</TableCell>
                      <TableCell className="text-right font-mono">
                        {row.dr > 0 ? formatCurrency(row.dr) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {row.cr > 0 ? formatCurrency(row.cr) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {formatCurrency(row.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted font-bold">
                    <TableCell colSpan={3}>TOTALS</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(totalDR)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(totalCR)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(closingBalance)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <span className="font-semibold">Closing Balance:</span>
              <span className={`text-xl font-mono font-bold ${closingBalance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {formatCurrency(closingBalance)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};