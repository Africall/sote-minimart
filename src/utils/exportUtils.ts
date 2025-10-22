import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

// Extend jsPDF interface to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ExportData {
  title: string;
  subtitle?: string;
  data: any[];
  columns: { key: string; header: string; width?: number }[];
  filename?: string;
}

export const exportToPDF = (exportData: ExportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Add title
  doc.setFontSize(16);
  doc.text(exportData.title, pageWidth / 2, 20, { align: 'center' });
  
  // Add subtitle if provided
  if (exportData.subtitle) {
    doc.setFontSize(12);
    doc.text(exportData.subtitle, pageWidth / 2, 30, { align: 'center' });
  }
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 40);
  
  // Prepare table data
  const tableData = exportData.data.map(row => 
    exportData.columns.map(col => row[col.key] || '')
  );
  
  // Add table
  doc.autoTable({
    head: [exportData.columns.map(col => col.header)],
    body: tableData,
    startY: 50,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 50 },
  });
  
  // Save PDF
  const filename = exportData.filename || `${exportData.title.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
};

export const exportToExcel = (exportData: ExportData) => {
  const workbook = XLSX.utils.book_new();
  
  // Convert data to worksheet format
  const worksheetData = [
    exportData.columns.map(col => col.header),
    ...exportData.data.map(row => 
      exportData.columns.map(col => row[col.key] || '')
    )
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Set column widths
  const columnWidths = exportData.columns.map(col => ({
    wch: col.width || 15
  }));
  worksheet['!cols'] = columnWidths;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  
  // Save Excel file
  const filename = exportData.filename || `${exportData.title.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

export const exportToCSV = (exportData: ExportData) => {
  const csvContent = [
    exportData.columns.map(col => col.header).join(','),
    ...exportData.data.map(row => 
      exportData.columns.map(col => {
        const value = row[col.key] || '';
        // Escape commas and quotes in CSV
        return typeof value === 'string' && value.includes(',') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const filename = exportData.filename || `${exportData.title.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Enhanced report data fetchers with real database integration
export const getFinancialReportData = async (reportType: string, dateRange: any) => {
  // This will be implemented to fetch real data from Supabase
  // For now, return sample structure that matches expected format
  const baseData = {
    title: getReportTitle(reportType),
    subtitle: `Period: ${dateRange ? 'Selected Range' : 'Current Month'}`,
    data: [],
    columns: getReportColumns(reportType),
  };
  
  return baseData;
};

const getReportTitle = (reportType: string): string => {
  const titles: { [key: string]: string } = {
    'income': 'Income Statement',
    'balance': 'Balance Sheet',
    'cashflow': 'Cash Flow Statement',
    'tax': 'Tax Summary Report',
    'aging': 'Invoice Aging Report',
  };
  return titles[reportType] || 'Financial Report';
};

const getReportColumns = (reportType: string) => {
  const columnSets: { [key: string]: any[] } = {
    'income': [
      { key: 'account', header: 'Account', width: 20 },
      { key: 'amount', header: 'Amount (KES)', width: 15 },
    ],
    'balance': [
      { key: 'account', header: 'Account', width: 20 },
      { key: 'amount', header: 'Amount (KES)', width: 15 },
    ],
    'cashflow': [
      { key: 'category', header: 'Category', width: 20 },
      { key: 'amount', header: 'Amount (KES)', width: 15 },
    ],
    'tax': [
      { key: 'tax_type', header: 'Tax Type', width: 20 },
      { key: 'amount', header: 'Amount (KES)', width: 15 },
    ],
    'aging': [
      { key: 'invoice_id', header: 'Invoice ID', width: 15 },
      { key: 'supplier', header: 'Supplier', width: 20 },
      { key: 'amount', header: 'Amount (KES)', width: 15 },
      { key: 'days_overdue', header: 'Days Overdue', width: 12 },
    ],
  };
  
  return columnSets[reportType] || [
    { key: 'description', header: 'Description', width: 25 },
    { key: 'amount', header: 'Amount (KES)', width: 15 },
  ];
};