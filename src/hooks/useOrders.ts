import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Order {
  id: string;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  delivery_address: string;
  items: any[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  order_status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('order_status', ['pending', 'processing'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          order_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, order_status: newStatus, updated_at: new Date().toISOString() }
            : order
        ).filter(order => ['pending', 'processing'].includes(order.order_status))
      );

      toast.success(`Order status updated to ${newStatus}`);
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
      return false;
    }
  };

  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription for order updates
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        console.log('Order update received:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newOrder = payload.new as Order;
          if (['pending', 'processing'].includes(newOrder.order_status)) {
            setOrders(prev => [newOrder, ...prev]);
            toast.info(`New order received: #${newOrder.id.slice(0, 8)}`);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedOrder = payload.new as Order;
          setOrders(prev => 
            prev.map(order => 
              order.id === updatedOrder.id ? updatedOrder : order
            ).filter(order => ['pending', 'processing'].includes(order.order_status))
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    orders,
    loading,
    updateOrderStatus,
    refetchOrders: fetchOrders
  };
};