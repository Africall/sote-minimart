
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';
import { Database } from '@/types/database';

type ProductRow = Database['public']['Tables']['products']['Row'];
type DailyStatsRow = Database['public']['Tables']['daily_stats']['Row'];
type HeldTransactionRow = Database['public']['Tables']['held_transactions']['Row'];
type SaleRow = Database['public']['Tables']['sales']['Row'];
type SaleItemRow = Database['public']['Tables']['sale_items']['Row'];

// Query keys
export const QUERY_KEYS = {
  QUICK_ITEMS: 'quickItems',
  DAILY_STATS: 'dailyStats',
  HELD_TRANSACTIONS: 'heldTransactions',
  PRODUCT_SEARCH: 'productSearch',
  CART: 'cart',
  ORDERS: 'orders',
};

// Product mapping function
const mapProductRowToProduct = (row: ProductRow): Product => ({
  id: row.id,
  name: row.name,
  brand: row.name, // Use name as brand since database doesn't have brand
  quantity: row.stock_quantity,
  unitOfMeasure: 'item' as any, // Default unit since database doesn't have this field
  buyingPrice: row.cost,
  sellingPrice: row.price,
  category: row.category as any,
  taxRate: 16, // Default tax rate
  supplier: undefined,
  barcode: Array.isArray(row.barcode) ? row.barcode[0] : undefined, // Handle array to string conversion
  image_url: row.image_url || undefined,
  receivedDate: row.created_at,
  expiryDate: row.expiry_date || undefined,
  reorderLevel: typeof row.reorder_level === 'number' ? row.reorder_level : parseInt(String(row.reorder_level || 10)),
  inventoryAge: undefined,
  packSize: undefined,
  is_quick_item: Boolean((row as any).is_featured), // Fix the type access issue
  created_at: row.created_at,
  updated_at: row.updated_at
});

// API functions
const fetchQuickItems = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_featured', true)
    .limit(4);
  
  if (error) throw error;
  return data.map(mapProductRowToProduct);
};

const fetchDailyStats = async (cashierId?: string) => {
  const today = new Date().toISOString().split('T')[0];
  console.log(`Fetching daily stats for date: ${today} and cashierId: ${cashierId}`);

  // Get daily stats
  const { data: dailyStatsData, error: dailyStatsError } = (await supabase
    .from('daily_stats')
    .select('*')
    .eq('date', today)) as { data: DailyStatsRow[] | null; error: any };
  
  if (dailyStatsError) {
    console.error('Error fetching daily_stats:', dailyStatsError);
    throw dailyStatsError;
  }
  console.log('Fetched daily_stats data:', dailyStatsData);

  // Get cashier-specific sales for today
  let cashierSales = 0;
  let totalTransactions = 0;
  let itemsSold = 0;

  if (cashierId) {
    const { data: salesData, error: salesError } = (await supabase
      .from('sales')
      .select('total_amount')
      .eq('cashier_id', cashierId)
      .gte('created_at', today + 'T00:00:00')
      .lt('created_at', today + 'T23:59:59')) as { data: Pick<SaleRow, 'total_amount'>[] | null; error: any };

    if (salesError) {
      console.error('Error fetching sales data:', salesError);
    } else {
      console.log('Fetched sales data:', salesData);
      if (salesData) {
        cashierSales = salesData.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
        totalTransactions = salesData.length;
      }
    }

    // Get items sold by cashier today
    const { data: itemsData, error: itemsError } = (await supabase
      .from('sale_items')
      .select('quantity, sales!inner(cashier_id, created_at)')
      .eq('sales.cashier_id', cashierId)
      .gte('sales.created_at', today + 'T00:00:00')
      .lt('sales.created_at', today + 'T23:59:59')) as { data: Pick<SaleItemRow, 'quantity'>[] | null; error: any };

    if (itemsError) {
      console.error('Error fetching sale_items data:', itemsError);
    } else {
      console.log('Fetched sale_items data:', itemsData);
      if (itemsData) {
        itemsSold = itemsData.reduce((sum, item) => sum + item.quantity, 0);
      }
    }
  }

  const dailyTotalFromStats = dailyStatsData ? dailyStatsData.reduce((sum, stat) => sum + Number(stat.total_sales), 0) : 0;

  const finalStats = {
    totalSales: cashierSales || dailyTotalFromStats || 0,
    totalTransactions,
    averageTransaction: totalTransactions > 0 ? cashierSales / totalTransactions : 0,
    itemsSold,
    floatRemaining: 1000, // Default float amount
    shiftStart: '',
    shiftEnd: ''
  };

  console.log('Final daily stats:', finalStats);
  return finalStats;
};

const fetchHeldTransactions = async () => {
  const { data, error } = await supabase
    .from('held_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) throw error;
  return data;
};

const fetchOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

interface SearchResponse {
  items: Product[];
  nextPage: number | null;
}

const searchProducts = async ({ query, page = 0, pageSize = 20 }): Promise<SearchResponse> => {
  if (query.length < 2) return { items: [], nextPage: null };
  
  const from = page * pageSize;
  const to = from + pageSize - 1;
  
const { data, error, count } = await supabase
  .rpc('search_products', { search: query})
  .select('*')
  .order('name', { ascending: true })
  .range(from, to);

  if (error) throw error;
  const hasMore = count ? from + pageSize < count : false;
  return {
    items: data.map(mapProductRowToProduct),
    nextPage: hasMore ? page + 1 : null
  };
};

// React Query hooks with minimal caching
export const useQuickItems = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.QUICK_ITEMS],
    queryFn: fetchQuickItems,
    staleTime: 0, // Data is immediately stale
    gcTime: 30 * 1000, // Keep in cache for only 30 seconds
    networkMode: 'online', // Only fetch when online
  });
};

export const useDailyStats = (cashierId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.DAILY_STATS, cashierId],
    queryFn: () => fetchDailyStats(cashierId),
    staleTime: 0, // Data is immediately stale
    gcTime: 10 * 1000, // Keep in cache for only 10 seconds
    networkMode: 'online', // Only fetch when online
  });
};

export const useHeldTransactions = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.HELD_TRANSACTIONS],
    queryFn: fetchHeldTransactions,
    staleTime: 0, // Data is immediately stale
    gcTime: 10 * 1000, // Keep in cache for only 10 seconds
    networkMode: 'online', // Only fetch when online
  });
};

export const useOrders = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.ORDERS],
    queryFn: fetchOrders,
    staleTime: 0, // Data is immediately stale
    gcTime: 10 * 1000, // Keep in cache for only 10 seconds
    networkMode: 'online', // Only fetch when online
  });
};

export const useProductSearch = (query: string) => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.PRODUCT_SEARCH, query],
    queryFn: ({ pageParam = 0 }) => searchProducts({ query, page: pageParam as number }),
    getNextPageParam: (lastPage: SearchResponse) => lastPage.nextPage,
    enabled: query.length >= 2,
    staleTime: 0, // Data is immediately stale
    gcTime: 10 * 1000, // Keep in cache for only 10 seconds
    networkMode: 'online', // Only fetch when online
    initialPageParam: 0,
  });
};

// Prefetching functions - simplified to reduce caching
export const prefetchQuickItems = async (queryClient: any) => {
  await queryClient.prefetchQuery({
    queryKey: [QUERY_KEYS.QUICK_ITEMS],
    queryFn: fetchQuickItems,
    staleTime: 0,
  });
};

export const prefetchDailyStats = async (queryClient: any, cashierId?: string) => {
  await queryClient.prefetchQuery({
    queryKey: [QUERY_KEYS.DAILY_STATS, cashierId],
    queryFn: () => fetchDailyStats(cashierId),
    staleTime: 0,
  });
};
