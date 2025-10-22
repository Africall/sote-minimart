import { supabase } from '@/integrations/supabase/client';

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  totalPages: number;
  currentPage: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface SalesData {
  id: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  cashier_name: string;
  product_name?: string;
}

export interface ExpenseData {
  id: string;
  title: string;
  amount: number;
  category: string;
  expense_date: string;
  recorded_by?: string;
}

export interface StockData {
  id: string;
  name: string;
  stock_quantity: number;
  reorder_level: number;
  category: string;
}

// Get paginated sales data with product names
export const getPaginatedSales = async (
  pagination: PaginationParams,
  dateParams: DateRangeParams,
  cashierId?: string
): Promise<PaginatedResponse<SalesData>> => {
  try {
    const { startDate, endDate } = dateParams;
    const offset = (pagination.page - 1) * pagination.limit;

    console.log('Fetching sales with params:', { startDate, endDate, cashierId, offset, limit: pagination.limit });

    // Build base query for sales with cashier names
    let salesQuery = supabase
      .from('sales')
      .select(`
        id,
        total_amount,
        payment_method,
        payment_status,
        created_at,
        cashier_id,
        profiles!sales_cashier_id_fkey(name)
      `, { count: 'exact' })
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .in('payment_status', ['completed', 'partially_paid'])
      .order('created_at', { ascending: false })
      .range(offset, offset + pagination.limit - 1);

    if (cashierId && cashierId !== 'all') {
      salesQuery = salesQuery.eq('cashier_id', cashierId);
    }

    const { data: salesData, error: salesError, count } = await salesQuery;

    console.log('Sales query result:', { salesData, salesError, count });

    if (salesError) throw salesError;

    // Fetch sale items to get product names
    const saleIds = (salesData || []).map(s => s.id);
    const { data: saleItems } = await supabase
      .from('sale_items')
      .select(`
        sale_id,
        products!sale_items_product_id_fkey(name)
      `)
      .in('sale_id', saleIds);

    // Group products by sale
    const productsBySale: Record<string, string[]> = {};
    (saleItems || []).forEach((item: any) => {
      if (!productsBySale[item.sale_id]) {
        productsBySale[item.sale_id] = [];
      }
      if (item.products?.name) {
        productsBySale[item.sale_id].push(item.products.name);
      }
    });

    const transformedData: SalesData[] = (salesData || []).map((sale: any) => {
      const products = productsBySale[sale.id] || [];
      return {
        id: sale.id,
        total_amount: sale.total_amount,
        payment_method: sale.payment_method,
        payment_status: sale.payment_status,
        created_at: sale.created_at,
        cashier_name: sale.profiles?.name || 'Unknown',
        product_name: products.length > 0 ? products.join(', ') : 'No items'
      };
    });

    console.log('Transformed sales data:', transformedData);

    return {
      data: transformedData,
      count: count || 0,
      totalPages: Math.ceil((count || 0) / pagination.limit),
      currentPage: pagination.page,
    };
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return {
      data: [],
      count: 0,
      totalPages: 0,
      currentPage: pagination.page,
    };
  }
};

// Get paginated products data
export const getPaginatedProducts = async (
  pagination: PaginationParams,
  searchQuery?: string
): Promise<PaginatedResponse<any>> => {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('products')
    .select('*, suppliers(*)', { count: 'exact' })
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  if (searchQuery && searchQuery.length > 0) {
    query = query.or(`name.ilike.%${searchQuery}%,barcode.eq.${searchQuery}`);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data || [],
    count: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    currentPage: page,
  };
};

// Get paginated expenses data
export const getPaginatedExpenses = async (
  pagination: PaginationParams,
  dateRange?: DateRangeParams
): Promise<PaginatedResponse<ExpenseData>> => {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('expenses')
    .select('*, profiles(*)', { count: 'exact' })
    .order('expense_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (dateRange?.startDate && dateRange?.endDate) {
    query = query
      .gte('expense_date', dateRange.startDate)
      .lte('expense_date', dateRange.endDate);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data || [],
    count: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    currentPage: page,
  };
};

// Get live sales analytics
export const getLiveSalesAnalytics = async (dateRange: DateRangeParams) => {
  try {
    const { data, error } = await supabase
      .rpc('get_sales_summary', {
        start_date: dateRange.startDate || new Date().toISOString().split('T')[0],
        end_date: dateRange.endDate || new Date().toISOString().split('T')[0]
      });

    if (error) {
      console.error('Error calling get_sales_summary:', error);
      throw new Error(`Failed to fetch sales analytics: ${error.message}`);
    }
    
    return data?.[0] || null;
  } catch (err: any) {
    console.error('Error in getLiveSalesAnalytics:', err);
    throw new Error(`Sales analytics error: ${err.message}`);
  }
};

// Get live payment breakdown
export const getLivePaymentBreakdown = async (dateRange: string) => {
  try {
    const { data, error } = await supabase
      .rpc('get_payment_summary_by_type', { date_range: dateRange });

    if (error) {
      console.error('Error calling get_payment_summary_by_type:', error);
      throw new Error(`Failed to fetch payment breakdown: ${error.message}`);
    }
    
    return data?.[0] || { cash: 0, mpesa: 0, card: 0, credit: 0 };
  } catch (err: any) {
    console.error('Error in getLivePaymentBreakdown:', err);
    throw new Error(`Payment breakdown error: ${err.message}`);
  }
};

// Get live inventory analytics
export const getLiveInventoryAnalytics = async () => {
  try {
    const [inventoryValue, lowStockProducts, expiringProducts] = await Promise.all([
      supabase.from('products').select('price, cost, stock_quantity'),
      supabase.from('products').select('id, name, stock_quantity, reorder_level').lte('stock_quantity', 10),
      supabase.from('products').select('id, name, expiry_date').not('expiry_date', 'is', null)
        .lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    // Check for errors in any of the queries
    if (inventoryValue.error) {
      console.error('Error fetching inventory value:', inventoryValue.error);
      throw new Error(`Inventory value error: ${inventoryValue.error.message}`);
    }
    if (lowStockProducts.error) {
      console.error('Error fetching low stock products:', lowStockProducts.error);
      throw new Error(`Low stock products error: ${lowStockProducts.error.message}`);
    }
    if (expiringProducts.error) {
      console.error('Error fetching expiring products:', expiringProducts.error);
      throw new Error(`Expiring products error: ${expiringProducts.error.message}`);
    }

    const totalValue = inventoryValue.data?.reduce((total, product) => {
      // Use selling price for inventory valuation, fallback to cost if price is 0
      const price = typeof product.price === 'number' && product.price > 0 ? product.price : 
                   (typeof product.cost === 'number' ? product.cost : 0);
      const quantity = typeof product.stock_quantity === 'number' ? product.stock_quantity : 0;
      return total + (price * quantity);
    }, 0) || 0;

    return {
      inventory_value: totalValue,
      low_stock_count: lowStockProducts.data?.length || 0,
      expiring_count: expiringProducts.data?.length || 0,
    };
  } catch (err: any) {
    console.error('Error in getLiveInventoryAnalytics:', err);
    throw new Error(`Inventory analytics error: ${err.message}`);
  }
};