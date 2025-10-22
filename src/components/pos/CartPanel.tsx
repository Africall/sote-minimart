
import React, { useState, useMemo } from 'react';
import { useCart } from '@/contexts/CartContext';
import { CartHeader } from './cart/CartHeader';
import { CartItemList } from './cart/CartItemList';
import { CustomerPanel } from './cart/CustomerPanel';
import { CartSummary } from './cart/CartSummary';
import { CartActionButtons } from './cart/CartActionButtons';
import { formatCurrency, CATEGORY_COLORS } from './utils';
import { Database } from '@/types/database';
import { Product } from '@/types/product';

type HeldTransactionRow = Database['public']['Tables']['held_transactions']['Row'];

interface CartPanelProps {
  onCheckout: () => void;
  onLowStockAlert: (product: Product) => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  onCheckout,
  onLowStockAlert
}) => {
  // State for customer information
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    loyaltyId: ''
  });
  const [showCustomerPanel, setShowCustomerPanel] = useState(false);
  
  // State for held transactions
  const [heldTransactions, setHeldTransactions] = useState<HeldTransactionRow[]>([]);
  const [heldTransactionOpen, setHeldTransactionOpen] = useState(false);
  
  // Cart context
  const { 
    items: cartItems, 
    updateQuantity, 
    removeItem, 
    clearCart,
    subtotal,
    discount,
    tax,
    total
  } = useCart();

  // Debug logging to see cart items
  console.log('CartPanel - Cart items from context:', cartItems);

  // Ensure cartItems is always an array
  const safeCartItems = React.useMemo(() => {
    const result = Array.isArray(cartItems) ? cartItems : [];
    console.log('CartPanel - Safe cart items:', result);
    return result;
  }, [cartItems]);

  // Force re-render when cart items change
  React.useEffect(() => {
    console.log('CartPanel - Cart items changed:', safeCartItems);
  }, [safeCartItems]);

  // Hold the current transaction for later
  const holdTransaction = () => {
    if (cartItems.length === 0) return;
    
    // Convert CartItem[] to a serializable format for database storage
    const transaction: HeldTransactionRow = {
      id: crypto.randomUUID(),
      items: JSON.parse(JSON.stringify(cartItems)),
      total,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setHeldTransactions(prev => [...prev, transaction]);
    clearCart();
    setShowCustomerPanel(false);
    setCustomer({ name: '', phone: '', loyaltyId: '' });
  };

  // Restore a held transaction
  const restoreTransaction = (transaction: HeldTransactionRow) => {
    clearCart();
    // Re-add items from held transaction
    if (transaction.items && Array.isArray(transaction.items)) {
      const items = transaction.items;
      items.forEach(item => {
        if (item && typeof item === 'object' && 'id' in item && 'quantity' in item) {
          updateQuantity(item.id as string, item.quantity as number);
        }
      });
    }
    
    // Remove transaction from held list
    setHeldTransactions(prev => 
      prev.filter(t => t.id !== transaction.id)
    );
    
    setHeldTransactionOpen(false);
  };

  // Calculate total item count
  const cartItemsCount = safeCartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Handler for low stock alert
  const handleLowStockAlert = () => {
    // Find a product with low stock as an example
    const lowStockProduct = safeCartItems.find(item => (item.reorderLevel || 10) > item.quantity);
    if (lowStockProduct) {
      onLowStockAlert(lowStockProduct);
    }
  };

  return (
    <div className="w-full lg:w-[500px] flex flex-col bg-white dark:bg-gray-800 rounded-md font-sans border border-gray-200 dark:border-gray-700 transition-colors duration-200 h-[100dvh] md:h-full">
      {/* Sticky Header */}
      <div className="flex-shrink-0">
        <CartHeader 
          cartItemsCount={cartItemsCount}
          heldTransactions={heldTransactions}
          heldTransactionOpen={heldTransactionOpen}
          setHeldTransactionOpen={setHeldTransactionOpen}
          clearCart={clearCart}
        />
      </div>
      
      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Items List - Scrollable */}
        <div className="flex-1 min-h-0">
          <CartItemList 
            items={safeCartItems}
            updateQuantity={updateQuantity}
            removeItem={removeItem}
            formatCurrency={formatCurrency}
            categoryColors={CATEGORY_COLORS}
          />
        </div>
        
        {/* Customer Panel - Collapsible */}
        {showCustomerPanel && (
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
            <CustomerPanel 
              customer={customer}
              setCustomer={setCustomer}
              setShowCustomerPanel={setShowCustomerPanel}
            />
          </div>
        )}
      </div>
      
      {/* Sticky Footer with Summary and Actions */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CartSummary 
          subtotal={subtotal}
          discount={discount}
          tax={tax}
          total={total}
          itemCount={cartItemsCount}
          formatCurrency={formatCurrency}
        />
        <CartActionButtons 
          showCustomerPanel={showCustomerPanel}
          cartItemsCount={cartItemsCount}
          setShowCustomerPanel={setShowCustomerPanel}
          holdTransaction={holdTransaction}
          setCheckoutOpen={onCheckout}
          setCustomizeReceiptOpen={handleLowStockAlert}
        />
      </div>
    </div>
  );
};
