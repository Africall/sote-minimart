import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarRange, Search, Package, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
interface CashierBreakdown {
  cashier_name: string;
  sales_count: number;
  revenue: number;
}
interface ProductSalesData {
  product_id: string;
  product_name: string;
  total_sales: number;
  total_revenue: number;
  cashier_breakdown: CashierBreakdown[];
}
export const ProductSalesWithCashierBreakdown: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState<ProductSalesData[]>([]);
  const handleSearch = async () => {
    try {
      setLoading(true);
      console.log('Searching with params:', {
        startDate,
        endDate,
        searchQuery
      });

      // Use the new function to get product sales with cashier breakdown
      const {
        data,
        error
      } = await supabase.rpc('get_product_sales_with_cashier_breakdown', {
        start_date_param: startDate,
        end_date_param: endDate,
        product_search: searchQuery || null
      });
      console.log('Product sales breakdown response:', {
        data,
        error
      });
      if (error) throw error;
      setSalesData(data || []);
      if (!data || data.length === 0) {
        toast.info('No sales data found for the selected criteria');
      } else {
        toast.success(`Found sales data for ${data.length} product(s)`);
      }
    } catch (error: any) {
      console.error('Error fetching product sales with cashier breakdown:', error);
      toast.error('Failed to fetch sales data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  const formatCashierBreakdown = (breakdown: CashierBreakdown[]) => {
    if (!breakdown || breakdown.length === 0) return 'No sales';
    return breakdown.map(cashier => `${cashier.cashier_name}(${cashier.sales_count})`).join(', ');
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Product Sales with Cashier Breakdown
        </CardTitle>
        <CardDescription>
          View product sales performance broken down by cashier
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="search">Search Product</Label>
            <Input
              id="search"
              placeholder="Enter product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSearch} disabled={loading} className="w-full">
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        {salesData.length > 0 && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead>Cashier Breakdown</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((product) => (
                  <TableRow key={product.product_id}>
                    <TableCell className="font-medium">{product.product_name}</TableCell>
                    <TableCell className="text-right">{product.total_sales}</TableCell>
                    <TableCell className="text-right">KES {product.total_revenue?.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.cashier_breakdown?.map((cashier, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {cashier.cashier_name}: {cashier.sales_count} sales (KES {cashier.revenue?.toFixed(2)})
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {salesData.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No sales data found. Try adjusting your search criteria.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};