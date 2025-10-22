
import React, { useState, useEffect, useRef } from 'react';
import { CartItem as CartItemType } from '@/types/cart';
import { ShoppingCart, ChevronUp } from 'lucide-react';
import { CartItem } from './CartItem';
import { ProductCategory } from '@/types/product';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface CartItemListProps {
  items: CartItemType[];
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  formatCurrency: (amount: number) => string;
  categoryColors: Record<ProductCategory, string>;
}

export const CartItemList: React.FC<CartItemListProps> = ({
  items,
  updateQuantity,
  removeItem,
  formatCurrency,
  categoryColors,
}) => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  console.log('CartItemList - Raw items prop:', items);

  const safeItems = React.useMemo(() => {
    const result = Array.isArray(items) ? items : [];
    console.log('CartItemList - Safe items after processing:', result);
    return result;
  }, [items]);

  React.useEffect(() => {
    console.log('CartItemList - Items changed, safe items:', safeItems);
  }, [safeItems]);

  // Handle scroll to show/hide scroll-to-top button
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    setShowScrollTop(scrollTop > 200);
  };

  // Scroll to top function
  const scrollToTop = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = 0;
      }
    }
  };

  if (safeItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-lg mx-4 my-4">
        <ShoppingCart className="mb-4 h-16 w-16 opacity-40" />
        <p className="text-lg font-medium">Cart is empty</p>
        <p className="text-sm mt-2">Search or scan products to add to the cart</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-white dark:bg-gray-800">
      <ScrollArea 
        ref={scrollAreaRef}
        className="h-full w-full"
        onScrollCapture={handleScroll}
      >
        <Table className="w-full">
          <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10">
            <TableRow className="border-b-2 border-gray-200 dark:border-gray-700">
              <TableHead className="py-3 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide w-[120px]">
                QTY
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                ITEM NAME
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-right w-[100px]">
                UNIT PRICE
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-right w-[100px]">
                SUBTOTAL
              </TableHead>
              <TableHead className="py-3 px-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-center w-[70px]">
                ACTION
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeItems.map((item, index) => {
              console.log(`CartItemList - Rendering item ${index}:`, item);
              
              if (!item || typeof item !== 'object' || !item.id) {
                console.warn(`CartItemList - Invalid item at index ${index}:`, item);
                return null;
              }

              const itemProps = {
                id: item.id,
                name: item.name || 'Unnamed Product',
                category: item.category,
                quantity: Math.max(1, item.quantity || 1),
                sellingPrice: Number(item.sellingPrice) || 0,
                discount: Number(item.discount) || 0,
              };

              console.log(`CartItemList - Item props for rendering:`, itemProps);

              return (
                <CartItem
                  key={`cart-item-${item.id}-${index}`}
                  {...itemProps}
                  updateQuantity={updateQuantity}
                  removeItem={removeItem}
                  formatCurrency={formatCurrency}
                  categoryColors={categoryColors}
                />
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
      
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          size="sm"
          variant="outline"
          className="absolute bottom-4 right-4 rounded-full w-10 h-10 p-0 shadow-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 z-20"
          onClick={scrollToTop}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
