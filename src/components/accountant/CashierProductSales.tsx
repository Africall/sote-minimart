
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp, AlertCircle, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProductSalesData {
  product_id: string;
  product_name: string;
  quantity_sold: number;
  total_revenue: number;
  average_price: number;
  category: string;
}

interface CashierProductSalesProps {
  dateFilter: 'today' | 'yesterday' | 'week' | 'month' | 'custom';
}

export const CashierProductSales: React.FC<CashierProductSalesProps> = ({ dateFilter }) => {
  const [cashiers, setCashiers] = useState<{ id: string; name: string }[]>([]);
  const [selectedCashier, setSelectedCashier] = useState<string>('');
  const [productSales, setProductSales] = useState<ProductSalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCashiers();
  }, []);

  useEffect(() => {
    if (selectedCashier) {
      fetchProductSales();
    }
  }, [selectedCashier, dateFilter]);

  const fetchCashiers = async () => {
    try {
      console.log('CashierProductSales - Fetching cashiers from profiles...');
      
      // Get all cashiers from profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'cashier');

      if (profilesError) {
        console.error('CashierProductSales - Profiles query error:', profilesError);
        throw new Error(`Failed to fetch cashier profiles: ${profilesError.message}`);
      }

      console.log('CashierProductSales - Cashier profiles data:', profilesData);

      const cashierList = profilesData?.map(profile => ({
        id: profile.id,
        name: profile.name || `Cashier ${profile.id.slice(-4)}`
      })) || [];
      
      console.log('CashierProductSales - Final cashier list:', cashierList);
      setCashiers(cashierList);
      
      // Auto-select first cashier if available and no cashier is selected
      if (cashierList.length > 0 && !selectedCashier) {
        console.log('CashierProductSales - Auto-selecting first cashier:', cashierList[0]);
        setSelectedCashier(cashierList[0].id);
      }
    } catch (error: any) {
      console.error('CashierProductSales - Error fetching cashiers:', error);
      setError(error.message || 'Failed to load cashiers');
      toast.error('Failed to load cashiers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductSales = async () => {
    if (!selectedCashier) return;

    try {
      setLoading(true);
      setError(null);
      console.log('CashierProductSales - Fetching product sales for cashier:', selectedCashier, 'filter:', dateFilter);
      
      // Get date range
      const today = new Date();
      let startDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          break;
        case 'yesterday':
          startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
          break;
        case 'week':
          startDate = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
          break;
        case 'month':
          startDate = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
          break;
        default:
          startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      }

      const startDateStr = startDate.toISOString();
      const endDateStr = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();

      console.log('CashierProductSales - Date range:', startDateStr, 'to', endDateStr);

      // Get sales for the cashier first
      const { data: cashierSales, error: salesError } = await supabase
        .from('sales')
        .select('id')
        .eq('cashier_id', selectedCashier)
        .gte('created_at', startDateStr)
        .lt('created_at', endDateStr);

      if (salesError) {
        console.error('CashierProductSales - Sales query error:', salesError);
        throw new Error(`Failed to fetch sales: ${salesError.message}`);
      }

      const saleIds = cashierSales?.map(sale => sale.id) || [];
      
      if (saleIds.length === 0) {
        console.log('CashierProductSales - No sales found for cashier');
        setProductSales([]);
        return;
      }

      // Get product sales data for those sales
      const { data, error } = await supabase
        .from('sale_items')
        .select(`
          product_id,
          quantity,
          unit_price,
          total_price
        `)
        .in('sale_id', saleIds);

      if (error) {
        console.error('CashierProductSales - Sale items query error:', error);
        throw new Error(`Failed to fetch sale items: ${error.message}`);
      }

      // Get product details
      const productIds = Array.from(new Set(data?.map(item => item.product_id) || []));
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, category')
        .in('id', productIds);

      if (productsError) {
        console.error('CashierProductSales - Products query error:', productsError);
        throw new Error(`Failed to fetch products: ${productsError.message}`);
      }

      console.log('CashierProductSales - Product sales data fetched:', data?.length || 0, 'records');

      // Process the data
      const productMap = new Map<string, ProductSalesData>();
      const productsMap = new Map(productsData?.map(product => [product.id, product]) || []);

      data?.forEach(item => {
        const productId = item.product_id;
        const product = productsMap.get(productId);
        const productName = product?.name || `Product ${productId.slice(-4)}`;
        const category = product?.category || 'Unknown';
        
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            product_id: productId,
            product_name: productName,
            quantity_sold: 0,
            total_revenue: 0,
            average_price: 0,
            category
          });
        }

        const productData = productMap.get(productId)!;
        productData.quantity_sold += item.quantity || 0;
        productData.total_revenue += Number(item.total_price) || 0;
        productData.average_price = productData.total_revenue / productData.quantity_sold;
      });

      const result = Array.from(productMap.values()).sort((a, b) => b.quantity_sold - a.quantity_sold);
      console.log('CashierProductSales - Processed product sales:', result);
      setProductSales(result);

    } catch (error: any) {
      console.error('CashierProductSales - Error fetching product sales:', error);
      setError(error.message || 'Failed to load product sales data');
      toast.error('Failed to load product sales data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const downloadProductSales = () => {
    if (productSales.length === 0) {
      toast.error('No data to download');
      return;
    }

    const cashierName = cashiers.find(c => c.id === selectedCashier)?.name || 'Unknown';
    const period = dateFilter === 'today' ? 'Today' : 
                   dateFilter === 'yesterday' ? 'Yesterday' :
                   dateFilter === 'week' ? 'This Week' : 
                   dateFilter === 'month' ? 'This Month' : 'Custom Period';

    // Create CSV content
    const headers = ['Product Name', 'Category', 'Quantity Sold', 'Average Price', 'Total Revenue'];
    const csvContent = [
      `Cashier Product Sales Report - ${cashierName} (${period})`,
      `Generated on: ${new Date().toLocaleDateString()}`,
      '',
      headers.join(','),
      ...productSales.map(product => [
        `"${product.product_name}"`,
        `"${product.category}"`,
        product.quantity_sold,
        product.average_price.toFixed(2),
        product.total_revenue.toFixed(2)
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${cashierName}_product_sales_${dateFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Product sales report downloaded successfully');
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Food': 'bg-green-100 text-green-800',
      'Beverages': 'bg-blue-100 text-blue-800',
      'Electronics': 'bg-purple-100 text-purple-800',
      'Health': 'bg-red-100 text-red-800',
      'Beauty': 'bg-pink-100 text-pink-800',
      'Household': 'bg-yellow-100 text-yellow-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.default;
  };

  if (loading && cashiers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5 text-primary" />
            Products Sold by Cashier
          </CardTitle>
          <CardDescription>Loading cashier data...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5 text-primary" />
            Products Sold by Cashier
          </CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-red-600">
            <AlertCircle className="mr-2 h-5 w-5" />
            <span>{error}</span>
          </div>
          <div className="flex justify-center mt-4">
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="mr-2 h-5 w-5 text-primary" />
          Products Sold by Cashier
        </CardTitle>
        <CardDescription>
          View detailed product sales for individual cashiers ({dateFilter})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Select 
              value={selectedCashier} 
              onValueChange={(value) => {
                console.log('CashierProductSales - Cashier selection changed to:', value);
                setSelectedCashier(value);
              }}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a cashier" />
              </SelectTrigger>
               <SelectContent>
                 {(() => {
                   console.log('CashierProductSales - Rendering cashiers in dropdown:', cashiers);
                   return cashiers.length === 0 ? (
                     <SelectItem value="" disabled>No cashiers found</SelectItem>
                   ) : (
                     cashiers.map(cashier => (
                       <SelectItem key={cashier.id} value={cashier.id}>
                         {cashier.name}
                       </SelectItem>
                     ))
                   );
                 })()}
               </SelectContent>
            </Select>
            
            <Button onClick={fetchProductSales} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            
            <Button 
              onClick={downloadProductSales} 
              variant="outline" 
              size="sm"
              disabled={productSales.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : productSales.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-center text-muted-foreground">
                No product sales data available for the selected cashier and period
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Try selecting a different cashier or date range
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {productSales.map((product) => (
                <div key={product.product_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{product.product_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={getCategoryColor(product.category)}>
                            {product.category}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Avg: {formatCurrency(product.average_price)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl text-green-600">{formatCurrency(product.total_revenue)}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {product.quantity_sold} units sold
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
