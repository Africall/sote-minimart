import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import {
  getSalesAnalytics,
  getInventoryValue,
  getSales,
  getLowStockProducts,
  formatCurrency,
  getExpiringProducts
} from '@/utils/supabaseUtils';
import { Sale, Product } from '@/utils/supabaseUtils';
import OrderManagement from '@/components/orders/OrderManagement';

const DashboardPage = () => {
  const { profile } = useAuth();
  const [salesData, setSalesData] = useState<{
    totalSales: number;
    transactionCount: number;
    averageSale: number;
  }>({ totalSales: 0, transactionCount: 0, averageSale: 0 });
  const [inventoryValue, setInventoryValue] = useState<{ totalCostValue: number; totalSellingValue: number }>({ totalCostValue: 0, totalSellingValue: 0 });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
  const [expiringItems, setExpiringItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date; }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [analytics, inventory, sales, lowStock, expiring] = await Promise.all([
        getSalesAnalytics(dateRange.from, dateRange.to),
        getInventoryValue(),
        getSales(dateRange.from, dateRange.to),
        getLowStockProducts(),
        getExpiringProducts(30)
      ]);
      setSalesData(analytics);
      setInventoryValue(inventory);
      setRecentSales(sales.slice(0, 5));
      setLowStockItems(lowStock);
      setExpiringItems(expiring);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page header + actions */}
      <div className="page-surface p-4 md:p-6 hover-lift">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Welcome, {profile?.name || 'Admin'}</h1>
            <p className="text-sm text-muted-foreground">Overview of sales and inventory performance</p>
          </div>
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="gradient" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(dateRange.from, 'MMM d, yyyy')} – {format(dateRange.to, 'MMM d, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from && range?.to) setDateRange({ from: range.from, to: range.to });
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="gradient"
              size="icon"
              onClick={fetchDashboardData}
              disabled={loading}
              aria-label="Refresh"
              className="hover-scale"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            <Button variant="gradient-accent" className="hover-scale">
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="rounded-xl bg-muted/60 p-1">
          <TabsTrigger
            value="overview"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:font-semibold"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:font-semibold"
          >
            Order Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card variant="elevated" className="hover-lift">
              <CardHeader>
                <CardTitle>Total Sales</CardTitle>
                <CardDescription>
                  {format(dateRange.from, 'MMM d')} – {format(dateRange.to, 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-royal-blue-600">
                  {loading ? 'Loading…' : formatCurrency(salesData.totalSales)}
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="hover-lift">
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>
                  {format(dateRange.from, 'MMM d')} – {format(dateRange.to, 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-royal-blue-600">
                  {loading ? 'Loading…' : salesData.transactionCount}
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="hover-lift">
              <CardHeader>
                <CardTitle>Average Sale</CardTitle>
                <CardDescription>
                  {format(dateRange.from, 'MMM d')} – {format(dateRange.to, 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-royal-blue-600">
                  {loading ? 'Loading…' : formatCurrency(Number(salesData.averageSale))}
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated" className="hover-lift">
              <CardHeader>
                <CardTitle>Inventory Value</CardTitle>
                <CardDescription>Total cost value</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-royal-blue-600">
                  {loading ? 'Loading…' : formatCurrency(Number(inventoryValue.totalCostValue))}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card variant="interactive" className="col-span-1 animate-slide-up">
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>Latest transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground">Loading…</p>
                ) : recentSales.length > 0 ? (
                  <div className="space-y-4">
                    {recentSales.map((sale) => (
                      <div key={sale.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-medium">Sale #{sale.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(sale.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-royal-blue-600">
                            {formatCurrency(Number(sale.total_amount))}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {sale.sale_items?.length || 0} items
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No recent sales data available</p>
                )}
              </CardContent>
            </Card>

            <Card
              variant="interactive"
              className="col-span-1 animate-slide-up border border-vibrant-red-50 hover:shadow-glow-secondary"
            >
              <CardHeader>
                <CardTitle>Low Stock Items</CardTitle>
                <CardDescription>Items below reorder level</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground">Loading…</p>
                ) : lowStockItems.length > 0 ? (
                  <div className="space-y-4">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Current stock: {item.stock_quantity}
                          </p>
                          <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-vibrant-red-600">
                            Reorder level: {item.reorder_level}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(Number(item.cost))} per unit
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No low stock items to display</p>
                )}
              </CardContent>
            </Card>

            <Card
              variant="interactive"
              className="col-span-1 animate-slide-up border border-vibrant-red-50 hover:shadow-glow-secondary"
            >
              <CardHeader>
                <CardTitle>Expiring Soon</CardTitle>
                <CardDescription>Items expiring in 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground">Loading…</p>
                ) : expiringItems.length > 0 ? (
                  <div className="space-y-4">
                    {expiringItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Expires: {new Date(item.expiry_date!).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">Stock: {item.stock_quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-vibrant-red-600">
                            {Math.ceil(
                              (new Date(item.expiry_date!).getTime() - new Date().getTime()) /
                              (1000 * 60 * 60 * 24)
                            )} days left
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(Number(item.cost))} per unit
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No items expiring soon</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <OrderManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
