import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarRange, Search, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CashierBreakdown {
  cashier_id: string;
  cashier_name: string;
  sales_count: number;
  revenue: number;
}

interface ProductSalesData {
  product_id: string;
  product_name: string;
  total_quantity_sold: number;
  total_revenue: number;
  sale_count: number;
  avg_price: number;
  cashier_breakdown?: CashierBreakdown[];
}

const ProductSalesSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState<ProductSalesData[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a product name or barcode');
      return;
    }

    try {
      setLoading(true);

      // First find the product(s) matching the search query
      const { data: products, error: productError } = await supabase
        .from('products')
        .select('id, name')
        .or(`name.ilike.%${searchQuery}%,barcode.cs.{${searchQuery}}`);

      if (productError) throw productError;
      if (!products || products.length === 0) {
        toast.error('No products found matching your search');
        setSalesData([]);
        return;
      }

      // Get sales data for the found products within the date range
      const productIds = products.map(p => p.id);
      const { data: salesItems, error: salesError } = await supabase
        .from('sale_items')
        .select(`
          product_id,
          quantity,
          unit_price,
          total_price,
          products!inner(name),
          sales!inner(created_at, cashier_id)
        `)
        .in('product_id', productIds)
        .gte('sales.created_at', startDate + 'T00:00:00.000Z')
        .lte('sales.created_at', endDate + 'T23:59:59.999Z');

      if (salesError) throw salesError;

      // Aggregate the sales data
      const aggregatedData: { [key: string]: ProductSalesData } = {};
      const cashierBreakdownMap: Record<string, Record<string, { sales_count: number; revenue: number }>> = {};

      salesItems?.forEach((item: any) => {
        const productId = item.product_id;
        const productName = String(
          item.products && typeof item.products === 'object' && 'name' in item.products 
            ? item.products.name 
            : 'Unknown Product'
        );

        if (!aggregatedData[productId]) {
          aggregatedData[productId] = {
            product_id: productId,
            product_name: productName,
            total_quantity_sold: 0,
            total_revenue: 0,
            sale_count: 0,
            avg_price: 0,
            cashier_breakdown: []
          };
        }

        aggregatedData[productId].total_quantity_sold += item.quantity || 0;
        aggregatedData[productId].total_revenue += item.total_price || 0;
        aggregatedData[productId].sale_count += 1;

        // Track cashier breakdown
        const cashierId = item?.sales?.cashier_id as string | null;
        if (cashierId) {
          if (!cashierBreakdownMap[productId]) cashierBreakdownMap[productId] = {};
          if (!cashierBreakdownMap[productId][cashierId]) {
            cashierBreakdownMap[productId][cashierId] = { sales_count: 0, revenue: 0 };
          }
          cashierBreakdownMap[productId][cashierId].sales_count += 1;
          cashierBreakdownMap[productId][cashierId].revenue += item.total_price || 0;
        }
      });

      // Calculate average prices
      Object.values(aggregatedData).forEach(data => {
        data.avg_price = data.total_quantity_sold > 0 ? data.total_revenue / data.total_quantity_sold : 0;
      });

      // Get cashier names
      const cashierIds = Array.from(new Set(Object.values(cashierBreakdownMap).flatMap(m => Object.keys(m))));
      let cashierNameMap: Record<string, string> = {};
      
      if (cashierIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', cashierIds);
        
        if (profilesError) throw profilesError;
        cashierNameMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p.name || 'Unknown Cashier']));
      }

      // Enrich data with cashier breakdown
      const enrichedData = Object.values(aggregatedData).map((d) => ({
        ...d,
        cashier_breakdown: cashierBreakdownMap[d.product_id]
          ? Object.entries(cashierBreakdownMap[d.product_id]).map(([cashier_id, stats]) => ({
              cashier_id,
              cashier_name: cashierNameMap[cashier_id] || 'Unknown Cashier',
              sales_count: (stats as any).sales_count,
              revenue: (stats as any).revenue,
            }))
          : [],
      }));

      setSalesData(enrichedData as ProductSalesData[]);
      
      if (enrichedData.length === 0) {
        toast.info('No sales found for this product in the selected date range');
      } else {
        toast.success(`Found sales data for ${enrichedData.length} product(s)`);
      }
    } catch (error: any) {
      console.error('Error searching product sales:', error);
      toast.error('Failed to search product sales: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="mr-2 h-5 w-5 text-primary" />
          Product Sales Search
        </CardTitle>
        <CardDescription>
          Search for specific product sales data within a date range with cashier breakdown
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Product Name/Barcode</Label>
            <Input
              id="search"
              placeholder="Enter product name or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date</Label>
            <div className="relative">
              <CalendarRange className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="start_date"
                type="date"
                className="pl-10"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="end_date">End Date</Label>
            <div className="relative">
              <CalendarRange className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="end_date"
                type="date"
                className="pl-10"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-end">
            <Button 
              onClick={handleSearch} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        {salesData.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-right">Total Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Sales Count</TableHead>
                  <TableHead className="text-right">Avg Price</TableHead>
                  <TableHead>Cashier Breakdown</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((item) => (
                  <TableRow key={item.product_id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell className="text-right">{item.total_quantity_sold}</TableCell>
                    <TableCell className="text-right">KES {item.total_revenue.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{item.sale_count}</TableCell>
                    <TableCell className="text-right">KES {item.avg_price.toFixed(2)}</TableCell>
                    <TableCell>
                      {item.cashier_breakdown && item.cashier_breakdown.length > 0
                        ? item.cashier_breakdown.map(cb => 
                            `${cb.cashier_name}: ${cb.sales_count} (KES ${cb.revenue.toFixed(2)})`
                          ).join(', ')
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {salesData.length === 0 && !loading && (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No sales data</p>
            <p className="text-sm text-muted-foreground">
              Search for products to see their sales data with cashier breakdown
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { ProductSalesSearch };