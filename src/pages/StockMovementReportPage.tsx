import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar,
  Download,
  Search,
  FileText,
  Loader2,
  TrendingUp,
  TrendingDown,
  Package,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface StockMovementData {
  product_id: string;
  product_name: string;
  category: string;
  total_purchased: number;
  total_sold: number;
  remaining_stock: number;
  unit_cost: number;
  selling_price: number;
  stock_value: number;
}

interface TransactionDetail {
  date: string;
  type: 'purchase' | 'sale';
  quantity: number;
  unit_price: number;
  total: number;
  reference: string;
  cashier_name?: string;
  cashier_id?: string;
}

const StockMovementReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<StockMovementData[]>([]);
  const [filteredData, setFilteredData] = useState<StockMovementData[]>([]);
  const [startDate, setStartDate] = useState<string>(
    format(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      'yyyy-MM-dd'
    )
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] =
    useState<StockMovementData | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<
    TransactionDetail[]
  >([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterData();
  }, [searchQuery, reportData]);

  /**
   * NEW: Fetch stock movement from the Postgres function
   * get_stock_movement_report(start_date, end_date)
   */
  const fetchReportData = async () => {
  setLoading(true);

  try {
    // Call the DB function with date params (strings like '2025-11-01' are fine)
    const { data, error } = await supabase.rpc('get_stock_movement_report', {
      start_date: startDate, // 'yyyy-MM-dd'
      end_date: endDate,     // 'yyyy-MM-dd'
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      throw error;
    }

    // Map raw rows into your StockMovementData shape
    const mapped: StockMovementData[] = (data || []).map((row: any) => ({
      product_id: row.product_id,
      product_name: row.product_name,
      category: row.category,
      total_purchased: Number(row.total_purchased ?? 0),
      total_sold: Number(row.total_sold ?? 0),
      remaining_stock: Number(row.remaining_stock ?? 0),
      unit_cost: Number(row.unit_cost ?? 0),
      selling_price: Number(row.selling_price ?? 0),
      stock_value: Number(row.stock_value ?? 0),
    }));

    // Sort alphabetically by product name for consistency
    mapped.sort((a, b) => a.product_name.localeCompare(b.product_name));

    setReportData(mapped);
    setFilteredData(mapped);

    toast.success('Report generated successfully');
  } catch (err: any) {
    console.error('Error fetching report data:', err);
    toast.error(err?.message || 'Failed to generate report');
    setReportData([]);
    setFilteredData([]);
  } finally {
    setLoading(false);
  }
};



  const filterData = () => {
    if (!searchQuery) {
      setFilteredData(reportData);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = reportData.filter(
      (item) =>
        item.product_name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
    setFilteredData(filtered);
  };

  const fetchTransactionDetails = async (productId: string) => {
    setDetailsLoading(true);
    try {
      // Purchases
      const { data: purchases, error: purchaseError } = await supabase
        .from('invoice_line_items')
        .select(
          `
          quantity,
          unit_cost,
          invoices!inner(issue_date, id)
        `
        )
        .eq('product_id', productId)
        .gte('invoices.issue_date', startDate)
        .lte('invoices.issue_date', endDate);

      if (purchaseError) throw purchaseError;

      // Sales with cashier info
      const { data: sales, error: saleError } = await supabase
        .from('sale_items')
        .select(
          `
          quantity,
          unit_price,
          sales!inner(created_at, id, cashier_id)
        `
        )
        .eq('product_id', productId)
        .gte('sales.created_at', `${startDate}T00:00:00`)
        .lte('sales.created_at', `${endDate}T23:59:59`);

      if (saleError) throw saleError;

      // Unique cashier IDs
      const cashierIds = Array.from(
        new Set(
          sales?.map((s: any) => s.sales.cashier_id).filter(Boolean) || []
        )
      );

      // Cashier profiles
      let cashierProfiles: any[] = [];
      if (cashierIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', cashierIds);

        if (!profilesError && profiles) {
          cashierProfiles = profiles;
        }
      }

      const cashierMap = new Map(
        cashierProfiles.map((profile) => [profile.id, profile.name])
      );

      const details: TransactionDetail[] = [];

      // Purchases
      purchases?.forEach((p: any) => {
        details.push({
          date: p.invoices.issue_date,
          type: 'purchase',
          quantity: Number(p.quantity),
          unit_price: Number(p.unit_cost),
          total: Number(p.quantity) * Number(p.unit_cost),
          reference: p.invoices.id.substring(0, 8),
        });
      });

      // Sales
      sales?.forEach((s: any) => {
        const cashierId = s.sales.cashier_id;
        const cashierName = cashierId
          ? cashierMap.get(cashierId) ||
            `Cashier ${cashierId.slice(-4)}`
          : 'Unknown';

        details.push({
          date: s.sales.created_at,
          type: 'sale',
          quantity: Number(s.quantity),
          unit_price: Number(s.unit_price),
          total: Number(s.quantity) * Number(s.unit_price),
          reference: s.sales.id.substring(0, 8),
          cashier_name: cashierName,
          cashier_id: cashierId,
        });
      });

      details.sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setTransactionDetails(details);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      toast.error('Failed to fetch transaction details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewDetails = async (product: StockMovementData) => {
    setSelectedProduct(product);
    setShowDetailsDialog(true);
    await fetchTransactionDetails(product.product_id);
  };

  const exportToExcel = () => {
    try {
      const exportData = filteredData.map((item) => ({
        'Product Name': item.product_name,
        Category: item.category,
        'Total Purchased': item.total_purchased,
        'Total Sold': item.total_sold,
        'Remaining Stock': item.remaining_stock,
        'Unit Cost (KSh)': item.unit_cost,
        'Selling Price (KSh)': item.selling_price,
        'Stock Value (KSh)': item.stock_value.toFixed(2),
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Stock Movement Report');

      const totals = {
        'Product Name': 'TOTALS',
        Category: '',
        'Total Purchased': filteredData.reduce(
          (sum, item) => sum + item.total_purchased,
          0
        ),
        'Total Sold': filteredData.reduce(
          (sum, item) => sum + item.total_sold,
          0
        ),
        'Remaining Stock': filteredData.reduce(
          (sum, item) => sum + item.remaining_stock,
          0
        ),
        'Unit Cost (KSh)': '',
        'Selling Price (KSh)': '',
        'Stock Value (KSh)': filteredData
          .reduce((sum, item) => sum + item.stock_value, 0)
          .toFixed(2),
      };
      XLSX.utils.sheet_add_json(ws, [totals], {
        skipHeader: true,
        origin: -1,
      });

      XLSX.writeFile(
        wb,
        `Stock_Movement_Report_${format(
          new Date(),
          'yyyy-MM-dd'
        )}.xlsx`
      );
      toast.success('Report exported to Excel');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export report');
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text('Stock Movement Report', 14, 20);

      doc.setFontSize(10);
      doc.text(
        `Period: ${format(
          new Date(startDate),
          'MMM dd, yyyy'
        )} - ${format(new Date(endDate), 'MMM dd, yyyy')}`,
        14,
        28
      );

      const tableData = filteredData.map((item) => [
        item.product_name,
        item.category,
        item.total_purchased,
        item.total_sold,
        item.remaining_stock,
        `KSh ${item.unit_cost.toFixed(2)}`,
        `KSh ${item.selling_price.toFixed(2)}`,
        `KSh ${item.stock_value.toFixed(2)}`,
      ]);

      tableData.push([
        'TOTALS',
        '',
        filteredData
          .reduce((sum, item) => sum + item.total_purchased, 0)
          .toString(),
        filteredData
          .reduce((sum, item) => sum + item.total_sold, 0)
          .toString(),
        filteredData
          .reduce((sum, item) => sum + item.remaining_stock, 0)
          .toString(),
        '',
        '',
        `KSh ${filteredData
          .reduce((sum, item) => sum + item.stock_value, 0)
          .toFixed(2)}`,
      ]);

      (doc as any).autoTable({
        head: [
          [
            'Product',
            'Category',
            'Purchased',
            'Sold',
            'Stock',
            'Unit Cost',
            'Selling Price',
            'Stock Value',
          ],
        ],
        body: tableData,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [220, 38, 38] },
      });

      doc.save(
        `Stock_Movement_Report_${format(
          new Date(),
          'yyyy-MM-dd'
        )}.pdf`
      );
      toast.success('Report exported to PDF');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Failed to export report');
    }
  };

  const exportToCSV = () => {
    try {
      const headers = [
        'Product Name',
        'Category',
        'Total Purchased',
        'Total Sold',
        'Remaining Stock',
        'Unit Cost (KSh)',
        'Selling Price (KSh)',
        'Stock Value (KSh)',
      ];
      const rows = filteredData.map((item) => [
        item.product_name,
        item.category,
        item.total_purchased,
        item.total_sold,
        item.remaining_stock,
        item.unit_cost,
        item.selling_price,
        item.stock_value.toFixed(2),
      ]);

      rows.push([
        'TOTALS',
        '',
        filteredData
          .reduce((sum, item) => sum + item.total_purchased, 0)
          .toString(),
        filteredData
          .reduce((sum, item) => sum + item.total_sold, 0)
          .toString(),
        filteredData
          .reduce((sum, item) => sum + item.remaining_stock, 0)
          .toString(),
        '',
        '',
        filteredData
          .reduce((sum, item) => sum + item.stock_value, 0)
          .toFixed(2),
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.join(','))
        .join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Stock_Movement_Report_${format(
        new Date(),
        'yyyy-MM-dd'
      )}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Report exported to CSV');
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error('Failed to export report');
    }
  };

  const totalPurchased = filteredData.reduce(
    (sum, item) => sum + item.total_purchased,
    0
  );
  const totalSold = filteredData.reduce(
    (sum, item) => sum + item.total_sold,
    0
  );
  const totalStock = filteredData.reduce(
    (sum, item) => sum + item.remaining_stock,
    0
  );
  const totalValue = filteredData.reduce(
    (sum, item) => sum + item.stock_value,
    0
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Stock Movement Report
          </h1>
          <p className="text-muted-foreground">
            Track product quantities purchased versus sold
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Purchased
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPurchased.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Units purchased
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sold
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSold.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Units sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Stock
            </CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalStock.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Units in stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Stock Value
            </CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KSh{' '}
              {totalValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Total inventory value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">
                Search Product/Category
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                onClick={fetchReportData}
                className="w-full"
                disabled={loading}
              >
                {loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={exportToExcel}
          variant="outline"
          size="sm"
        >
          <Download className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
        <Button
          onClick={exportToPDF}
          variant="outline"
          size="sm"
        >
          <Download className="mr-2 h-4 w-4" />
          Export to PDF
        </Button>
        <Button
          onClick={exportToCSV}
          variant="outline"
          size="sm"
        >
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Movement Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-lg text-primary">
                  Loading report...
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">
                      Purchased
                    </TableHead>
                    <TableHead className="text-right">
                      Sold
                    </TableHead>
                    <TableHead className="text-right">
                      Stock
                    </TableHead>
                    <TableHead className="text-right">
                      Unit Cost
                    </TableHead>
                    <TableHead className="text-right">
                      Selling Price
                    </TableHead>
                    <TableHead className="text-right">
                      Stock Value
                    </TableHead>
                    <TableHead className="text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-10"
                      >
                        No data available for the selected period
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filteredData.map((item) => (
                        <TableRow key={item.product_id}>
                          <TableCell className="font-medium">
                            {item.product_name}
                          </TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell className="text-right text-green-600 font-semibold">
                            {item.total_purchased.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-semibold">
                            {item.total_sold.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-blue-600 font-semibold">
                            {item.remaining_stock.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            KSh{' '}
                            {item.unit_cost.toLocaleString(
                              undefined,
                              { minimumFractionDigits: 2 }
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            KSh{' '}
                            {item.selling_price.toLocaleString(
                              undefined,
                              { minimumFractionDigits: 2 }
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            KSh{' '}
                            {item.stock_value.toLocaleString(
                              undefined,
                              { minimumFractionDigits: 2 }
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleViewDetails(item)
                              }
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={2}>
                          TOTALS
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {totalPurchased.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {totalSold.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-blue-600">
                          {totalStock.toLocaleString()}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right">
                          KSh{' '}
                          {totalValue.toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 }
                          )}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Transaction History:{' '}
              {selectedProduct?.product_name}
            </DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Purchased
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedProduct?.total_purchased}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Sold
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {selectedProduct?.total_sold}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Current Stock
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedProduct?.remaining_stock}
                  </p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Cashier/Source</TableHead>
                    <TableHead className="text-right">
                      Quantity
                    </TableHead>
                    <TableHead className="text-right">
                      Unit Price
                    </TableHead>
                    <TableHead className="text-right">
                      Total
                    </TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionDetails.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-10"
                      >
                        No transactions found for the selected
                        period
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactionDetails.map((detail, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {format(
                                new Date(detail.date),
                                'MMM dd, yyyy'
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(
                                new Date(detail.date),
                                'HH:mm:ss'
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              detail.type === 'purchase'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {detail.type.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>
                          {detail.type === 'sale' &&
                          detail.cashier_name ? (
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {detail.cashier_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Cashier
                              </span>
                            </div>
                          ) : detail.type === 'purchase' ? (
                            <span className="text-muted-foreground">
                              Supplier
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span
                            className={
                              detail.type === 'purchase'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }
                          >
                            {detail.type === 'purchase'
                              ? '+'
                              : '-'}
                            {detail.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          KSh{' '}
                          {detail.unit_price.toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 }
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          KSh{' '}
                          {detail.total.toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 }
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {detail.reference}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockMovementReportPage;
