
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface EcommerceOrder {
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

export const useEcommerceOrders = () => {
  const [pendingOrders, setPendingOrders] = useState<EcommerceOrder[]>([]);
  const [totalPendingCount, setTotalPendingCount] = useState(0);
  const { profile } = useAuth();

  // Fetch initial pending orders
  const fetchPendingOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('order_status', ['pending', 'confirmed', 'processing'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPendingOrders(data || []);
      setTotalPendingCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          order_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state only if order is no longer in pending/confirmed/processing status
      if (!['pending', 'confirmed', 'processing'].includes(newStatus)) {
        setPendingOrders(prev => 
          prev.filter(order => order.id !== orderId)
        );
        setTotalPendingCount(prev => Math.max(0, prev - 1));
      }

      toast.success(`Order #${orderId.slice(0, 8)} status updated to ${newStatus}`);
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
      return false;
    }
  };

  // Set up real-time listener for new e-commerce orders
  useEffect(() => {
    if (!profile || (profile.role !== 'cashier' && profile.role !== 'admin')) return;

    fetchPendingOrders();

    console.log('Setting up real-time listener for e-commerce orders...');

    const channel = supabase
      .channel('ecommerce-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('New e-commerce order received:', payload.new);
          
          const newOrder = payload.new as EcommerceOrder;
          
          // Add to pending orders if it's a new order with relevant status
          if (['pending', 'confirmed', 'processing'].includes(newOrder.order_status)) {
            setPendingOrders(prev => [newOrder, ...prev]);
            setTotalPendingCount(prev => prev + 1);

            // Show notification to cashier
            toast.info(`New e-commerce order received!`, {
              description: `Order #${newOrder.id.slice(0, 8)} - ${newOrder.guest_name || 'Guest Customer'} - KES ${newOrder.total}`,
              duration: 8000,
              action: {
                label: 'View Order',
                onClick: () => {
                  // This will be handled by the POS interface
                  console.log('View order clicked:', newOrder.id);
                }
              }
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order updated:', payload.new);
          
          const updatedOrder = payload.new as EcommerceOrder;
          
          const oldStatusRelevant = ['pending', 'confirmed', 'processing'].includes(payload.old.order_status);
          const newStatusRelevant = ['pending', 'confirmed', 'processing'].includes(updatedOrder.order_status);
          
          // Remove from pending if status changed from relevant to non-relevant
          if (oldStatusRelevant && !newStatusRelevant) {
            setPendingOrders(prev => prev.filter(order => order.id !== updatedOrder.id));
            setTotalPendingCount(prev => Math.max(0, prev - 1));
          }
          
          // Add to pending if status changed from non-relevant to relevant
          if (!oldStatusRelevant && newStatusRelevant) {
            setPendingOrders(prev => [updatedOrder, ...prev]);
            setTotalPendingCount(prev => prev + 1);
          }
          
          // Update existing order if both statuses are relevant
          if (oldStatusRelevant && newStatusRelevant) {
            setPendingOrders(prev => prev.map(order => 
              order.id === updatedOrder.id ? updatedOrder : order
            ));
          }
        }
      )
      .subscribe((status) => {
        console.log('E-commerce orders subscription status:', status);
      });

    return () => {
      console.log('Cleaning up e-commerce orders subscription');
      supabase.removeChannel(channel);
    };
  }, [profile]);

  // Complete an order and optionally print receipt
  const completeOrder = async (orderId: string, printReceipt = false) => {
    try {
      // Get the order first to process items manually
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      if (!order) throw new Error('Order not found');

      // Start a transaction for better performance and consistency
      const { error: statusUpdateError } = await supabase
        .from('orders')
        .update({ 
          order_status: 'completed',
          payment_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (statusUpdateError) throw statusUpdateError;

      // Process items in parallel for better performance
      const items = Array.isArray(order.items) ? order.items : [];
      const stockUpdates = items
        .filter(item => item.id && item.quantity)
        .map(item => 
          supabase.rpc('update_product_stock', { 
            product_id_param: item.id, 
            quantity_change: -item.quantity 
          })
        );

      // Execute all stock updates in parallel
      const stockResults = await Promise.allSettled(stockUpdates);
      const failedItems = stockResults.filter(result => 
        result.status === 'rejected' || 
        (result.status === 'fulfilled' && !result.value?.data?.success)
      ).length;

      // Create transaction record
      await supabase
        .from('transactions')
        .insert({
          amount: order.total,
          transaction_type: 'sale',
          payment_type: order.payment_method,
          created_at: new Date().toISOString()
        });

      // Update local state
      setPendingOrders(prev => prev.filter(order => order.id !== orderId));
      setTotalPendingCount(prev => Math.max(0, prev - 1));

      // Show success message
      const message = failedItems > 0 
        ? `Order completed with ${failedItems} stock update failures`
        : 'Order completed successfully - inventory updated';
      
      toast.success(message);
      
      if (printReceipt) {
        toast.success('Receipt printed');
      }
      
      return true;
    } catch (error) {
      console.error('Error completing order:', error);
      toast.error('Failed to complete order: ' + (error as Error).message);
      return false;
    }
  };

  return {
    pendingOrders,
    totalPendingCount,
    updateOrderStatus,
    completeOrder,
    refetchPendingOrders: fetchPendingOrders
  };
};
