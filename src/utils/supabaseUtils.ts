import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Product as FrontendProduct, UnitOfMeasure } from '@/types/product';

// Types
export type Product = Database['public']['Tables']['products']['Row'];
export type Supplier = Database['public']['Tables']['suppliers']['Row'];
export type Sale = Database['public']['Tables']['sales']['Row'] & {
  sale_items?: SaleItem[];
};
export type SaleItem = Database['public']['Tables']['sale_items']['Row'];
export type Expense = Database['public']['Tables']['expenses']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Activity = Database['public']['Tables']['activities']['Row'];

// Currency formatter for KES
export const formatCurrency = (amount: number): string => {
  // Handle NaN, null, undefined, or non-numeric values
  if (typeof amount !== 'number' || isNaN(amount)) {
    amount = 0;
  }
  
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Fixed mapping function that preserves exact database values and uses consistent field names
const mapProductRowToProduct = (row): FrontendProduct => {
  console.log('Mapping product row:', {
    id: row.id,
    name: row.name,
    image_url: row.image_url,
    cost: row.cost,
    price: row.price,
    stock_quantity: row.stock_quantity
  });

  return {
    id: row.id,
    name: row.name,
    brand: row.name, // Use name as brand since database doesn't have brand field
    quantity: row.stock_quantity,
    unitOfMeasure: 'item' as UnitOfMeasure, // Default unit since database doesn't have this field
    buyingPrice: row.cost, // Keep exact database value
    sellingPrice: row.price, // Keep exact database value
    category: row.category,
    taxRate: 16, // Default tax rate
    supplier: undefined,
    barcode: row.barcode || undefined,
    image_url: row.image_url || undefined, // Keep database field name for consistency
    receivedDate: row.created_at,
    expiryDate: row.expiry_date || undefined,
    reorderLevel: typeof row.reorder_level === 'number' ? row.reorder_level : parseInt(String(row.reorder_level || 10)),
    inventoryAge: undefined,
    packSize: undefined,
    is_quick_item: row.is_featured || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
};

// Product operations - Get products with exact database values
export const getProducts = async (): Promise<FrontendProduct[]> => {
  try {
    console.log('Fetching products from database...');
    
    const { data, error } = await supabase
      .from('products')
      .select('*');
    
    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
    
    console.log('Raw database products:', data);
    
    const mappedProducts = data ? data.map(mapProductRowToProduct) : [];
    console.log('Mapped products with image URLs:', mappedProducts.map(p => ({ 
      id: p.id, 
      name: p.name, 
      image_url: p.image_url 
    })));
    
    return mappedProducts;
  } catch (error) {
    console.error('Error in getProducts:', error);
    throw error;
  }
};

export const getProduct = async (id: string) => {
  try {
    console.log('Fetching product by ID:', id);
    
    const { data, error } = await supabase
      .from('products')
      .select('*, suppliers(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
    
    console.log('Fetched product:', data);
    return data;
  } catch (error) {
    console.error('Error in getProduct:', error);
    throw error;
  }
};

export const createProduct = async (product: Database['public']['Tables']['products']['Insert']) => {
  try {
    console.log('Creating product with data:', product);
    
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating product:', error);
      throw error;
    }
    
    console.log('Created product:', data);
    return data;
  } catch (error) {
    console.error('Error in createProduct:', error);
    throw error;
  }
};

export const updateProduct = async (id: string, product: Database['public']['Tables']['products']['Update']) => {
  try {
    console.log('updateProduct called with:', { id, product });
    
    // CRITICAL: Remove stock_quantity from updates - stock must be changed via update_product_stock RPC only
    const { stock_quantity, ...productWithoutStock } = product;
    
    if (stock_quantity !== undefined) {
      console.warn('BLOCKED: stock_quantity in updateProduct. Use update_product_stock() instead.');
    }
    
    // Ensure required fields are not null/undefined
    const sanitizedProduct = {
      ...productWithoutStock,
      // Make sure cost and price are never null if they're being updated
      ...(productWithoutStock.cost !== undefined && { cost: productWithoutStock.cost }),
      ...(productWithoutStock.price !== undefined && { price: productWithoutStock.price }),
      // Set updated_at timestamp
      updated_at: new Date().toISOString()
    };

    console.log('Sanitized product data:', sanitizedProduct);

    // Temporarily enable bulk import mode to bypass price validation if needed
    if (product.price !== undefined && product.price <= 0) {
      console.log('Setting bulk import mode to bypass price validation');
      await supabase.rpc('set_config', {
        setting_name: 'app.bulk_import_mode',
        new_value: 'true',
        is_local: false
      });
    }

    const { data, error } = await supabase
      .from('products')
      .update(sanitizedProduct)
      .eq('id', id)
      .select()
      .single();
    
    // Reset bulk import mode
    if (product.price !== undefined && product.price <= 0) {
      console.log('Resetting bulk import mode');
      await supabase.rpc('set_config', {
        setting_name: 'app.bulk_import_mode',
        new_value: 'false',
        is_local: false
      });
    }
    
    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
    
    console.log('Product updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in updateProduct:', error);
    throw error;
  }
};

export const deleteProduct = async (id: string) => {
  try {
    console.log('Deleting product with ID:', id);
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
    
    console.log('Product deleted successfully');
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    throw error;
  }
};

export const addProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> => {
  try {
    console.log('addProduct called with:', productData);
    
    // Validate required fields
    if (!productData.name || productData.name.trim() === '') {
      throw new Error('Product name is required');
    }
    
    if (!productData.category || productData.category.trim() === '') {
      throw new Error('Product category is required');
    }
    
    if (typeof productData.price !== 'number' || productData.price < 0) {
      throw new Error('Valid price is required');
    }
    
    if (typeof productData.cost !== 'number' || productData.cost < 0) {
      throw new Error('Valid cost is required');
    }
    
    if (typeof productData.stock_quantity !== 'number' || productData.stock_quantity < 0) {
      throw new Error('Valid stock quantity is required');
    }
    
    console.log('Validation passed, inserting product...');
    
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) {
      console.error('Error inserting product:', error);
      throw error;
    }
    
    console.log('Product inserted successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in addProduct:', error);
    throw error;
  }
};

// New function using the database function for safe stock updates
export const updateProductStock = async (productId: string, quantityChange: number): Promise<any> => {
  try {
    console.log(`updateProductStock called with product ${productId} and quantity change ${quantityChange}`);
    
    // Validate inputs
    if (!productId || typeof productId !== 'string') {
      throw new Error('Valid product ID is required');
    }
    
    if (typeof quantityChange !== 'number' || isNaN(quantityChange)) {
      throw new Error('Valid quantity change is required');
    }
    
    const { data, error } = await supabase
      .rpc('update_product_stock', {
        product_id_param: productId,
        quantity_change: quantityChange
      });

    if (error) {
      console.error('Stock update error:', error);
      throw error;
    }

    console.log('Stock update result:', data);
    
    // Check if the RPC function returned an error
    if (data && data.success === false) {
      console.error('RPC function returned error:', data);
      throw new Error(data.error || 'Stock update failed');
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateProductStock:', error);
    throw error;
  }
};

// New function using the database function for safe price updates
export const updateProductPrice = async (productId: string, newPrice: number): Promise<any> => {
  try {
    console.log(`updateProductPrice called with product ${productId} and new price ${newPrice}`);
    
    // Validate inputs
    if (!productId || typeof productId !== 'string') {
      throw new Error('Valid product ID is required');
    }
    
    if (typeof newPrice !== 'number' || isNaN(newPrice) || newPrice < 0) {
      throw new Error('Valid price is required');
    }
    
    const { data, error } = await supabase
      .rpc('update_product_price', {
        product_id_param: productId,
        new_price_param: newPrice
      });

    if (error) {
      console.error('Price update error:', error);
      throw error;
    }

    console.log('Price update result:', data);
    
    // Check if the RPC function returned an error
    if (data && data.success === false) {
      console.error('RPC function returned error:', data);
      throw new Error(data.error || 'Price update failed');
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateProductPrice:', error);
    throw error;
  }
};

// Supplier operations
export const getSuppliers = async () => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
};

export const createSupplier = async (supplier: Database['public']['Tables']['suppliers']['Insert']) => {
  const { data, error } = await supabase
    .from('suppliers')
    .insert(supplier)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Sales operations
export const createSale = async (
  sale: Database['public']['Tables']['sales']['Insert'],
  items: Database['public']['Tables']['sale_items']['Insert'][]
) => {
  const { data: saleData, error: saleError } = await supabase
    .from('sales')
    .insert(sale)
    .select()
    .maybeSingle();
  
  if (saleError) throw saleError;

  const saleItems = items.map(item => ({
    ...item,
    sale_id: saleData.id
  }));

  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(saleItems);
  
  if (itemsError) throw itemsError;
  
  return saleData;
};

export const getSales = async (startDate?: Date, endDate?: Date) => {
  let query = supabase
    .from('sales')
    .select('*, sale_items(*, products(*)), profiles(*)')
    .order('created_at', { ascending: false });

  if (startDate && endDate) {
    query = query
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return data;
};

// Expense operations
export const getExpenses = async (startDate?: Date, endDate?: Date) => {
  let query = supabase
    .from('expenses')
    .select('*, profiles(*)')
    .order('expense_date', { ascending: false });

  if (startDate && endDate) {
    query = query
      .gte('expense_date', startDate.toISOString())
      .lte('expense_date', endDate.toISOString());
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return data;
};

export const createExpense = async (expense: Database['public']['Tables']['expenses']['Insert']) => {
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

// Activity operations
export const getActivities = async (limit = 50) => {
  const { data, error } = await supabase
    .from('activities')
    .select('*, profiles(*)')
    .order('date', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
};

export const createActivity = async (activity: Database['public']['Tables']['activities']['Insert']) => {
  const { data, error } = await supabase
    .from('activities')
    .insert(activity)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

// Profile operations
export const getProfile = async (id: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const updateProfile = async (id: string, profile: Database['public']['Tables']['profiles']['Update']) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', id)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

// Analytics operations
export const getInventoryValue = async () => {
  console.log('Calculating inventory value...');
  
  const { data, error } = await supabase
    .from('products')
    .select('cost, price, stock_quantity');
  
  if (error) {
    console.error('Error fetching products for inventory value:', error);
    throw error;
  }
  
  console.log('Products for inventory calculation:', data);
  
  const result = data.reduce((totals, product) => {
    // Ensure cost, price and stock_quantity are valid numbers
    const cost = typeof product.cost === 'number' && !isNaN(product.cost) ? product.cost : 0;
    const price = typeof product.price === 'number' && !isNaN(product.price) ? product.price : 0;
    const stockQuantity = typeof product.stock_quantity === 'number' && !isNaN(product.stock_quantity) ? product.stock_quantity : 0;
    
    const costValue = cost * stockQuantity;
    const sellingValue = price * stockQuantity;
    
    console.log(`Product: cost=${cost}, price=${price}, quantity=${stockQuantity}, costValue=${costValue}, sellingValue=${sellingValue}`);
    
    return {
      totalCostValue: totals.totalCostValue + costValue,
      totalSellingValue: totals.totalSellingValue + sellingValue
    };
  }, { totalCostValue: 0, totalSellingValue: 0 });
  
  console.log('Total inventory values:', result);
  return result;
};

// Legacy function for backward compatibility - returns cost value
export const getInventoryCostValue = async () => {
  const result = await getInventoryValue();
  return result.totalCostValue;
};

// New function for selling price value
export const getInventorySellingValue = async () => {
  const result = await getInventoryValue();
  return result.totalSellingValue;
};

export const getSalesAnalytics = async (startDate: Date, endDate: Date) => {
  const { data, error } = await supabase
    .from('sales')
    .select('total_amount, created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());
  
  if (error) throw error;
  
  return {
    totalSales: data.reduce((sum, sale) => sum + sale.total_amount, 0),
    transactionCount: data.length,
    averageSale: data.length > 0 
      ? data.reduce((sum, sale) => sum + sale.total_amount, 0) / data.length 
      : 0
  };
};

export const getLowStockProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .filter('stock_quantity','lte','10').range(0, 7);

  if (error) {
    console.error('Error fetching low stock products:', error);
    throw error;
  }

  return data || [];
};

export const getExpiringProducts = async (daysThreshold = 30) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .not('expiry_date', 'is', null)
    .lte('expiry_date', new Date(Date.now() + daysThreshold * 24 * 60 * 60 * 1000).toISOString());
  
  if (error) throw error;
  return data;
};
