
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarRange, Download, Loader2 } from 'lucide-react';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { reports } from './reportConfig';
import { DateRange } from 'react-day-picker';

interface ReportGenerationControlsProps {
  selectedReport: string;
  onReportChange: (value: string) => void;
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  customDateRange?: DateRange;
  onCustomDateRangeChange?: (range: DateRange | undefined) => void;
  selectedCashier: string;
  onCashierChange: (value: string) => void;
  cashiers: Array<{ id: string; name: string }>;
  onGenerateReport: () => void;
  onExport: (format: 'excel' | 'pdf') => void;
  loading: boolean;
}

export const ReportGenerationControls: React.FC<ReportGenerationControlsProps> = ({
  selectedReport,
  onReportChange,
  dateRange,
  onDateRangeChange,
  customDateRange,
  onCustomDateRangeChange,
  selectedCashier,
  onCashierChange,
  cashiers,
  onGenerateReport,
  onExport,
  loading
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Generate Report</CardTitle>
        <CardDescription>Select report type and parameters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Report Type</label>
          <Select value={selectedReport} onValueChange={onReportChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              {reports.map(report => (
                <SelectItem key={report.id} value={report.id}>
                  {report.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Date Range</label>
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
            <Select value={dateRange} onValueChange={onDateRangeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {dateRange === 'custom' && onCustomDateRangeChange && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Custom Date Range</label>
            <DatePickerWithRange
              date={customDateRange}
              setDate={onCustomDateRangeChange}
              placeholder="Select date range"
            />
          </div>
        )}

        {selectedReport === 'sales' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Cashier (Optional)</label>
            <Select value={selectedCashier} onValueChange={onCashierChange}>
              <SelectTrigger>
                <SelectValue placeholder="All cashiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cashiers</SelectItem>
                {cashiers.map(cashier => (
                  <SelectItem key={cashier.id} value={cashier.id}>
                    {cashier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <Button className="w-full" onClick={onGenerateReport} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Generate Report
        </Button>
        
        <div className="flex gap-2 justify-center pt-2">
          <Button variant="outline" size="sm" onClick={() => onExport('excel')}>
            <Download className="h-4 w-4 mr-1" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport('pdf')}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
