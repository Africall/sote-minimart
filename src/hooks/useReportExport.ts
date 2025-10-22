import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExportParams {
  reportType: 'trial_balance' | 'income_statement' | 'balance_sheet' | 'vat_return' | 'cashbook';
  format: 'pdf' | 'excel';
  params?: {
    startDate?: string;
    endDate?: string;
    asOfDate?: string;
    accountCode?: string;
  };
}

export const useReportExport = () => {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const exportReport = async (exportParams: ExportParams) => {
    setExporting(true);
    try {
      console.log('Starting export with params:', exportParams);
      
      const { data, error } = await supabase.functions.invoke('export-report', {
        body: exportParams,
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data received from export function');
      }

      // Determine content type
      const contentType = exportParams.format === 'pdf' 
        ? 'application/pdf' 
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      // Handle different response types
      let blob: Blob;
      if (data instanceof Blob) {
        blob = data;
      } else if (typeof data === 'string') {
        // If data is base64 or plain text
        blob = new Blob([data], { type: contentType });
      } else if (data instanceof ArrayBuffer) {
        blob = new Blob([data], { type: contentType });
      } else {
        // If data is an object, convert to JSON for debugging
        console.log('Received data type:', typeof data, data);
        blob = new Blob([JSON.stringify(data)], { type: contentType });
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exportParams.reportType}_${new Date().toISOString().split('T')[0]}.${
        exportParams.format === 'pdf' ? 'pdf' : 'xlsx'
      }`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast({
        title: 'Export successful',
        description: `${exportParams.reportType.replace(/_/g, ' ')} has been downloaded`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: error.message || 'Failed to export report. Please try again.',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setExporting(false);
    }
  };

  return { exportReport, exporting };
};