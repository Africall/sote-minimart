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

type DateParams = { startDate: string; endDate: string };

type PaginatedFn<T, A extends any[]> = (
  pageArgs: { page: number; limit: number },
  dateParams: DateParams,
  ...args: A
) => Promise<{ data: T[]; count: number }>;

export const useReportData = () => {
  const [selectedReport, setSelectedReport] = useState<string>('sales');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [reportTotals, setReportTotals] = useState<{ totalAmount: number; totalTransactions: number } | undefined>(undefined);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedCashier, setSelectedCashier] = useState('all');
  const [cashiers, setCashiers] = useState<Array<{ id: string; name: string }>>([]);

  const pagination = usePagination({
    totalItems,
    itemsPerPage: 10,
    initialPage: 1
  });

  // ---------- date helpers ----------
  const getDateRangeParams = (): DateParams => {
    const today = new Date();

    if (dateRange === 'custom' && customDateRange?.from && customDateRange?.to) {
      const startOfDay = new Date(customDateRange.from);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(customDateRange.to);
      endOfDay.setHours(23, 59, 59, 999);
      return { startDate: startOfDay.toISOString(), endDate: endOfDay.toISOString() };
    }

    switch (dateRange) {
      case 'today': {
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        return { startDate: startOfDay.toISOString(), endDate: endOfDay.toISOString() };
      }
      case 'week': {
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        return { startDate: startDate.toISOString(), endDate: endOfDay.toISOString() };
      }
      case 'month': {
        const startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        return { startDate: startDate.toISOString(), endDate: endOfDay.toISOString() };
      }
      default: {
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        return { startDate: startOfDay.toISOString(), endDate: endOfDay.toISOString() };
      }
    }
  };

  // ---------- fetch cashiers for filter ----------
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

  // ---------- page-limited fetch for the table ----------
  const fetchReportData = async () => {
    try {
      setLoading(true);
      const dateParams = getDateRangeParams();

      switch (selectedReport) {
        case 'sales': {
          const salesResponse = await getPaginatedSales(
            { page: pagination.currentPage, limit: pagination.itemsPerPage },
            dateParams,
            selectedCashier === 'all' ? undefined : selectedCashier
          );
          setReportData(salesResponse.data || []);
          setTotalItems(salesResponse.count || 0);
          
          // Calculate totals for all sales (not just current page)
          const allSalesForTotals = await fetchAllSales(dateParams);
          const totalAmount = allSalesForTotals.reduce((sum, sale) => sum + (Number(sale.total_amount) || 0), 0);
          const totalTransactions = allSalesForTotals.length;
          setReportTotals({ totalAmount, totalTransactions });
          break;
        }
        case 'expenses': {
          const expensesResponse = await getPaginatedExpenses(
            { page: pagination.currentPage, limit: pagination.itemsPerPage },
            dateParams
          );
          setReportData(expensesResponse.data || []);
          setTotalItems(expensesResponse.count || 0);
          setReportTotals(undefined);
          break;
        }
        case 'stock': {
          const inventoryData = await getLiveInventoryAnalytics();
          setReportData(inventoryData ? [inventoryData] : []);
          setTotalItems(inventoryData ? 1 : 0);
          setReportTotals(undefined);
          break;
        }
        default: {
          console.warn('Unknown report type:', selectedReport);
          setReportData([]);
          setTotalItems(0);
          setReportTotals(undefined);
        }
      }
    } catch (error: any) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
      setReportData([]);
      setTotalItems(0);
      setReportTotals(undefined);
    } finally {
      setLoading(false);
    }
  };

  // ---------- fetch-all helpers for export ----------
  async function fetchAllPages<T, A extends any[]>(
    fn: PaginatedFn<T, A>,
    dateParams: DateParams,
    ...extraArgs: A
  ): Promise<T[]> {
    const pageSize = 1000; // big page to reduce round trips
    let page = 1;
    let total = 0;
    const all: T[] = [];

    // first page
    const first = await fn({ page, limit: pageSize }, dateParams, ...extraArgs);
    all.push(...(first.data || []));
    total = first.count || all.length;

    // remaining pages
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    for (page = 2; page <= totalPages; page++) {
      const res = await fn({ page, limit: pageSize }, dateParams, ...extraArgs);
      all.push(...(res.data || []));
    }

    return all;
  }

  async function fetchAllSales(dateParams: DateParams) {
    return fetchAllPages(
      getPaginatedSales,
      dateParams,
      selectedCashier === 'all' ? undefined : selectedCashier
    );
  }

  async function fetchAllExpenses(dateParams: DateParams) {
    return fetchAllPages(getPaginatedExpenses, dateParams);
  }

  // ---------- public actions ----------
  const handleGenerateReport = () => {
    fetchReportData();
    toast.success('Report generated successfully');
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const dateParams = getDateRangeParams();

      // Prepare full dataset (not paginated)
      let allRows: any[] = [];
      if (selectedReport === 'sales') {
        allRows = await fetchAllSales(dateParams);
      } else if (selectedReport === 'expenses') {
        allRows = await fetchAllExpenses(dateParams);
      } else if (selectedReport === 'stock') {
        const one = await getLiveInventoryAnalytics();
        allRows = one ? [one] : [];
      } else {
        allRows = [];
      }

      if (allRows.length === 0) {
        toast.error('No data to export');
        return;
      }

      if (format === 'excel') {
        exportAllToExcel(selectedReport, allRows);
      } else {
        exportAllToPDF(selectedReport, allRows);
      }

      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to export report');
    }
  };

  // ---------- exporters (use ALL rows passed in) ----------
  function exportAllToExcel(report: string, rows: any[]) {
    let exportData: any[] = [];

    switch (report) {
      case 'sales': {
        exportData = rows.map((sale) => ({
          'Product Name': sale.product_name ?? 'Multiple Items',
          'Cashier': sale.cashier_name ?? 'Unknown',
          'Date': new Date(sale.created_at).toLocaleString(),
          'Payment Method': sale.payment_method ?? '',
          'Status': sale.payment_status ?? '',
          'Amount': sale.total_amount ?? 0
        }));
        
        // Add totals row
        const totalAmount = rows.reduce((sum, sale) => sum + (Number(sale.total_amount) || 0), 0);
        const totalTransactions = rows.length;
        
        exportData.push({
          'Product Name': '',
          'Cashier': '',
          'Date': '',
          'Payment Method': '',
          'Status': `TOTAL (${totalTransactions} Sales)`,
          'Amount': totalAmount
        });
        break;
      }
      case 'expenses':
        exportData = rows.map((expense) => ({
          'Title': expense.title ?? '',
          'Category': expense.category ?? '',
          'Date': expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : '',
          'Recorded By': expense.profiles?.name ?? 'System',
          'Amount': expense.amount ?? 0
        }));
        break;
      case 'stock':
        // Flatten/shape as you need for inventory analytics
        exportData = rows;
        break;
      default:
        exportData = rows;
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, report);
    const fileDate = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${report}_report_${fileDate}.xlsx`);
  }

  function exportAllToPDF(report: string, rows: any[]) {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text(`${report.charAt(0).toUpperCase() + report.slice(1)} Report`, 20, 20);

    // Generated time
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 35);

    let headers: string[] = [];
    let tableData: any[][] = [];

    switch (report) {
      case 'sales': {
        headers = ['Product Name', 'Cashier', 'Date', 'Payment Method', 'Amount'];
        tableData = rows.map((sale) => [
          sale.product_name ?? 'Multiple Items',
          sale.cashier_name ?? 'Unknown',
          sale.created_at ? new Date(sale.created_at).toLocaleDateString() : '',
          sale.payment_method ?? '',
          formatCurrency(Number(sale.total_amount) || 0)
        ]);
        break;
      }
      case 'expenses': {
        headers = ['Title', 'Category', 'Date', 'Amount'];
        tableData = rows.map((expense) => [
          expense.title ?? '',
          expense.category ?? '',
          expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : '',
          formatCurrency(Number(expense.amount) || 0)
        ]);
        break;
      }
      case 'stock': {
        // Minimal example: print JSON lines; adapt to your stock columns as needed
        headers = ['Field', 'Value'];
        tableData = Object.entries(rows[0] || {}).map(([k, v]) => [k, String(v ?? '')]);
        break;
      }
      default: {
        // Fallback generic
        headers = Object.keys(rows[0] || {});
        tableData = rows.map((r) => headers.map((h) => r[h] ?? ''));
      }
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

    const fileDate = new Date().toISOString().split('T')[0];
    doc.save(`${report}_report_${fileDate}.pdf`);
  }

  // ---------- effects ----------
  useEffect(() => {
    fetchCashiers();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) return;
      try {
        await fetchReportData();
      } catch (error) {
        console.error('Error in fetchData effect:', error);
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
    reportTotals,
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
