
import { useEffect, useState } from 'react';
import { Product as FrontendProduct } from '@/types/product';
import { useInventoryData } from '@/hooks/useInventoryData';
import { useInventoryActions } from '@/hooks/useInventoryActions';
import { handleExport } from '@/utils/inventoryHelpers';
import { InventoryStats } from '@/components/inventory/InventoryStats';
import { InventoryHeader } from '@/components/inventory/InventoryHeader';
import { InventoryTabs } from '@/components/inventory/InventoryTabs';
import { InventoryDialogs } from '@/components/inventory/InventoryDialogs';
import { convertToFrontendProduct } from '@/utils/inventoryHelpers';
import { deleteProduct } from '@/utils/supabaseUtils';
import { toast } from 'sonner';
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

// Helper function to safely handle barcode search
const searchInBarcode = (barcode: string | string[] | undefined, searchQuery: string): boolean => {
  if (!barcode || !searchQuery) return false;
  
  if (Array.isArray(barcode)) {
    return barcode.some(code => 
      typeof code === 'string' && code.toLowerCase().includes(searchQuery)
    );
  }
  
  return typeof barcode === 'string' && barcode.toLowerCase().includes(searchQuery);
};

const InventoryDashboardPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [restockOpen, setRestockOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FrontendProduct | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<FrontendProduct | null>(null);

  const {
    products,
    lowStockItems,
    expiringItems,
    inventoryValue,
    loading,
    fetchInventoryData
  } = useInventoryData();

  const {
    actionLoading,
    handleAddProduct,
    handleEditProduct,
    handleRestock,
    handleMarkExpired
  } = useInventoryActions(fetchInventoryData);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  // Enhanced search filter with safe barcode handling
  const filteredProducts = products.filter(product => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return true;
    
    console.log('Searching for:', searchLower);
    console.log('Checking product:', product.name);
    
    const nameMatch = product.name.toLowerCase().includes(searchLower);
    const barcodeMatch = searchInBarcode(product.barcode, searchLower);
    const categoryMatch = product.category.toLowerCase().includes(searchLower);
    
    const isMatch = nameMatch || barcodeMatch || categoryMatch;
    
    if (isMatch) {
      console.log('Match found:', product.name, { nameMatch, barcodeMatch, categoryMatch });
    }
    
    return isMatch;
  });

  console.log('Total products:', products.length);
  console.log('Filtered products:', filteredProducts.length);
  console.log('Search query:', searchQuery);

  // Convert expiring items to frontend products for consistent handling
  const convertedExpiringItems = expiringItems.map(convertToFrontendProduct);

  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      await deleteProduct(productToDelete.id);
      toast.success('Product deleted successfully');
      await fetchInventoryData();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product: ' + error.message);
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  // Filter low stock items based on search query with safe barcode handling
  const filteredLowStockItems = lowStockItems.filter(product => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return true;
    
    return (
      product.name.toLowerCase().includes(searchLower) ||
      searchInBarcode(product.barcode, searchLower) ||
      product.category.toLowerCase().includes(searchLower)
    );
  });

  // Filter expiring items based on search query with safe barcode handling
  const filteredExpiringItems = convertedExpiringItems.filter(product => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return true;
    
    return (
      product.name.toLowerCase().includes(searchLower) ||
      searchInBarcode(product.barcode, searchLower) ||
      product.category.toLowerCase().includes(searchLower)
    );
  });
  
  return (
    <div className="space-y-6">
      <InventoryHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExport={() => handleExport(products)}
        onAddProduct={() => setAddProductOpen(true)}
      />
      
      <InventoryStats
        inventoryValue={inventoryValue}
        lowStockItems={lowStockItems}
        expiringItems={convertedExpiringItems}
        loading={loading}
      />

      <InventoryTabs
        filteredProducts={filteredProducts}
        lowStockItems={filteredLowStockItems}
        expiringItems={filteredExpiringItems}
        loading={loading}
        onRestock={(product) => {
          setSelectedProduct(product);
          setRestockOpen(true);
        }}
        onEdit={(product) => {
          setSelectedProduct(product);
          setEditOpen(true);
        }}
        onDelete={(product) => {
          setProductToDelete(product);
          setDeleteDialogOpen(true);
        }}
        onMarkExpired={(productId) => handleMarkExpired(productId, products)}
      />

      <InventoryDialogs
        addProductOpen={addProductOpen}
        editOpen={editOpen}
        restockOpen={restockOpen}
        selectedProduct={selectedProduct}
        actionLoading={actionLoading}
        onAddProductOpenChange={setAddProductOpen}
        onEditOpenChange={setEditOpen}
        onRestockOpenChange={setRestockOpen}
        onAddProduct={handleAddProduct}
        onEditProduct={handleEditProduct}
        onRestock={handleRestock}
        onSelectedProductChange={setSelectedProduct}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{productToDelete?.name}". This action cannot be undone.
              All sales history and related data will remain intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground">
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InventoryDashboardPage;
