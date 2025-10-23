import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/currencyFormat';
import { DollarSign, Download, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useReportExport } from '@/hooks/useReportExport';

interface PLRow {
  section: string;
  code: string;
  name: string;
  amount: number;
}

export const IncomeStatementModule: React.FC = () => {
  const [data, setData] = useState<PLRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const { toast } = useToast();
  const { exportReport, exporting } = useReportExport();

  useEffect(() => {
    loadPL();
  }, [dateRange]);

  const loadPL = async () => {
    setLoading(true);
    try {
      const { data: plData, error } = await supabase.rpc('v_income_statement', {
        p_start: format(dateRange.from, 'yyyy-MM-dd'),
        p_end: format(dateRange.to, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      setData(plData || []);
    } catch (error: any) {
      toast({
        title: 'Error loading P&L',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sections = ['Revenue', 'Cost of Sales', 'Operating Expenses'];
  const sectionTotals = sections.map(section => ({
    section,
    total: data.filter(r => r.section === section).reduce((sum, r) => sum + r.amount, 0),
  }));

  const revenue = sectionTotals.find(s => s.section === 'Revenue')?.total || 0;
  const cogs = sectionTotals.find(s => s.section === 'Cost of Sales')?.total || 0;
  const expenses = sectionTotals.find(s => s.section === 'Operating Expenses')?.total || 0;
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - expenses;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Income Statement (P&L)
            </CardTitle>
            <CardDescription>
              {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Date Range
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
              onClick={() => exportReport({ reportType: 'income_statement', format: 'pdf' })}
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
        ) : (
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section} className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 font-semibold">{section}</div>
                <Table>
                  <TableBody>
                    {data.filter(r => r.section === section).map((row) => (
                      <TableRow key={row.code}>
                        <TableCell className="font-mono text-sm w-20">{row.code}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(row.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold bg-muted/50">
                      <TableCell colSpan={2}>Total {section}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(sectionTotals.find(s => s.section === section)?.total || 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ))}

            <div className="border-t-2 border-primary pt-4 space-y-2">
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Gross Profit:</span>
                <span className="font-mono font-bold">{formatCurrency(grossProfit)}</span>
              </div>
              <div className="flex justify-between text-xl">
                <span className="font-bold">Net Profit:</span>
                <span className={`font-mono font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {formatCurrency(netProfit)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground text-right">
                Margin: {revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};