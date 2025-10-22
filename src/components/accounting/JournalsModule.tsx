import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/currencyFormat';
import { FileText, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Journal {
  id: string;
  jdate: string;
  ref: string;
  memo: string;
  source: string;
  locked: boolean;
  posted_at: string;
}

interface JournalLine {
  id: string;
  account_id: string;
  dr: number;
  cr: number;
  account_code?: string;
  account_name?: string;
}

export const JournalsModule: React.FC = () => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [expandedJournal, setExpandedJournal] = useState<string | null>(null);
  const [journalLines, setJournalLines] = useState<Record<string, JournalLine[]>>({});
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadJournals();
  }, []);

  const loadJournals = async () => {
    try {
      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .order('jdate', { ascending: false })
        .order('posted_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setJournals(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading journals',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadJournalLines = async (journalId: string) => {
    try {
      const { data, error } = await supabase
        .from('journal_lines')
        .select(`
          *,
          accounts!inner(code, name)
        `)
        .eq('journal_id', journalId);

      if (error) throw error;

      const lines = (data || []).map(line => ({
        ...line,
        account_code: (line as any).accounts?.code,
        account_name: (line as any).accounts?.name,
      }));

      setJournalLines(prev => ({ ...prev, [journalId]: lines }));
    } catch (error: any) {
      toast({
        title: 'Error loading journal lines',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleJournal = (journalId: string) => {
    if (expandedJournal === journalId) {
      setExpandedJournal(null);
    } else {
      setExpandedJournal(journalId);
      if (!journalLines[journalId]) {
        loadJournalLines(journalId);
      }
    }
  };

  const postAllSales = async () => {
    setPosting(true);
    try {
      // First, get all sale IDs that have already been posted
      const { data: postedJournals, error: journalsError } = await supabase
        .from('journals')
        .select('source_id')
        .eq('source', 'SALE');

      if (journalsError) throw journalsError;

      const postedSaleIds = new Set(postedJournals?.map(j => j.source_id) || []);

      // Get all completed sales
      const { data: allSales, error: salesError } = await supabase
        .from('sales')
        .select('id')
        .eq('payment_status', 'completed');

      if (salesError) throw salesError;

      // Filter out sales that have already been posted
      const unpostedSales = (allSales || []).filter(sale => !postedSaleIds.has(sale.id));

      if (unpostedSales.length === 0) {
        toast({
          title: 'No unposted sales',
          description: 'All sales transactions have already been posted to journals.',
        });
        return;
      }

      let posted = 0;
      let failed = 0;

      // Post each sale to journals
      for (const sale of unpostedSales) {
        try {
          const { error } = await supabase.rpc('post_sale_journal', {
            p_sale_id: sale.id,
          });

          if (error) {
            console.error(`Failed to post sale ${sale.id}:`, error);
            failed++;
          } else {
            posted++;
          }
        } catch (err) {
          console.error(`Error posting sale ${sale.id}:`, err);
          failed++;
        }
      }

      toast({
        title: 'Sales posted to journals',
        description: `Successfully posted ${posted} sales. ${failed > 0 ? `Failed: ${failed}` : ''}`,
        variant: failed > 0 ? 'destructive' : 'default',
      });

      // Reload journals to show new entries
      loadJournals();
    } catch (error: any) {
      toast({
        title: 'Error posting sales',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setPosting(false);
    }
  };

  const getSourceBadgeColor = (source: string) => {
    const colors: Record<string, string> = {
      SALE: 'bg-green-500',
      PURCHASE: 'bg-blue-500',
      EXPENSE: 'bg-orange-500',
      SHIFT: 'bg-purple-500',
      ADJUST: 'bg-yellow-500',
      RECON: 'bg-pink-500',
    };
    return colors[source] || 'bg-gray-500';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Journal Entries
            </CardTitle>
            <CardDescription>
              All accounting transactions | Showing last 50 entries
            </CardDescription>
          </div>
          <Button
            onClick={postAllSales}
            disabled={posting}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${posting ? 'animate-spin' : ''}`} />
            {posting ? 'Posting...' : 'Post All Sales'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : journals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No journal entries found
          </div>
        ) : (
          <div className="space-y-2">
            {journals.map((journal) => {
              const isExpanded = expandedJournal === journal.id;
              const lines = journalLines[journal.id] || [];
              const totalDR = lines.reduce((sum, l) => sum + (l.dr || 0), 0);
              const totalCR = lines.reduce((sum, l) => sum + (l.cr || 0), 0);
              const balanced = Math.abs(totalDR - totalCR) < 0.01;

              return (
                <div key={journal.id} className="border rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto hover:bg-muted"
                    onClick={() => toggleJournal(journal.id)}
                  >
                    <div className="flex items-center gap-4">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold">
                            {format(new Date(journal.jdate), 'MMM dd, yyyy')}
                          </span>
                          <Badge className={getSourceBadgeColor(journal.source)}>
                            {journal.source}
                          </Badge>
                          {journal.locked && <Badge variant="secondary">LOCKED</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {journal.ref && `Ref: ${journal.ref}`} | {journal.memo}
                        </div>
                      </div>
                    </div>
                  </Button>

                  {isExpanded && (
                    <div className="border-t">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Account</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lines.map((line) => (
                            <TableRow key={line.id}>
                              <TableCell>
                                <div className="font-mono text-sm">{line.account_code}</div>
                                <div className="text-sm text-muted-foreground">{line.account_name}</div>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {line.dr > 0 ? formatCurrency(line.dr) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {line.cr > 0 ? formatCurrency(line.cr) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="font-bold bg-muted">
                            <TableCell>
                              {balanced ? '✓ BALANCED' : '✗ NOT BALANCED'}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(totalDR)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(totalCR)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};