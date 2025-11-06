import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Product as FrontendProduct } from '@/types/product';
import { ProductGrid } from './ProductGrid';
import { LowStockTable } from './LowStockTable';
import ExpiringItemsTable from './ExpiringItemsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

interface InventoryTabsProps {
  filteredProducts: FrontendProduct[];
  lowStockItems: FrontendProduct[];
  expiringItems: FrontendProduct[];
  loading: boolean;
  onRestock: (product: FrontendProduct) => void;
  onEdit: (product: FrontendProduct) => void;
  onDelete?: (product: FrontendProduct) => void;
  onRefresh: () => void; // ← NEW: refresh parent
}

export const InventoryTabs = ({
  filteredProducts,
  lowStockItems,
  expiringItems,
  loading,
  onRestock,
  onEdit,
  onDelete,
  onRefresh
}: InventoryTabsProps) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleMarkSorted = async (productId: string) => {
    setRefreshing(true);
    try {
      const { data: product } = await supabase
        .from('products')
        .select('expiry_queue')
        .eq('id', productId)
        .single();

      const newQueue = product?.expiry_queue?.slice(1) || [];

      await supabase
        .from('products')
        .update({ expiry_queue: newQueue })
        .eq('id', productId);

      toast({
        title: "Sorted!",
        description: "Expiry removed. Next batch ready.",
      });

      onRefresh(); // ← Triggers parent re-fetch
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark as sorted",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Tabs defaultValue="all" className="space-y-4">
      <TabsList>
        <TabsTrigger value="all">All Products ({filteredProducts.length})</TabsTrigger>
        <TabsTrigger value="low-stock">
          Low Stock
          {lowStockItems.length > 0 && (
            <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
              {lowStockItems.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="expiring">
          Expiring Soon
          {expiringItems.length > 0 && (
            <span className="ml-2 rounded-full bg-orange-500 px-2 py-0.5 text-xs text-white">
              {expiringItems.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-4">
        {filteredProducts.length === 0 && !loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <ProductGrid
            products={filteredProducts}
            loading={loading}
            onRestock={onRestock}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </TabsContent>

      <TabsContent value="low-stock" className="space-y-4">
        {lowStockItems.length === 0 && !loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No low stock items</p>
          </div>
        ) : (
          <ProductGrid
            products={lowStockItems}
            loading={loading}
            onRestock={onRestock}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </TabsContent>

      <TabsContent value="expiring" className="space-y-4">
        {expiringItems.length === 0 && !loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No expiring items. You're all clear!
            </p>
          </div>
        ) : (
          <ExpiringItemsTable
            products={expiringItems}
            loading={loading || refreshing}
            onMarkExpired={handleMarkSorted}
            onRefresh={onRefresh}
          />
        )}
      </TabsContent>
    </Tabs>
  );
};