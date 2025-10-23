import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface ReportConfig {
  id: string;
  name: string;
  description: string;
  table: string;
  columns: Array<{ key: string; header: string; width?: number }>;
}

const reportConfigs: ReportConfig[] = [
  {
    id: "sales",
    name: "Sales Report",
    description: "Detailed sales transactions",
    table: "sales",
    columns: [
      { key: "created_at", header: "Date", width: 15 },
      { key: "total_amount", header: "Amount (KES)", width: 15 },
      { key: "payment_method", header: "Payment Method", width: 15 },
      { key: "payment_status", header: "Status", width: 15 },
    ],
  },
  {
    id: "expenses",
    name: "Expense Report",
    description: "All business expenses",
    table: "expenses",
    columns: [
      { key: "expense_date", header: "Date", width: 15 },
      { key: "title", header: "Description", width: 25 },
      { key: "category", header: "Category", width: 15 },
      { key: "amount", header: "Amount (KES)", width: 15 },
    ],
  },
  {
    id: "invoices",
    name: "Invoice Report",
    description: "Supplier invoices overview",
    table: "invoices",
    columns: [
      { key: "issue_date", header: "Issue Date", width: 15 },
      { key: "supplier_name", header: "Supplier", width: 20 },
      { key: "total_amount", header: "Amount (KES)", width: 15 },
      { key: "status", header: "Status", width: 15 },
    ],
  },
];

export const ReportsModule: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string>("sales");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isExporting, setIsExporting] = useState(false);

  const reportConfig = reportConfigs.find((r) => r.id === selectedReport);

  // Optimized data fetching with React Query
  const {
    data: reportData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["report-data", selectedReport, dateRange],
    queryFn: async () => {
      if (!reportConfig) return [];

      let query = supabase.from(reportConfig.table).select("*");

      // Apply date filters
      if (dateRange?.from) {
        const dateField =
          reportConfig.id === "expenses"
            ? "expense_date"
            : reportConfig.id === "invoices"
              ? "issue_date"
              : "created_at";
        query = query.gte(dateField, format(dateRange.from, "yyyy-MM-dd"));
      }
      if (dateRange?.to) {
        const dateField =
          reportConfig.id === "expenses"
            ? "expense_date"
            : reportConfig.id === "invoices"
              ? "issue_date"
              : "created_at";
        query = query.lte(dateField, format(dateRange.to, "yyyy-MM-dd"));
      }

      const { data, error } = await query.order("created_at", { ascending: false }).limit(1000);
      if (error) throw error;
      return data || [];
    },
    enabled: !!reportConfig,
    staleTime: 30000,
  });

  const formatCellValue = (value: any, key: string) => {
    if (!value && value !== 0) return '-';
    
    // Format dates
    if (key.includes('date') || key === 'created_at') {
      try {
        return format(new Date(value), 'MMM dd, yyyy');
      } catch (e) {
        return value;
      }
    }
    
    // Format amounts
    if (key.includes('amount') || key.includes('total')) {
      const num = typeof value === 'number' ? value : parseFloat(value);
      return isNaN(num) ? value : `KSh ${num.toFixed(2)}`;
    }
    
    return value;
  };

  const handleExportExcel = useCallback(async () => {
    if (!reportConfig || !reportData || reportData.length === 0) {
      toast.error("No data to export");
      return;
    }

    setIsExporting(true);
    try {
      console.log('Starting Excel export...', { dataLength: reportData.length });

      // Prepare worksheet data
      const worksheetData = [
        // Header row
        reportConfig.columns.map(col => col.header),
        // Data rows
        ...reportData.map(row => 
          reportConfig.columns.map(col => {
            let value = row[col.key];
            
            // Format dates
            if (col.key.includes('date') || col.key === 'created_at') {
              try {
                value = value ? format(new Date(value), 'MMM dd, yyyy') : '';
              } catch (e) {
                value = value || '';
              }
            }
            
            // Format amounts - keep as numbers for Excel
            if (col.key.includes('amount') || col.key.includes('total')) {
              value = typeof value === 'number' ? value : (value || 0);
            }
            
            return value || '';
          })
        )
      ];

      console.log('Worksheet data prepared', { rows: worksheetData.length });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Set column widths
      worksheet['!cols'] = reportConfig.columns.map(col => ({ wch: col.width || 15 }));
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

      // Generate filename with .xlsx extension
      const filename = `${reportConfig.id}_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      console.log('Generating Excel file:', filename);

      // Write to binary string then create blob for better browser compatibility
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename; // Explicitly set filename with extension
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Report exported as ${filename}`);
      console.log('Excel export completed successfully');
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error(`Failed to export Excel: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExporting(false);
    }
  }, [reportConfig, reportData]);

  const handleExportCSV = useCallback(async () => {
    if (!reportConfig || !reportData || reportData.length === 0) {
      toast.error("No data to export");
      return;
    }

    setIsExporting(true);
    try {
      console.log('Starting CSV export...', { dataLength: reportData.length });

      // Create CSV content with BOM for Excel compatibility
      const BOM = '\uFEFF';
      const csvRows = [
        // Header row
        reportConfig.columns.map(col => col.header).join(','),
        // Data rows
        ...reportData.map(row => 
          reportConfig.columns.map(col => {
            let value = row[col.key];
            
            // Format dates
            if (col.key.includes('date') || col.key === 'created_at') {
              try {
                value = value ? format(new Date(value), 'MMM dd, yyyy') : '';
              } catch (e) {
                value = value || '';
              }
            }
            
            // Format amounts
            if (col.key.includes('amount') || col.key.includes('total')) {
              value = typeof value === 'number' ? value.toFixed(2) : (value || '0.00');
            }
            
            // Escape commas and quotes for CSV
            const strValue = String(value || '');
            if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
              return `"${strValue.replace(/"/g, '""')}"`;
            }
            return strValue;
          }).join(',')
        )
      ];

      const csvContent = BOM + csvRows.join('\n');
      console.log('CSV content prepared', { rows: csvRows.length });

      // Generate filename with .csv extension
      const filename = `${reportConfig.id}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      console.log('Generating CSV file:', filename);

      // Create blob with proper MIME type
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = filename; // Explicitly set filename with extension
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Report exported as ${filename}`);
      console.log('CSV export completed successfully');
    } catch (error) {
      console.error("CSV export error:", error);
      toast.error(`Failed to export CSV: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExporting(false);
    }
  }, [reportConfig, reportData]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Financial Reports</h2>
        <p className="text-muted-foreground">Generate and export comprehensive financial reports</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Report Type</CardTitle>
            <CardDescription>Select the report you want to generate</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedReport} onValueChange={setSelectedReport}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportConfigs.map((config) => (
                  <SelectItem key={config.id} value={config.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{config.name}</span>
                      <span className="text-xs text-muted-foreground">{config.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Date Range</CardTitle>
            <CardDescription>Filter by date range (optional)</CardDescription>
          </CardHeader>
          <CardContent>
            <DatePickerWithRange date={dateRange} setDate={setDateRange} placeholder="Select date range" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Export Report</CardTitle>
            <CardDescription>Download in your preferred format</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full"
              onClick={handleExportExcel}
              disabled={isExporting || isLoading || !reportData?.length}
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
              Export as Excel (.xlsx)
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={handleExportCSV}
              disabled={isExporting || isLoading || !reportData?.length}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Export as CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Preview</CardTitle>
          <CardDescription>
            {isLoading 
              ? "Loading data..." 
              : reportData && reportData.length > 0
                ? `${reportData.length} record${reportData.length !== 1 ? 's' : ''} found • Showing first ${Math.min(reportData.length, 100)}`
                : "No records found"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading report data...</p>
            </div>
          ) : !reportData || reportData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="rounded-full bg-muted p-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium">No data available</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  No records found for the selected criteria. Try adjusting your report type or date range filters.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              {reportConfig?.id === 'sales' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Sales</p>
                    <p className="text-lg font-semibold">
                      KSh {reportData.reduce((sum, row) => sum + (parseFloat(row.total_amount) || 0), 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Transactions</p>
                    <p className="text-lg font-semibold">{reportData.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg. Sale</p>
                    <p className="text-lg font-semibold">
                      KSh {(reportData.reduce((sum, row) => sum + (parseFloat(row.total_amount) || 0), 0) / reportData.length).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
              {reportConfig?.id === 'expenses' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Expenses</p>
                    <p className="text-lg font-semibold">
                      KSh {reportData.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Items</p>
                    <p className="text-lg font-semibold">{reportData.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg. Expense</p>
                    <p className="text-lg font-semibold">
                      KSh {(reportData.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0) / reportData.length).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
              {reportConfig?.id === 'invoices' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                    <p className="text-lg font-semibold">
                      KSh {reportData.reduce((sum, row) => sum + (parseFloat(row.total_amount) || 0), 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Invoices</p>
                    <p className="text-lg font-semibold">{reportData.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-lg font-semibold">
                      {reportData.filter(row => row.status === 'pending' || row.status === 'unpaid').length}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Data Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-auto max-h-[400px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted z-10">
                      <TableRow>
                        {reportConfig?.columns.map((col) => (
                          <TableHead key={col.key} className="font-semibold whitespace-nowrap">
                            {col.header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.slice(0, 100).map((row, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/50">
                          {reportConfig?.columns.map((col) => (
                            <TableCell key={col.key} className="whitespace-nowrap">
                              {formatCellValue(row[col.key], col.key)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {reportData.length > 100 && (
                  <div className="text-center py-3 text-xs text-muted-foreground bg-muted/50 border-t">
                    Showing first 100 of {reportData.length} records • Export to download all data
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};