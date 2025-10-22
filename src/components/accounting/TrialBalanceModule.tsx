import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/currencyFormat';
import { FileSpreadsheet, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useReportExport } from '@/hooks/useReportExport';

interface TrialBalanceRow {
  code: string;
  name: string;
  type: string;
  dr: number;
  cr: number;
  balance: number;
}

export const TrialBalanceModule: React.FC = () => {
  const [data, setData] = useState<TrialBalanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { exportReport, exporting } = useReportExport();

  useEffect(() => {
    loadTrialBalance();
  }, []);

  const loadTrialBalance = async () => {
    try {
      const { data: tbData, error } = await supabase
        .from('v_trial_balance')
        .select('*')
        .order('code');

      if (error) throw error;
      setData(tbData || []);
    } catch (error: any) {
      toast({
        title: 'Error loading trial balance',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totals = data.reduce((acc, row) => ({
    dr: acc.dr + (row.dr || 0),
    cr: acc.cr + (row.cr || 0),
  }), { dr: 0, cr: 0 });

  const isBalanced = Math.abs(totals.dr - totals.cr) < 0.01;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Trial Balance
            </CardTitle>
            <CardDescription>
              Summary of all account balances | {isBalanced ? '✓ Balanced' : '✗ Not Balanced'}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={exporting}
            onClick={() => exportReport({ reportType: 'trial_balance', format: 'excel' })}
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.code}>
                    <TableCell className="font-mono text-sm">{row.code}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-1 rounded bg-secondary">
                        {row.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {row.dr > 0 ? formatCurrency(row.dr) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {row.cr > 0 ? formatCurrency(row.cr) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatCurrency(Math.abs(row.balance))}
                      {row.balance < 0 ? ' CR' : row.balance > 0 ? ' DR' : ''}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted font-bold">
                  <TableCell colSpan={3}>TOTALS</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totals.dr)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totals.cr)}
                  </TableCell>
                  <TableCell className="text-right">
                    {isBalanced ? (
                      <span className="text-green-600">✓ BALANCED</span>
                    ) : (
                      <span className="text-destructive">✗ DIFF: {formatCurrency(Math.abs(totals.dr - totals.cr))}</span>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};