
import React from 'react';
import { Button } from '@/components/ui/button';
import { SheetTrigger, Sheet } from '@/components/ui/sheet';
import { ShoppingCart, X } from 'lucide-react';

interface CartHeaderProps {
  cartItemsCount: number;
  heldTransactions: any[];
  heldTransactionOpen: boolean;
  setHeldTransactionOpen: React.Dispatch<React.SetStateAction<boolean>>;
  clearCart: () => void;
}

export const CartHeader: React.FC<CartHeaderProps> = ({
  cartItemsCount,
  heldTransactions,
  heldTransactionOpen,
  setHeldTransactionOpen,
  clearCart,
}) => {
  return (
    <div className="mb-4 flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
        <ShoppingCart className="h-5 w-5" />
        Current Sale
      </h2>
      <div className="flex gap-2">
        <Sheet open={heldTransactionOpen} onOpenChange={setHeldTransactionOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="secondary" 
              size="sm" 
              disabled={heldTransactions.length === 0}
              className="text-xs sm:text-sm px-2 sm:px-3 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              <span className="hidden sm:inline">Held </span>({heldTransactions.length})
            </Button>
          </SheetTrigger>
        </Sheet>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearCart} 
          disabled={cartItemsCount === 0}
          className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 hover:bg-destructive hover:text-destructive-foreground dark:hover:bg-red-600 dark:border-gray-600 dark:text-gray-200 dark:hover:text-white transition-colors duration-200"
        >
          <X size={14} />
          Clear
        </Button>
      </div>
    </div>
  );
};
