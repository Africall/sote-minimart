
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/types/product';
import { productToCartItem, validateProductForCart } from '@/utils/cartMapper';

interface AddToCartOptions {
  source?: 'product-card' | 'quick-item' | 'barcode-scanner' | 'batch' | 'held-transaction' | 'price-check';
  showSuccessToast?: boolean;
  skipValidation?: boolean;
}

export const useCartActions = () => {
  const { addItem: contextAddItem, items } = useCart();

  const addToCart = useCallback(async (
    product: Product, 
    quantity: number = 1, 
    options: AddToCartOptions = {}
  ) => {
    const { source = 'product-card', showSuccessToast = true, skipValidation = false } = options;

    try {
      // Validate product if not skipped
      if (!skipValidation) {
        const validation = validateProductForCart(product);
        if (!validation.isValid) {
          // Show a more prominent error for out of stock items
          if (validation.error?.includes('out of stock')) {
            toast.error(validation.error, {
              duration: 4000,
              style: {
                backgroundColor: '#fee2e2',
                borderColor: '#fca5a5',
                color: '#dc2626',
              },
            });
          } else {
            toast.error(validation.error || 'Cannot add product to cart');
          }
          return false;
        }
      }

      // Add to cart using context method
      await contextAddItem(product, quantity);

      // Show success feedback
      if (showSuccessToast) {
        toast.success(`✅ ${product.name} added to cart!`, {
          duration: 2000,
        });
      }

      // Optional: Analytics tracking
      console.log(`Product added to cart: ${product.name} (source: ${source})`);

      return true;
    } catch (error) {
      toast.error('Failed to add product to cart');
      console.error('Error adding to cart:', error);
      return false;
    }
  }, [contextAddItem]);

  const addMultipleToCart = useCallback(async (
    items: { product: Product; quantity: number }[],
    options: AddToCartOptions = {}
  ) => {
    const { showSuccessToast = true } = options;
    let successCount = 0;

    for (const item of items) {
      const success = await addToCart(item.product, item.quantity, {
        ...options,
        showSuccessToast: false, // We'll show a batch success message
      });
      if (success) successCount++;
    }

    if (showSuccessToast && successCount > 0) {
      toast.success(`✅ ${successCount} item${successCount > 1 ? 's' : ''} added to cart!`);
    }

    return successCount;
  }, [addToCart]);

  // Debounced add for barcode scanner
  const debouncedAddToCart = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      const recentlyAdded = new Set<string>();

      return (product: Product, quantity: number = 1, options: AddToCartOptions = {}) => {
        const key = `${product.id}-${Date.now()}`;
        
        // Prevent duplicate rapid additions
        if (recentlyAdded.has(product.id)) {
          return;
        }

        recentlyAdded.add(product.id);
        
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          recentlyAdded.delete(product.id);
        }, 1000); // Prevent duplicates for 1 second

        return addToCart(product, quantity, {
          ...options,
          source: 'barcode-scanner',
        });
      };
    })(),
    [addToCart]
  );

  return {
    addToCart,
    addMultipleToCart,
    debouncedAddToCart,
    cartItemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
};
