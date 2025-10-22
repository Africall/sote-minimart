
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useCartActions } from '@/hooks/useCartActions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Product } from '@/types/product';
import { Database } from '@/types/database';

type HeldTransactionRow = Database['public']['Tables']['held_transactions']['Row'];

export const usePosHandlers = (processCashSale?: (saleAmount: number, cashReceived: number) => Promise<number>) => {
  const { profile, user } = useAuth();
  const { clearCart, items } = useCart();
  const { addToCart } = useCartActions();

  const handleBarcodeInput = async (
    e: React.KeyboardEvent<HTMLInputElement>, 
    barcodeInput: string,
    setBarcodeInput: (value: string) => void
  ) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      try {
        console.log('Scanning barcode:', barcodeInput.trim());
        
        // First try exact barcode match
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .contains('barcode', [barcodeInput.trim()])
          .limit(1);

        if (error) {
          console.error('Barcode search error:', error);
          toast.error('Error searching for product');
          return;
        }

        if (!data || data.length === 0) {
          // Try alternative search using RPC function
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('search_products', { search: barcodeInput.trim() });

          if (rpcError) {
            console.error('RPC search error:', rpcError);
            toast.error(`Product not found for barcode: ${barcodeInput}`);
            setBarcodeInput('');
            return;
          }

          if (!rpcData || rpcData.length === 0) {
            toast.error(`Product not found for barcode: ${barcodeInput}`);
            setBarcodeInput('');
            return;
          }
          
          // Use RPC result
          const dbProduct = rpcData[0];
          const product: Product = {
            id: dbProduct.id,
            name: dbProduct.name,
            brand: dbProduct.name,
            quantity: dbProduct.stock_quantity,
            unitOfMeasure: 'item' as any,
            buyingPrice: dbProduct.cost,
            sellingPrice: dbProduct.price,
            category: dbProduct.category as any,
            taxRate: 16,
            barcode: Array.isArray(dbProduct.barcode) ? dbProduct.barcode[0] : dbProduct.barcode,
            image_url: dbProduct.image_url || undefined,
            receivedDate: dbProduct.created_at,
            expiryDate: dbProduct.expiry_date || undefined,
            reorderLevel: dbProduct.reorder_level || 10,
            is_quick_item: dbProduct.is_featured || false,
            created_at: dbProduct.created_at,
            updated_at: dbProduct.updated_at
          };

          await addToCart(product, 1, { source: 'barcode-scanner' });
          setBarcodeInput('');
          return;
        }

        // Use direct search result
        const dbProduct = data[0];
        const product: Product = {
          id: dbProduct.id,
          name: dbProduct.name,
          brand: dbProduct.name,
          quantity: dbProduct.stock_quantity,
          unitOfMeasure: 'item' as any,
          buyingPrice: dbProduct.cost,
          sellingPrice: dbProduct.price,
          category: dbProduct.category as any,
          taxRate: 16,
          barcode: Array.isArray(dbProduct.barcode) ? dbProduct.barcode[0] : dbProduct.barcode,
          image_url: dbProduct.image_url || undefined,
          receivedDate: dbProduct.created_at,
          expiryDate: dbProduct.expiry_date || undefined,
          reorderLevel: dbProduct.reorder_level || 10,
          is_quick_item: dbProduct.is_featured || false,
          created_at: dbProduct.created_at,
          updated_at: dbProduct.updated_at
        };

        await addToCart(product, 1, { source: 'barcode-scanner' });
        setBarcodeInput('');

      } catch (error) {
        console.error('Barcode scan error:', error);
        toast.error('Error scanning product: ' + (error as Error).message);
        setBarcodeInput('');
      }
    }
  };

  const restoreTransaction = async (transaction: HeldTransactionRow) => {
    try {
      const { data, error } = await supabase
        .from('held_transactions')
        .select('items')
        .eq('id', transaction.id)
        .single();

      if (error) throw error;
      if (data?.items) {
        const items = data.items as { product: Product, quantity: number }[];
        for (const item of items) {
          await addToCart(item.product, item.quantity, { 
            source: 'held-transaction',
            showSuccessToast: false 
          });
        }
        if (items.length > 0) {
          toast.success(`Restored ${items.length} item${items.length > 1 ? 's' : ''} to cart`);
        }
      }
    } catch (error) {
      toast.error('Error restoring transaction: ' + (error as Error).message);
    }
  };

  const handleCheckout = async (total: number, paymentMethod: string = 'cash', paymentDetails?: any) => {
    let completedSaleId: string | null = null;
    
    try {
      console.log('Processing checkout:', { total, paymentMethod, paymentDetails });
      
      // Determine final payment method and amount
      let finalPaymentMethod = paymentMethod;
      let finalAmount = total;
      
      // Handle split payment
      if (paymentDetails?.splitPayment) {
        // For split payments, we'll create multiple transactions
        const { cashAmount, mpesaAmount } = paymentDetails;
        
        // Record the main sale first
        const { data: saleData, error: saleError } = await supabase
          .from('sales')
          .insert({
            total_amount: Number(total),
            payment_method: 'split',
            payment_status: 'completed',
            cashier_id: profile?.id ?? user?.id
          })
          .select()
          .single();

        if (saleError) throw saleError;
        console.log('Sale recorded:', saleData);
        completedSaleId = saleData.id;

        // Create separate transactions for each payment method
        if (cashAmount > 0) {
          await supabase
            .from('transactions')
            .insert({
              transaction_type: 'sale',
              amount: Number(cashAmount),
              payment_type: 'cash',
              cashier_id: profile?.id ?? user?.id
            });
        }

        if (mpesaAmount > 0) {
          await supabase
            .from('transactions')
            .insert({
              transaction_type: 'sale',
              amount: Number(mpesaAmount),
              payment_type: 'mpesa',
              cashier_id: profile?.id ?? user?.id
            });
        }

        // Integrate cash management for cash portion
        if (cashAmount > 0 && processCashSale) {
          const cashReceived = paymentDetails.cashReceived || cashAmount;
          await processCashSale(cashAmount, cashReceived);
        }

        // Process cart items
        await processCartItems(saleData.id);
      } else {
        // Single payment method
        const { data: saleData, error: saleError } = await supabase
          .from('sales')
          .insert({
            total_amount: Number(total),
            payment_method: finalPaymentMethod,
            payment_status: 'completed',
            cashier_id: profile?.id ?? user?.id
          })
          .select()
          .single();

        if (saleError) throw saleError;
        console.log('Sale recorded:', saleData);
        completedSaleId = saleData.id;

        // Record transaction with correct payment type
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            transaction_type: 'sale',
            amount: Number(total),
            payment_type: finalPaymentMethod,
            cashier_id: profile?.id ?? user?.id
          });

        if (transactionError) throw transactionError;

        // Integrate cash management for cash sales
        if (finalPaymentMethod === 'cash' && processCashSale) {
          const cashReceived = paymentDetails?.amountReceived || total;
          await processCashSale(total, cashReceived);
        }

        // Process cart items
        await processCartItems(saleData.id);
      }

      // Update daily stats
      await updateDailyStats(total);

      clearCart();
      toast.success('Sale completed successfully!');
      
      // Auto-post to accounting (async, non-blocking)
      if (completedSaleId) {
        import('@/utils/accountingPosting').then(({ autoPostSale }) => {
          autoPostSale(completedSaleId);
        });
      }
      
      console.log('Checkout completed successfully');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Error processing checkout: ' + (error as Error).message);
    }
  };

  const processCartItems = async (saleId: string) => {
    // Process items in parallel for better performance
    const itemPromises = items.map(async (item) => {
      try {
        // Insert sale item and update stock in parallel
        const [saleItemResult, stockResult] = await Promise.all([
          supabase
            .from('sale_items')
            .insert({
              sale_id: saleId,
              product_id: item.id,
              quantity: item.quantity,
              unit_price: item.sellingPrice,
              total_price: item.sellingPrice * item.quantity
            }),
          supabase
            .rpc('update_product_stock', {
              product_id_param: item.id,
              quantity_change: -item.quantity // Negative to reduce stock
            })
        ]);

        if (stockResult.error) {
          console.error('Stock update error:', stockResult.error);
          toast.error(`Error updating stock for ${item.name}: ${stockResult.error.message}`);
          return;
        }

        const result = stockResult.data as any;
        if (!result?.success) {
          console.error('Stock update failed:', result);
          toast.error(`Stock update failed for ${item.name}: ${result?.error || 'Unknown error'}`);
          
          // Handle insufficient stock scenario
          if (result?.error_code === 'INSUFFICIENT_STOCK') {
            toast.error(`Only ${result.current_stock} units available for ${item.name}`);
          }
          return;
        }

        console.log(`Stock updated for ${item.name}:`, result);

        // Record inventory activity
        await supabase
          .from('activities')
          .insert({
            type: 'sale',
            description: `Sold ${item.quantity} units`,
            product_name: item.name,
            product_id: item.id,
            quantity: item.quantity,
            performed_by: profile?.id ?? user?.id
          });
      } catch (error) {
        console.error(`Error processing item ${item.name}:`, error);
        toast.error(`Error processing ${item.name}: ${(error as Error).message}`);
      }
    });

    await Promise.all(itemPromises);
  };

  const updateDailyStats = async (total: number) => {
    const today = new Date().toISOString().split('T')[0];
    const { data: existingStats } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('date', today)
      .single();

    if (existingStats) {
      // Update existing daily stats
      await supabase
        .from('daily_stats')
        .update({
          total_sales: existingStats.total_sales + Number(total)
        })
        .eq('date', today);
    } else {
      // Create new daily stats
      await supabase
        .from('daily_stats')
        .insert({
          date: today,
          total_sales: Number(total),
          total_expenses: 0
        });
    }
  };

  const syncOfflineTransactions = async (pendingTransactions: any[], setPendingTransactions: (txns: any[]) => void) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .upsert(pendingTransactions);

      if (error) throw error;
      setPendingTransactions([]);
      toast.success('Transactions synced successfully');
    } catch (error) {
      toast.error('Error syncing transactions: ' + (error as Error).message);
    }
  };

  return {
    handleBarcodeInput,
    restoreTransaction,
    handleCheckout,
    syncOfflineTransactions,
  };
};
