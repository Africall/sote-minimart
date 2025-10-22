
import React, { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, User, Receipt, Mail, Trash2, Archive } from 'lucide-react';
import { Product } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CompactCartPanelProps {
  onCheckout: () => void;
  onLowStockAlert: (product: Product) => void;
  formatCurrency: (amount: number) => string;
  heldTransactions?: any[];
  onHoldTransaction?: () => void;
}

export const CompactCartPanel: React.FC<CompactCartPanelProps> = ({
  onCheckout,
  formatCurrency,
  heldTransactions = [],
  onHoldTransaction
}) => {
  const { user } = useAuth();
  const { 
    items: cartItems, 
    updateQuantity, 
    removeItem, 
    clearCart,
    subtotal,
    total
  } = useCart();

  const [loading, setLoading] = useState(false);
  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleHoldTransaction = async () => {
    if (cartItems.length === 0) {
      toast.error('No items in cart to hold');
      return;
    }

    try {
      setLoading(true);
      
      const transactionData = {
        cashier_id: user?.id,
        items: cartItems.map(item => ({
          product: {
            id: item.id,
            name: item.name,
            sellingPrice: item.sellingPrice,
            brand: item.brand,
            quantity: item.quantity,
            unitOfMeasure: item.unitOfMeasure,
            buyingPrice: item.buyingPrice,
            category: item.category,
            taxRate: item.taxRate,
            barcode: item.barcode,
            image_url: item.imageUrl,
            receivedDate: item.receivedDate,
            expiryDate: item.expiryDate,
            reorderLevel: item.reorderLevel,
            is_quick_item: item.is_quick_item,
            created_at: item.created_at,
            updated_at: item.updated_at
          },
          quantity: item.quantity
        })),
        total_amount: total,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('held_transactions')
        .insert(transactionData);

      if (error) throw error;

      clearCart();
      toast.success('Transaction held successfully');
      
      if (onHoldTransaction) {
        onHoldTransaction();
      }
    } catch (error) {
      console.error('Error holding transaction:', error);
      toast.error('Failed to hold transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-[100dvh] md:h-full flex flex-col">
      {/* Sticky Header */}
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="font-semibold text-sm">Current Sale</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-16 text-xs bg-teal-100 text-teal-700 hover:bg-teal-200"
            onClick={handleHoldTransaction}
            disabled={cartItems.length === 0 || loading}
          >
            Hold ({heldTransactions.length})
          </Button>
        </div>
      </CardHeader>

      {/* Scrollable Content */}
      <CardContent className="flex-1 min-h-0 flex flex-col p-3 pt-0">
        {/* Cart Items - Scrollable */}
        <div className="flex-1 min-h-0 mb-3">
          {cartItems.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              No items in cart
            </div>
          ) : (
            <div className="space-y-2 h-full overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-gray-500">{formatCurrency(item.sellingPrice)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                    >
                      -
                    </Button>
                    <span className="w-6 text-center text-xs">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Sticky Footer with Summary and Actions */}
      <div className="flex-shrink-0 border-t p-3 bg-white">
        {/* Cart Summary */}
        <div className="space-y-1 text-sm mb-3">
          <div className="flex justify-between">
            <span>Items:</span>
            <span>{cartItemsCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>—</span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>—</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-bold text-base text-green-600">
            <span>TOTAL:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1">
            <Button variant="outline" size="sm" className="text-xs p-2 h-8">
              <User className="h-3 w-3 mr-1" />
              Customer
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs p-2 h-8"
              onClick={handleHoldTransaction}
              disabled={cartItems.length === 0 || loading}
            >
              <Archive className="h-3 w-3 mr-1" />
              Hold
            </Button>
            <Button variant="outline" size="sm" className="text-xs p-2 h-8">
              <Receipt className="h-3 w-3 mr-1" />
              Receipt
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-1">
            <Button variant="outline" size="sm" className="text-xs p-2 h-8">
              <Mail className="h-3 w-3 mr-1" />
              Email
            </Button>
            <Button variant="outline" size="sm" className="text-xs p-2 h-8" onClick={clearCart}>
              <Trash2 className="h-3 w-3 mr-1" />
              Void
            </Button>
          </div>

          {/* Checkout Button */}
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium mb-safe"
            onClick={onCheckout}
            disabled={cartItems.length === 0}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Checkout ({cartItemsCount} items)
          </Button>
        </div>
      </div>
    </Card>
  );
};
