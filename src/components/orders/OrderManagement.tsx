import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/usePagination';
import { useAuth } from '@/contexts/AuthContext';
import OrderCard from './OrderCard';
import OrderDetailsDialog from './OrderDetailsDialog';
import { Search, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Order {
  id: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  subtotal: number;
  delivery_fee: number;
  promo_discount: number;
  total: number;
  order_status: string;
  payment_status: string;
  payment_method: string;
  delivery_address: string;
  items: any;
  created_at: string;
  updated_at: string;
}

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    currentPage,
    totalPages,
    goToPage,
    goToNext,
    goToPrevious,
    canGoNext,
    canGoPrevious,
    getPagedData
  } = usePagination({
    totalItems: filteredOrders.length,
    itemsPerPage: 6,
    initialPage: 1
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      setDebugInfo('');
      console.log('Fetching orders from Supabase...');
      console.log('Current user authentication status:', user ? 'Authenticated' : 'Not authenticated');
      
      // Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session:', session ? 'Valid session found' : 'No valid session');
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setAuthError(`Authentication error: ${sessionError.message}`);
        return;
      }

      if (!session) {
        console.log('No active session - user needs to log in');
        setAuthError('You need to be logged in to view orders. Please log in and try again.');
        return;
      }

      // First, let's check if the orders table exists and get a simple count
      console.log('Checking orders table...');
      const { count, error: countError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error checking orders table:', countError);
        setDebugInfo(`Table access error: ${countError.message}`);
        if (countError.code === 'PGRST301') {
          setAuthError('Access denied: You do not have permission to view orders. Please contact an administrator.');
        } else if (countError.message.includes('JWT')) {
          setAuthError('Authentication expired. Please log in again.');
        } else {
          setAuthError(`Database error: ${countError.message}`);
        }
        return;
      }

      console.log(`Total orders in database: ${count}`);
      setDebugInfo(`Found ${count} total orders in database`);

      // Now fetch the actual orders
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST301') {
          setAuthError('Access denied: You do not have permission to view orders. Please contact an administrator.');
        } else if (error.message.includes('JWT')) {
          setAuthError('Authentication expired. Please log in again.');
        } else {
          setAuthError(`Database error: ${error.message}`);
        }
        throw error;
      }
      
      console.log('Orders fetched successfully:', data?.length || 0, 'orders');
      console.log('Sample order data:', data?.[0]);
      setOrders(data || []);
      setAuthError(null);
      
      if ((data?.length || 0) === 0) {
        setDebugInfo('No orders found in database. Orders may not have been created yet, or there might be Row Level Security policies preventing access.');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (!authError) {
        toast({
          title: 'Error',
          description: 'Failed to fetch orders from database',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  useEffect(() => {
    let filtered = orders;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.guest_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.order_status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      console.log(`Updating order ${orderId} status to ${newStatus}...`);
      
      // Update in Supabase first
      const { error } = await supabase
        .from('orders')
        .update({ 
          order_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log(`Order ${orderId} status updated successfully in Supabase`);

      // Update local state only after successful database update
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, order_status: newStatus, updated_at: new Date().toISOString() }
          : order
      ));

      // Update selected order if it's the one being modified
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? {
          ...prev,
          order_status: newStatus,
          updated_at: new Date().toISOString()
        } : null);
      }

      toast({
        title: 'Success',
        description: `Order status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status in database',
        variant: 'destructive',
      });
      
      // Refresh orders to ensure local state matches database
      fetchOrders();
    }
  };

  const handleProcessPayment = async (orderId: string) => {
    try {
      console.log(`Processing payment for order ${orderId}...`);
      
      // Update payment status in Supabase first
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('Supabase payment update error:', error);
        throw error;
      }

      console.log(`Payment for order ${orderId} processed successfully in Supabase`);

      // Update local state only after successful database update
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, payment_status: 'completed', updated_at: new Date().toISOString() }
          : order
      ));

      // Update selected order if it's the one being modified
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? {
          ...prev,
          payment_status: 'completed',
          updated_at: new Date().toISOString()
        } : null);
      }

      toast({
        title: 'Payment Confirmed',
        description: 'Payment has been successfully processed in the database',
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to process payment in database',
        variant: 'destructive',
      });
      
      // Refresh orders to ensure local state matches database
      fetchOrders();
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const pagedOrders = getPagedData(filteredOrders);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>
                Manage customer orders and process payments - synchronized with database
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchOrders}
              disabled={loading}
              title="Refresh orders from database"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {authError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}

          {debugInfo && !authError && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>{debugInfo}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name, email, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={!!authError}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter} disabled={!!authError}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading orders from database...</p>
            </div>
          ) : authError ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Unable to load orders due to authentication issues.</p>
            </div>
          ) : pagedOrders.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pagedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onViewDetails={handleViewDetails}
                    onUpdateStatus={handleUpdateStatus}
                    onProcessPayment={handleProcessPayment}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevious}
                    disabled={!canGoPrevious}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNext}
                    disabled={!canGoNext}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' ? 'No orders found matching your filters' : 'No orders found in database'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <p className="text-sm text-muted-foreground mt-2">
                  Orders will appear here once customers place them through your POS system or online store.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <OrderDetailsDialog
        order={selectedOrder}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default OrderManagement;
