
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Package, AlertCircle } from 'lucide-react';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { format, parseISO, isValid } from 'date-fns';//here
import { formatCurrency } from '@/utils/supabaseUtils';

interface ReportDataDisplayProps {
  loading: boolean;
  reportData: any[];
  totalItems: number;
  reportType: string;
  pagination: {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    startIndex: number;
    endIndex: number;
    goToPage: (page: number) => void;
  };
  reportTotals?: {
    totalAmount: number;
    totalTransactions: number;
  };
}

function safeFormatDate(input: string | Date | null | undefined, fmt = 'MMM dd, yyyy') {
  if (!input) return '—';
  const d =
    input instanceof Date
      ? input
      : typeof input === 'string'
        ? parseISO(input)
        : null;

  return d && isValid(d) ? format(d, fmt) : '—';
}

const renderSalesTable = (data: any[], totals?: { totalAmount: number; totalTransactions: number }) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product Name</TableHead>
          <TableHead>Cashier</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Payment Method</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((sale: any) => (
          <TableRow key={sale.id}>
            <TableCell className="font-medium">
              {sale.product_name || 'Multiple Items'}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {sale.cashier_name?.charAt(0) || 'U'}
                </div>
                <span className="font-medium">{sale.cashier_name || 'Unknown'}</span>
              </div>
            </TableCell>
            <TableCell>{safeFormatDate(sale.created_at)}</TableCell>
            <TableCell>
              <Badge variant="outline">{sale.payment_method}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={sale.payment_status === 'completed' ? 'default' : 'secondary'}>
                {sale.payment_status}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(Number(sale.total_amount) || 0)}
            </TableCell>
          </TableRow>
        ))}
        {totals && (
          <TableRow className="bg-muted/50 font-semibold border-t-2">
            <TableCell colSpan={4} className="text-right font-bold">
              TOTALS:
            </TableCell>
            <TableCell className="text-center">
              <Badge variant="default" className="font-semibold">
                {totals.totalTransactions} Sale{totals.totalTransactions !== 1 ? 's' : ''}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-bold text-lg text-green-600">
              {formatCurrency(totals.totalAmount)}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
);

const renderExpensesTable = (data: any[]) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Recorded By</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((expense: any) => (
          <TableRow key={expense.id}>
            <TableCell className="font-medium">{expense.title}</TableCell>
            <TableCell>
              <Badge variant="outline">{expense.category}</Badge>
            </TableCell>
            <TableCell>{safeFormatDate(expense.expense_date)}</TableCell>
            <TableCell>{expense.profiles?.name || 'System'}</TableCell>
            <TableCell className="text-right font-medium text-red-600">
              -{formatCurrency(Number(expense.amount) || 0)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const renderInventoryStats = (data: any[]) => {
  if (!data[0]) return null;
  const stats = data[0];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-md">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold">{formatCurrency(Number(stats.inventory_value) || 0)}</p>
              <p className="text-sm text-muted-foreground">Total Inventory Value</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-md">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold">{stats.low_stock_count || 0}</p>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-md">
              <Package className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold">{stats.expiring_count || 0}</p>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const ReportDataDisplay: React.FC<ReportDataDisplayProps> = ({
  loading,
  reportData,
  totalItems,
  reportType,
  pagination,
  reportTotals
}) => {
  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading report data...</span>
        </div>
      );
    }

    if (reportData.length === 0) {
      return (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm text-muted-foreground">
            No data found for the selected report and date range
          </p>
        </div>
      );
    }

    switch (reportType) {
      case 'sales':
        return renderSalesTable(reportData, reportTotals);
      case 'expenses':
        return renderExpensesTable(reportData);
      case 'stock':
        return renderInventoryStats(reportData);
      default:
        return renderSalesTable(reportData, reportTotals);
    }
  };
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Report Results</CardTitle>
        <CardDescription>
          {totalItems > 0 ? `Showing ${totalItems} record${totalItems !== 1 ? 's' : ''}` : 'No data available'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {renderReportContent()}
          
          {totalItems > 10 && reportType !== 'stock' && (
            <DataTablePagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={pagination.goToPage}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
