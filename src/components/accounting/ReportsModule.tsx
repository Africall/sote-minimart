import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportToPDF, exportToExcel } from "@/utils/exportUtils";
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

  const handleExport = useCallback(
    async (exportFormat: "pdf" | "excel") => {
      if (!reportConfig || !reportData || reportData.length === 0) {
        toast.error("No data to export");
        return;
      }

      setIsExporting(true);
      try {
        const exportData = {
          title: reportConfig.name,
          subtitle:
            dateRange?.from && dateRange?.to
              ? `Period: ${format(dateRange.from, "MMM dd, yyyy")} - ${format(dateRange.to, "MMM dd, yyyy")}`
              : `Generated: ${format(new Date(), "MMM dd, yyyy")}`,
          data: reportData,
          columns: reportConfig.columns,
          filename: `${reportConfig.id}_${format(new Date(), "yyyy-MM-dd")}`,
        };

        if (exportFormat === "pdf") {
          exportToPDF(exportData);
        } else {
          exportToExcel(exportData);
        }

        toast.success(`Report exported as ${exportFormat.toUpperCase()}`);
      } catch (error) {
        console.error("Export error:", error);
        toast.error("Failed to export report");
      } finally {
        setIsExporting(false);
      }
    },
    [reportConfig, reportData, dateRange],
  );

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
              onClick={() => handleExport("pdf")}
              disabled={isExporting || isLoading || !reportData?.length}
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
              Export as PDF
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => handleExport("excel")}
              disabled={isExporting || isLoading || !reportData?.length}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              Export as Excel
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Preview</CardTitle>
          <CardDescription>
            {isLoading ? "Loading data..." : `${reportData?.length || 0} records found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : reportData && reportData.length > 0 ? (
            <div className="text-sm text-muted-foreground">
              Data loaded successfully. Click export buttons above to download the report.
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No data available for the selected criteria</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
