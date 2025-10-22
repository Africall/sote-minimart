import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { FileText, CalendarIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { exportToPDF, exportToExcel, exportToCSV } from '@/utils/exportUtils';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const reportTypes = [
  { id: 'income', name: 'Income Statement', description: 'Profit & Loss summary' },
  { id: 'balance', name: 'Balance Sheet', description: 'Financial position' },
  { id: 'sales', name: 'Sales Report', description: 'Detailed sales analysis' },
  { id: 'expenses', name: 'Expense Report', description: 'Expense breakdown' },
  { id: 'aging', name: 'Invoice Aging', description: 'Overdue invoices analysis' },
];

export const EnhancedReportsModule: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState('income');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      // Fetch real data based on report type
      const { data, error } = await supabase
        .from(selectedReport === 'expenses' ? 'expenses' : 'transactions')
        .select('*')
        .limit(100);
      
      if (error) throw error;
      
      setReportData({ data: data || [], summary: { totalRecords: data?.length || 0 } });
      toast({
        title: 'Report Generated',
        description: 'Financial report generated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (exportFormat: 'pdf' | 'excel' | 'csv') => {
    try {
      setLoading(true);
      
      if (!reportData) {
        await handleGenerateReport();
      }

      const exportData = {
        title: reportTypes.find(r => r.id === selectedReport)?.name || 'Financial Report',
        subtitle: 'Generated Report',
        data: reportData?.data || [],
        columns: [
          { key: 'id', header: 'ID', width: 15 },
          { key: 'amount', header: 'Amount (KES)', width: 15 },
          { key: 'created_at', header: 'Date', width: 15 },
        ],
      };
      
      if (exportFormat === 'pdf') {
        exportToPDF(exportData);
      } else if (exportFormat === 'excel') {
        exportToExcel(exportData);
      } else {
        exportToCSV(exportData);
      }
      
      toast({
        title: 'Export Successful',
        description: `Report exported as ${exportFormat.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Financial Reports</h2>
          <p className="text-muted-foreground">Generate comprehensive financial reports</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Report Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedReport} onValueChange={setSelectedReport}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Date Range</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, "PPP") : "From Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Generate</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={handleGenerateReport}
              disabled={loading}
            >
              <FileText className="h-4 w-4 mr-2" />
              {loading ? 'Generating...' : 'Generate'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-3 gap-1">
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={loading}>
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('excel')} disabled={loading}>
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={loading}>
                CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Report Results</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Generated {reportData.data.length} records successfully.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};