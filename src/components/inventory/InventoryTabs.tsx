
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Product as FrontendProduct } from '@/types/product';
import { ProductGrid } from './ProductGrid';
import { LowStockTable } from './LowStockTable';
import ExpiringItemsTable from './ExpiringItemsTable';

interface InventoryTabsProps {
  filteredProducts: FrontendProduct[];
  lowStockItems: FrontendProduct[];
  expiringItems: FrontendProduct[];
  loading: boolean;
  onRestock: (product: FrontendProduct) => void;
  onEdit: (product: FrontendProduct) => void;
  onDelete?: (product: FrontendProduct) => void;
  onMarkExpired: (productId: string) => void;
}

export const InventoryTabs = ({
  filteredProducts,
  lowStockItems,
  expiringItems,
  loading,
  onRestock,
  onEdit,
  onDelete,
  onMarkExpired
}: InventoryTabsProps) => {
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
            <p className="text-muted-foreground">No products found matching your search criteria</p>
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
            <p className="text-muted-foreground">No low stock items found matching your search criteria</p>
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
            <p className="text-muted-foreground">No expiring items found matching your search criteria</p>
          </div>
        ) : (
          <ExpiringItemsTable
            products={expiringItems}
            loading={loading}
            onMarkExpired={onMarkExpired}
          />
        )}
      </TabsContent>
    </Tabs>
  );
};
