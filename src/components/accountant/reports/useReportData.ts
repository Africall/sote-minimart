
import { useState, useEffect } from 'react';
import { getPaginatedSales, getPaginatedExpenses, getLiveInventoryAnalytics } from '@/utils/reportUtils';
import { usePagination } from '@/hooks/usePagination';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency } from '@/utils/supabaseUtils';
import { DateRange } from 'react-day-picker';

export const useReportData = () => {
  const [selectedReport, setSelectedReport] = useState<string>('sales');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [dateRange, setDateRange] = useState('today');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedCashier, setSelectedCashier] = useState('all');
  const [cashiers, setCashiers] = useState<Array<{ id: string; name: string }>>([]);

  const pagination = usePagination({
    totalItems,
    itemsPerPage: 10,
    initialPage: 1
  });

  const getDateRangeParams = () => {
    const today = new Date();
    
    // Use custom date range if available
    if (dateRange === 'custom' && customDateRange?.from && customDateRange?.to) {
      const startOfDay = new Date(customDateRange.from);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(customDateRange.to);
      endOfDay.setHours(23, 59, 59, 999);
      return {
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString()
      };
    }
    
    switch (dateRange) {
      case 'today': {
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        return {
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString()
        };
      }
      case 'week': {
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        return {
          startDate: startDate.toISOString(),
          endDate: endOfDay.toISOString()
        };
      }
      case 'month': {
        const startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        return {
          startDate: startDate.toISOString(),
          endDate: endOfDay.toISOString()
        };
      }
      default: {
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        return {
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString()
        };
      }
    }
  };

  // Fetch cashiers for filtering
  const fetchCashiers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'cashier');
      
      if (error) throw error;
      setCashiers(data || []);
    } catch (error) {
      console.error('Error fetching cashiers:', error);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const dateParams = getDateRangeParams();
      
      switch (selectedReport) {
        case 'sales':
          const salesResponse = await getPaginatedSales(
            { page: pagination.currentPage, limit: pagination.itemsPerPage },
            dateParams,
            selectedCashier === 'all' ? undefined : selectedCashier
          );
          setReportData(salesResponse.data || []);
          setTotalItems(salesResponse.count || 0);
          break;
          
        case 'expenses':
          const expensesResponse = await getPaginatedExpenses(
            { page: pagination.currentPage, limit: pagination.itemsPerPage },
            dateParams
          );
          setReportData(expensesResponse.data || []);
          setTotalItems(expensesResponse.count || 0);
          break;
          
        case 'stock':
          const inventoryData = await getLiveInventoryAnalytics();
          setReportData(inventoryData ? [inventoryData] : []);
          setTotalItems(inventoryData ? 1 : 0);
          break;
          
        default:
          console.warn('Unknown report type:', selectedReport);
          setReportData([]);
          setTotalItems(0);
      }
    } catch (error: any) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
      // Set safe fallback values
      setReportData([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    fetchReportData();
    toast.success('Report generated successfully');
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    if (reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      if (format === 'excel') {
        exportToExcel();
      } else {
        exportToPDF();
      }
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export report as ${format.toUpperCase()}`);
    }
  };

  const exportToExcel = () => {
    let exportData: any[] = [];
    
    switch (selectedReport) {
      case 'sales':
        exportData = reportData.map(sale => ({
          'Product Name': sale.product_name || 'Multiple Items',
          'Cashier': sale.cashier_name || 'Unknown',
          'Date': new Date(sale.created_at).toLocaleString(),
          'Payment Method': sale.payment_method,
          'Status': sale.payment_status,
          'Amount': sale.total_amount
        }));
        break;
      case 'expenses':
        exportData = reportData.map(expense => ({
          'Title': expense.title,
          'Category': expense.category,
          'Date': new Date(expense.expense_date).toLocaleDateString(),
          'Recorded By': expense.profiles?.name || 'System',
          'Amount': expense.amount
        }));
        break;
      default:
        exportData = reportData;
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedReport);
    XLSX.writeFile(wb, `${selectedReport}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(`${selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report`, 20, 20);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 35);
    
    let tableData: any[] = [];
    let headers: string[] = [];
    
    switch (selectedReport) {
      case 'sales':
        headers = ['Product Name', 'Cashier', 'Date', 'Payment Method', 'Amount'];
        tableData = reportData.map(sale => [
          sale.product_name || 'Multiple Items',
          sale.cashier_name || 'Unknown',
          new Date(sale.created_at).toLocaleDateString(),
          sale.payment_method,
          formatCurrency(Number(sale.total_amount) || 0)
        ]);
        break;
case 'expenses':
        headers = ['Title', 'Category', 'Date', 'Amount'];
        tableData = reportData.map(expense => [
          expense.title,
          expense.category,
          new Date(expense.expense_date).toLocaleDateString(),
          formatCurrency(Number(expense.amount) || 0)
        ]);
        break;
    }

    if (tableData.length > 0) {
      (doc as any).autoTable({
        head: [headers],
        body: tableData,
        startY: 50,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] }
      });
    }
    
    doc.save(`${selectedReport}_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  useEffect(() => {
    fetchCashiers();
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (isMounted) {
        try {
          await fetchReportData();
        } catch (error) {
          console.error('Error in fetchData effect:', error);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [selectedReport, dateRange, selectedCashier, pagination.currentPage]);

  return {
    selectedReport,
    setSelectedReport,
    loading,
    reportData,
    totalItems,
    dateRange,
    setDateRange,
    customDateRange,
    setCustomDateRange,
    selectedCashier,
    setSelectedCashier,
    cashiers,
    pagination,
    handleGenerateReport,
    handleExport
  };
};
