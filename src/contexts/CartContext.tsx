
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect
} from 'react';
import { toast } from 'sonner';
import { Product } from '@/types/product';
import { CartItem } from '@/types/cart';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  applyDiscount: (id: string, discount: number) => void;
  clearCart: () => void;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_KEY = 'cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  // 🧠 Load from localStorage & Supabase on init
  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedCart = localStorage.getItem(LOCAL_KEY);
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          // Ensure parsedCart is an array
          if (Array.isArray(parsedCart)) {
            console.log('CartContext - Loading cart from localStorage:', parsedCart);
            setItems(parsedCart);
          }
        }
        
        if (user) {
          const { data, error } = await supabase
            .from('cart')
            .select('*')
            .eq('user_id', user.id);

          if (error) throw error;

          if (data?.length) {
            console.log('CartContext - Loading cart from Supabase:', data);
            setItems(data.map(row => ({
              ...row,
              sellingPrice: row.price
            })));
          }
        }
      } catch (err) {
        console.error('Failed to load cart:', err);
        // Ensure items is always an array on error
        setItems([]);
      }
    };

    loadCart();
  }, [user]);

  // 🧠 Sync with localStorage on every change
  useEffect(() => {
    if (Array.isArray(items)) {
      console.log('CartContext - Saving cart to localStorage:', items);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
    }
  }, [items]);

  // 🗑 Remove Item
  const removeItem = useCallback(async (id: string) => {
    console.log('CartContext - Removing item:', id);
    setItems(currentItems => {
      if (!Array.isArray(currentItems)) return [];
      const newItems = currentItems.filter(item => item.id !== id);
      console.log('CartContext - Items after removal:', newItems);
      return newItems;
    });

    if (user) {
      try {
        await supabase
          .from('cart')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);
      } catch {
        toast.error('Failed to remove cart item');
      }
    }
  }, [user]);

  // 🛒 Add item
  const addItem = useCallback(async (product: Product, quantity: number) => {
    console.log('CartContext - Adding item:', product, 'quantity:', quantity);
    
    setItems(currentItems => {
      // Ensure currentItems is always an array
      const safeCurrentItems = Array.isArray(currentItems) ? currentItems : [];
      console.log('CartContext - Current items before add:', safeCurrentItems);
      
      const existing = safeCurrentItems.find(item => item.id === product.id);
      
      let newItems;
      if (existing) {
        // Update existing item quantity
        newItems = safeCurrentItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item, mapping all relevant Product fields
        const newItem: CartItem = {
          id: product.id,
          name: product.name,
          brand: product.brand || '',
          quantity,
          unitOfMeasure: product.unitOfMeasure,
          buyingPrice: product.buyingPrice,
          sellingPrice: product.sellingPrice,
          category: product.category,
          taxRate: product.taxRate || 0.16,
          supplier: product.supplier,
          barcode: product.barcode,
          imageUrl: product.image_url,
          receivedDate: product.receivedDate,
          expiryDate: product.expiryDate,
          reorderLevel: product.reorderLevel,
          inventoryAge: product.inventoryAge,
          packSize: product.packSize,
          is_quick_item: product.is_quick_item,
          created_at: product.created_at,
          updated_at: product.updated_at,
          discount: 0,
        };
        
        newItems = [...safeCurrentItems, newItem];
      }
      
      console.log('CartContext - Items after add:', newItems);
      toast.success(`Added ${product.name} to cart`);
      return newItems;
    });

    if (user) {
      try {
        await supabase.from('cart').upsert({
          user_id: user.id,
          product_id: product.id,
          quantity,
          price: product.sellingPrice,
          discount: 0
        });
      } catch {
        toast.error('Network error while saving cart');
      }
    }
  }, [user]);

  // ✏️ Update Quantity
  const updateQuantity = useCallback(async (id: string, quantity: number) => {
    console.log('CartContext - Updating quantity for item:', id, 'to:', quantity);
    
    if (quantity < 1) {
      removeItem(id);
      return;
    }

    setItems(currentItems => {
      if (!Array.isArray(currentItems)) return [];
      const newItems = currentItems.map(item =>
        item.id === id
          ? { ...item, quantity }
          : item
      );
      console.log('CartContext - Items after quantity update:', newItems);
      return newItems;
    });

    if (user) {
      try {
        const { error } = await supabase
          .from('cart')
          .update({ quantity })
          .eq('user_id', user.id)
          .eq('product_id', id);
        if (error) throw error;
      } catch {
        toast.error('Failed to update cart quantity');
      }
    }
  }, [removeItem, user]);

  // 💸 Apply Discount
  const applyDiscount = useCallback((id: string, discount: number) => {
    setItems(currentItems => {
      if (!Array.isArray(currentItems)) return [];
      return currentItems.map(item =>
        item.id === id
          ? { ...item, discount: Math.max(0, discount) }
          : item
      );
    });

    if (user) {
      supabase
        .from('cart')
        .update({ discount })
        .eq('user_id', user.id)
        .eq('product_id', id);
    }
  }, [user]);

  // 🧹 Clear Cart
  const clearCart = useCallback(async () => {
    console.log('CartContext - Clearing cart');
    setItems([]);
    localStorage.removeItem(LOCAL_KEY);
    if (user) {
      try {
        await supabase.from('cart').delete().eq('user_id', user.id);
      } catch {
        toast.error('Failed to clear remote cart');
      }
    }
  }, [user]);

  // 💰 Totals - without VAT calculation
  const { subtotal, discount, tax, total } = useMemo(() => {
    // Ensure items is always an array before calling reduce
    const safeItems = Array.isArray(items) ? items : [];
    
    const subtotal = safeItems.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
    const discount = safeItems.reduce((sum, item) => sum + (item.discount || 0), 0);
    const tax = 0; // Remove VAT calculation
    
    console.log('CartContext - Calculating totals:', { items: safeItems, subtotal, discount, total: subtotal - discount });
    
    return {
      subtotal,
      discount,
      tax,
      total: subtotal - discount // Total without VAT
    };
  }, [items]);

  const value = {
    items: Array.isArray(items) ? items : [],
    addItem,
    updateQuantity,
    removeItem,
    applyDiscount,
    clearCart,
    subtotal,
    discount,
    tax,
    total
  };

  console.log('CartContext - Providing value:', value);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
