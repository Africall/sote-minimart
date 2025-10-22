
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';
import { toast } from 'sonner';

export const useRealtimeProducts = (products: Product[] | null, onProductUpdate: (updatedProduct: Product) => void) => {
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!products || products.length === 0) return;

    console.log('Setting up real-time product updates...');
    setIsListening(true);

    const channel = supabase
      .channel('product-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log('Real-time product update received:', payload);
          
          const updatedProduct = payload.new;
          
          // Convert database product to frontend Product type
          const product: Product = {
            id: updatedProduct.id,
            name: updatedProduct.name,
            brand: updatedProduct.name,
            quantity: updatedProduct.stock_quantity,
            unitOfMeasure: 'item' as any,
            buyingPrice: updatedProduct.cost,
            sellingPrice: updatedProduct.price,
            category: updatedProduct.category as any,
            taxRate: 16,
            barcode: Array.isArray(updatedProduct.barcode) ? updatedProduct.barcode[0] : updatedProduct.barcode,
            image_url: updatedProduct.image_url || undefined,
            receivedDate: updatedProduct.created_at,
            expiryDate: updatedProduct.expiry_date || undefined,
            reorderLevel: updatedProduct.reorder_level || 10,
            is_quick_item: updatedProduct.is_featured || false,
            created_at: updatedProduct.created_at,
            updated_at: updatedProduct.updated_at
          };

          onProductUpdate(product);

          // Show toast notification for stock changes
          if (payload.old.stock_quantity !== updatedProduct.stock_quantity) {
            const stockChange = updatedProduct.stock_quantity - payload.old.stock_quantity;
            const changeText = stockChange > 0 ? 'increased' : 'decreased';
            toast.info(`${updatedProduct.name} stock ${changeText} to ${updatedProduct.stock_quantity} units`);
          }

          // Show toast notification for price changes
          if (payload.old.price !== updatedProduct.price) {
            toast.info(`${updatedProduct.name} price updated to KES ${updatedProduct.price}`);
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to product updates');
        }
      });

    return () => {
      console.log('Cleaning up real-time product subscription');
      supabase.removeChannel(channel);
      setIsListening(false);
    };
  }, [products, onProductUpdate]);

  return { isListening };
};
