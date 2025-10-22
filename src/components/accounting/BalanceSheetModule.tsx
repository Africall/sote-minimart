import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/currencyFormat';
import { FileText, Download, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useReportExport } from '@/hooks/useReportExport';

interface BSRow {
  section: string;
  code: string;
  name: string;
  amount: number;
}

export const BalanceSheetModule: React.FC = () => {
  const [data, setData] = useState<BSRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const { toast } = useToast();
  const { exportReport, exporting } = useReportExport();

  useEffect(() => {
    loadBalanceSheet();
  }, [asOfDate]);

  const loadBalanceSheet = async () => {
    setLoading(true);
    try {
      const { data: bsData, error } = await supabase.rpc('v_balance_sheet', {
        p_asof: format(asOfDate, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      setData(bsData || []);
    } catch (error: any) {
      toast({
        title: 'Error loading balance sheet',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sections = ['Assets', 'Liabilities', 'Equity'];
  const sectionTotals = sections.map(section => ({
    section,
    total: data.filter(r => r.section === section).reduce((sum, r) => sum + r.amount, 0),
  }));

  const totalAssets = sectionTotals.find(s => s.section === 'Assets')?.total || 0;
  const totalLiabilities = sectionTotals.find(s => s.section === 'Liabilities')?.total || 0;
  const totalEquity = sectionTotals.find(s => s.section === 'Equity')?.total || 0;
  const liabilitiesPlusEquity = totalLiabilities + totalEquity;
  const balanced = Math.abs(totalAssets - liabilitiesPlusEquity) < 0.01;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Balance Sheet
            </CardTitle>
            <CardDescription>
              As of {format(asOfDate, 'MMMM d, yyyy')} | {balanced ? '✓ Balanced' : '✗ Not Balanced'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(asOfDate, 'MMM d, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={asOfDate}
                  onSelect={(date) => date && setAsOfDate(date)}
                />
              </PopoverContent>
            </Popover>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={exporting}
              onClick={() => exportReport({ reportType: 'balance_sheet', format: 'excel' })}
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
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 font-semibold">Assets</div>
                <Table>
                  <TableBody>
                    {data.filter(r => r.section === 'Assets').map((row) => (
                      <TableRow key={row.code}>
                        <TableCell className="font-mono text-sm w-20">{row.code}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(row.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted">
                      <TableCell colSpan={2}>Total Assets</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(totalAssets)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 font-semibold">Liabilities</div>
                <Table>
                  <TableBody>
                    {data.filter(r => r.section === 'Liabilities').map((row) => (
                      <TableRow key={row.code}>
                        <TableCell className="font-mono text-sm w-20">{row.code}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(row.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold bg-muted/50">
                      <TableCell colSpan={2}>Total Liabilities</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(totalLiabilities)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 font-semibold">Equity</div>
                <Table>
                  <TableBody>
                    {data.filter(r => r.section === 'Equity').map((row) => (
                      <TableRow key={row.code}>
                        <TableCell className="font-mono text-sm w-20">{row.code}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(row.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold bg-muted/50">
                      <TableCell colSpan={2}>Total Equity</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(totalEquity)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="border-2 border-primary rounded-lg p-4 bg-muted">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Liabilities + Equity:</span>
                  <span className="font-mono">{formatCurrency(liabilitiesPlusEquity)}</span>
                </div>
                {!balanced && (
                  <div className="text-destructive text-sm mt-2">
                    Difference: {formatCurrency(Math.abs(totalAssets - liabilitiesPlusEquity))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};