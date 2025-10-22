import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/currencyFormat';
import { Receipt, Download, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface VATRow {
  side: string;
  code: string;
  name: string;
  amount: number;
}

export const VATReturnModule: React.FC = () => {
  const [data, setData] = useState<VATRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const { toast } = useToast();

  useEffect(() => {
    loadVAT();
  }, [dateRange]);

  const loadVAT = async () => {
    setLoading(true);
    try {
      const { data: vatData, error } = await supabase.rpc('v_vat_return', {
        p_start: format(dateRange.from, 'yyyy-MM-dd'),
        p_end: format(dateRange.to, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      setData(vatData || []);
    } catch (error: any) {
      toast({
        title: 'Error loading VAT return',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const outputVAT = data.filter(r => r.side === 'Output').reduce((sum, r) => sum + r.amount, 0);
  const inputVAT = data.filter(r => r.side === 'Input').reduce((sum, r) => sum + r.amount, 0);
  const netVAT = outputVAT - inputVAT;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              VAT Return (16%)
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
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Output VAT (Sales)</CardTitle>
                  <CardDescription>VAT collected from customers</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      {data.filter(r => r.side === 'Output').map((row) => (
                        <TableRow key={row.code}>
                          <TableCell className="font-mono text-sm">{row.code}</TableCell>
                          <TableCell>{row.name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(row.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-muted">
                        <TableCell colSpan={2}>Total Output VAT</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(outputVAT)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Input VAT (Purchases)</CardTitle>
                  <CardDescription>VAT paid to suppliers</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableBody>
                      {data.filter(r => r.side === 'Input').map((row) => (
                        <TableRow key={row.code}>
                          <TableCell className="font-mono text-sm">{row.code}</TableCell>
                          <TableCell>{row.name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(row.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-muted">
                        <TableCell colSpan={2}>Total Input VAT</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(inputVAT)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-primary">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-lg">
                    <span>Output VAT:</span>
                    <span className="font-mono">{formatCurrency(outputVAT)}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span>Less: Input VAT:</span>
                    <span className="font-mono">({formatCurrency(inputVAT)})</span>
                  </div>
                  <div className="border-t-2 border-primary pt-2 flex justify-between text-xl font-bold">
                    <span>{netVAT >= 0 ? 'VAT Payable to KRA:' : 'VAT Refundable:'}</span>
                    <span className={`font-mono ${netVAT >= 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {formatCurrency(Math.abs(netVAT))}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground text-right">
                    Due Date: {format(new Date(dateRange.to.getFullYear(), dateRange.to.getMonth() + 1, 20), 'MMM d, yyyy')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};