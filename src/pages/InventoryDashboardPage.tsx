import { useEffect, useState } from 'react';
import { Product as FrontendProduct } from '@/types/product';
import { useInventoryData } from '@/hooks/useInventoryData';
import { useInventoryActions } from '@/hooks/useInventoryActions';
import { handleExport } from '@/utils/inventoryHelpers';
import { InventoryStats } from '@/components/inventory/InventoryStats';
import { InventoryHeader } from '@/components/inventory/InventoryHeader';
import { InventoryTabs } from '@/components/inventory/InventoryTabs';
import { InventoryDialogs } from '@/components/inventory/InventoryDialogs';
import { TransferStockDialog } from '@/components/inventory/TransferStockDialog';
import { convertToFrontendProduct } from '@/utils/inventoryHelpers';
import { deleteProduct } from '@/utils/supabaseUtils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const searchInBarcode = (barcode: string | string[] | undefined, searchQuery: string): boolean => {
  if (!barcode || !searchQuery) return false;
  if (Array.isArray(barcode)) {
    return barcode.some(code => typeof code === 'string' && code.toLowerCase().includes(searchQuery));
  }
  return typeof barcode === 'string' && barcode.toLowerCase().includes(searchQuery);
};

const InventoryDashboardPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FrontendProduct | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<FrontendProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [transferStockOpen, setTransferStockOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    products,
    lowStockItems,
    expiringItems: rawExpiringItems,
    inventoryValue,
    loading,
    fetchInventoryData
  } = useInventoryData();

  const {
    actionLoading,
    handleAddProduct,
    handleEditProduct,
    handleMarkExpired
  } = useInventoryActions(fetchInventoryData);

  // FETCH EXPIRING ITEMS WITH expiry_queue
  const [expiringItems, setExpiringItems] = useState<FrontendProduct[]>([]);

  const fetchExpiringItems = async () => {
    console.log('=== FETCH EXPIRING ITEMS START ===');
    setRefreshing(true);
    try {
      console.log('DEBUG: Starting fetch of expiring items...');
      console.log('DEBUG: Querying products where expiry_queue is NOT null');
      
      const { data, error } = await supabase
        .from('products')
        .select('*');

      console.log('DEBUG: After fetch all products:', {
        error,
        totalProducts: data?.length
      });

      if (error) {
        console.error('DEBUG: Supabase error:', error);
        toast.error("Failed to load expiring items");
        setExpiringItems([]);
        return;
      }

      console.log('DEBUG: All products from DB:', data?.map((p: any) => ({
        id: p.id,
        name: p.name,
        expiry_queue: p.expiry_queue,
        hasExpiry: !!p.expiry_queue
      })));

      // Calculate date 30 days from now
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      console.log('DEBUG: Filtering for items expiring within 30 days:', {
        today: today.toISOString(),
        thirtyDaysFromNow: thirtyDaysFromNow.toISOString()
      });

      // Filter products with expiry_queue that expire within 30 days
      const productsWithExpiry = (data || []).filter((p: any) => {
        const queue = p.expiry_queue;
        const hasQueue = Array.isArray(queue) && queue.length > 0;
        
        if (!hasQueue) return false;

        // Sort the queue to find the nearest date to today
        const sortedQueue = [...queue].sort((a, b) => {
          return new Date(a).getTime() - new Date(b).getTime();
        });

        // Find the nearest expiry date (closest to today, not necessarily first)
        const nearestExpiry = sortedQueue.find((date: string) => {
          const expiryDate = new Date(date);
          return expiryDate >= today;
        });

        if (!nearestExpiry) return false;

        const expiryDate = new Date(nearestExpiry);
        const isExpiringSoon = expiryDate <= thirtyDaysFromNow && expiryDate >= today;

        if (hasQueue) {
          console.log(`DEBUG: Product ${p.name}:`, {
            expiry_queue: queue,
            sortedQueue,
            nearestExpiry,
            expiryDate: expiryDate.toISOString(),
            isExpiringSoon
          });
        }

        return isExpiringSoon;
      });
      
      console.log('DEBUG: After filtering - products expiring within 30 days:', {
        count: productsWithExpiry.length,
        products: productsWithExpiry.map((p: any) => ({
          id: p.id,
          name: p.name,
          expiry_queue: p.expiry_queue
        }))
      });

      // Sort products by their nearest expiry date
      productsWithExpiry.sort((a, b) => {
        const queueA = (a as any).expiry_queue || [];
        const queueB = (b as any).expiry_queue || [];
        
        // Find nearest date for product A
        const sortedA = [...queueA].sort((x: string, y: string) => 
          new Date(x).getTime() - new Date(y).getTime()
        );
        const nearestA = sortedA.find((date: string) => new Date(date) >= today);
        
        // Find nearest date for product B
        const sortedB = [...queueB].sort((x: string, y: string) => 
          new Date(x).getTime() - new Date(y).getTime()
        );
        const nearestB = sortedB.find((date: string) => new Date(date) >= today);
        
        if (!nearestA || !nearestB) return 0;
        return new Date(nearestA).getTime() - new Date(nearestB).getTime();
      });

      const converted = productsWithExpiry.map((p: any) => convertToFrontendProduct(p));
      console.log('DEBUG: After conversion:', {
        count: converted.length,
        samples: converted.map(p => ({
          id: p.id,
          name: p.name,
          expiry_queue: p.expiry_queue,
          expiryDate: p.expiryDate
        }))
      });
      
      setExpiringItems(converted);
      console.log('=== FETCH EXPIRING ITEMS END - Items set:', converted.length, '===');
    } catch (err) {
      console.error("DEBUG: Fetch error:", err);
      toast.error("Failed to load expiring items");
      setExpiringItems([]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
    fetchExpiringItems();
  }, [fetchInventoryData]);

  // REFRESH BOTH LISTS
  const handleRefresh = () => {
    fetchInventoryData();
    fetchExpiringItems();
  };

  // MARK AS SORTED
  const handleMarkSorted = async (productId: string) => {
    setRefreshing(true);
    try {
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('expiry_queue')
        .eq('id', productId)
        .single();

      if (fetchError || !product) {
        toast.error("Failed to fetch product");
        return;
      }

      const currentQueue = Array.isArray((product as any).expiry_queue) 
        ? (product as any).expiry_queue 
        : [];
      
      const newQueue = currentQueue.slice(1);

      const { error: updateError } = await supabase
        .from('products')
        .update({
          expiry_queue: newQueue
        } as any)
        .eq('id', productId);

      if (updateError) {
        toast.error("Failed to update expiry queue");
        return;
      }

      toast.success("Sorted! Next batch ready.");
      handleRefresh();
    } catch (error) {
      toast.error("Failed to mark as sorted");
    } finally {
      setRefreshing(false);
    }
  };

  // FILTERING
  const filteredProducts = products.filter(product => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      product.name.toLowerCase().includes(q) ||
      searchInBarcode(product.barcode, q) ||
      product.category.toLowerCase().includes(q)
    );
  });

  const filteredLowStockItems = lowStockItems.filter(product => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      product.name.toLowerCase().includes(q) ||
      searchInBarcode(product.barcode, q) ||
      product.category.toLowerCase().includes(q)
    );
  });

  const filteredExpiringItems = expiringItems.filter(product => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      product.name.toLowerCase().includes(q) ||
      searchInBarcode(product.barcode, q) ||
      product.category.toLowerCase().includes(q)
    );
  });

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      toast.success(`"${productToDelete.name}" deleted`);
      handleRefresh();
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (product: FrontendProduct) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <InventoryHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExport={() => handleExport(products)}
        onAddProduct={() => setAddProductOpen(true)}
        onTransferStock={() => setTransferStockOpen(true)}
      />
      
      <InventoryStats
        inventoryValue={inventoryValue}
        lowStockItems={lowStockItems}
        expiringItems={expiringItems}
        loading={loading || refreshing}
      />

      <InventoryTabs
        filteredProducts={filteredProducts}
        lowStockItems={filteredLowStockItems}
        expiringItems={filteredExpiringItems}
        loading={loading || refreshing}
        onRestock={() => {}}
        onEdit={(product) => {
          setSelectedProduct(product);
          setEditOpen(true);
        }}
        onDelete={handleDeleteClick}
        onRefresh={handleRefresh}
      />

      <InventoryDialogs
        addProductOpen={addProductOpen}
        editOpen={editOpen}
        restockOpen={false}
        selectedProduct={selectedProduct}
        actionLoading={actionLoading}
        onAddProductOpenChange={setAddProductOpen}
        onEditOpenChange={setEditOpen}
        onRestockOpenChange={() => {}}
        onAddProduct={handleAddProduct}
        onEditProduct={handleEditProduct}
        onRestock={async () => {}}
        onSelectedProductChange={setSelectedProduct}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{productToDelete?.name}"</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProduct} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TransferStockDialog
        open={transferStockOpen}
        onOpenChange={setTransferStockOpen}
        onTransferComplete={handleRefresh}
      />
    </div>
  );
};

export default InventoryDashboardPage;
