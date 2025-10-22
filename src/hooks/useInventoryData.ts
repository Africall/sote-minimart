
import { useCallback, useState } from 'react';
import { 
  getProducts, 
  getLowStockProducts, 
  getExpiringProducts,
  getInventoryValue,
  Product
} from '@/utils/supabaseUtils';
import { Product as FrontendProduct } from '@/types/product';
import { convertToFrontendProduct } from '@/utils/inventoryHelpers';
import { useToast } from '@/components/ui/use-toast';

export const useInventoryData = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<FrontendProduct[]>([]);
  const [lowStockItems, setLowStockItems] = useState<FrontendProduct[]>([]);
  const [expiringItems, setExpiringItems] = useState<Product[]>([]);
  const [inventoryValue, setInventoryValue] = useState<{ totalCostValue: number; totalSellingValue: number }>({ totalCostValue: 0, totalSellingValue: 0 });
  const [loading, setLoading] = useState(true);

  const fetchInventoryData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('useInventoryData: Starting inventory data fetch...');
      
      const [allProducts, lowStock, expiring, totalValue] = await Promise.all([
        getProducts(),
        getLowStockProducts(),
        getExpiringProducts(30),
        getInventoryValue()
      ]);

      console.log('useInventoryData: Fetched products:', allProducts?.length || 0);
      console.log('useInventoryData: Fetched low stock items:', lowStock?.length || 0);
      console.log('useInventoryData: Fetched expiring items:', expiring?.length || 0);
      console.log('useInventoryData: Inventory value:', totalValue);

      // Convert low stock database products to frontend products
      const convertedLowStock = lowStock?.map(convertToFrontendProduct) || [];
      console.log('useInventoryData: Converted low stock items:', convertedLowStock.length);

      setProducts(allProducts || []);
      setLowStockItems(convertedLowStock);
      setExpiringItems(expiring || []);
      setInventoryValue(totalValue || { totalCostValue: 0, totalSellingValue: 0 });
      
      console.log('useInventoryData: Data fetch completed successfully');
    } catch (error) {
      console.error('useInventoryData: Error fetching inventory data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch inventory data: ' + (error as Error).message,
        variant: 'destructive'
      });
      
      // Set fallback values to prevent UI crashes
      setProducts([]);
      setLowStockItems([]);
      setExpiringItems([]);
      setInventoryValue({ totalCostValue: 0, totalSellingValue: 0 });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    products,
    lowStockItems,
    expiringItems,
    inventoryValue,
    loading,
    fetchInventoryData
  };
};
