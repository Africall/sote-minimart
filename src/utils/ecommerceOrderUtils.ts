
import { supabase } from '@/integrations/supabase/client';

export interface EcommerceOrderData {
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  items: any[];
  subtotal: number;
  delivery_fee?: number;
  promo_discount?: number;
  total: number;
  delivery_address: string;
  payment_method: string;
  payment_status?: string;
  order_status?: string;
}

/**
 * Function to insert an e-commerce order into Supabase
 * This would typically be called from your e-commerce platform
 */
export const insertEcommerceOrder = async (orderData: EcommerceOrderData) => {
  try {
    console.log('Inserting e-commerce order:', orderData);

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          guest_name: orderData.guest_name,
          guest_email: orderData.guest_email,
          guest_phone: orderData.guest_phone,
          items: orderData.items,
          subtotal: orderData.subtotal,
          delivery_fee: 0, // Always free delivery
          promo_discount: orderData.promo_discount || 0,
          total: orderData.subtotal - (orderData.promo_discount || 0), // Recalculate total without delivery fee
          delivery_address: orderData.delivery_address,
          payment_method: orderData.payment_method,
          payment_status: orderData.payment_status || 'pending',
          order_status: orderData.order_status || 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error inserting e-commerce order:', error);
      throw error;
    }

    console.log('E-commerce order inserted successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to insert e-commerce order:', error);
    throw error;
  }
};

/**
 * Function to update order status
 * This can be called from the POS system
 */
export const updateEcommerceOrderStatus = async (orderId: string, newStatus: string) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        order_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order status:', error);
      throw error;
    }

    console.log('Order status updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to update order status:', error);
    throw error;
  }
};

/**
 * Function to fetch pending e-commerce orders
 * This can be called from the POS system
 */
export const fetchPendingEcommerceOrders = async () => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending orders:', error);
      throw error;
    }

    console.log('Pending orders fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch pending orders:', error);
    throw error;
  }
};
