
import React, { useEffect } from 'react';
import { ReportGenerationControls } from './reports/ReportGenerationControls';
import { ReportDataDisplay } from './reports/ReportDataDisplay';
import { useReportData } from './reports/useReportData';

export const ReportsList: React.FC = () => {
  const {
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
  } = useReportData();

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      if ((ce as any).detail?.format) {
        handleExport((ce as any).detail.format);
      }
    };
    window.addEventListener('report-export', handler as EventListener);
    return () => window.removeEventListener('report-export', handler as EventListener);
  }, [handleExport]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-full md:col-span-1">
          <ReportGenerationControls
            selectedReport={selectedReport}
            onReportChange={setSelectedReport}
            dateRange={dateRange}
            onDateRangeChange={(value) => setDateRange(value as 'today' | 'week' | 'month' | 'custom')}
            customDateRange={customDateRange}
            onCustomDateRangeChange={setCustomDateRange}
            selectedCashier={selectedCashier}
            onCashierChange={setSelectedCashier}
            cashiers={cashiers}
            onGenerateReport={handleGenerateReport}
            onExport={handleExport}
            loading={loading}
          />
        </div>
        
        <div className="col-span-full md:col-span-2">
          <ReportDataDisplay
            loading={loading}
            reportData={reportData}
            totalItems={totalItems}
            reportType={selectedReport}
            pagination={pagination}
            reportTotals={reportTotals}
          />
        </div>
      </div>
    </div>
  );
};
