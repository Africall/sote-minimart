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
  // RESTOCK STATE COMMENTED OUT FOR SAFETY
  // const [restockOpen, setRestockOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FrontendProduct | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<FrontendProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [transferStockOpen, setTransferStockOpen] = useState(false);

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
    // RESTOCK HANDLER COMMENTED OUT FOR SAFETY
    // handleRestock,
    handleMarkExpired
  } = useInventoryActions(fetchInventoryData);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  // Enhanced search filter with safe barcode handling
  const filteredProducts = products.filter(product => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return true;
    
    const nameMatch = product.name.toLowerCase().includes(searchLower);
    const barcodeMatch = searchInBarcode(product.barcode, searchLower);
    const categoryMatch = product.category.toLowerCase().includes(searchLower);
    
    return nameMatch || barcodeMatch || categoryMatch;
  });

  // Convert expiring items to frontend products for consistent handling
  const convertedExpiringItems = expiringItems.map(convertToFrontendProduct);

  // Handle delete product with improved error handling
  const handleDeleteProduct = async () => {
    if (!productToDelete) {
      toast.error('No product selected for deletion');
      return;
    }
    
    setIsDeleting(true);
    
    try {
      console.log('Deleting product:', productToDelete.id, productToDelete.name);
      
      await deleteProduct(productToDelete.id);
      
      toast.success(`"${productToDelete.name}" has been deleted successfully`);
      
      // Refresh the inventory list
      await fetchInventoryData();
      
      // Close dialog and clear state
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error?.message || 'Failed to delete product. Please try again.');
    } finally {
      setIsDeleting(false);
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

  // Handle delete action from product card
  const handleDeleteClick = (product: FrontendProduct) => {
    console.log('Delete clicked for product:', product.id, product.name);
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
        expiringItems={convertedExpiringItems}
        loading={loading}
      />

      <InventoryTabs
        filteredProducts={filteredProducts}
        lowStockItems={filteredLowStockItems}
        expiringItems={filteredExpiringItems}
        loading={loading}
        // RESTOCK HANDLER COMMENTED OUT FOR SAFETY
        // onRestock={(product) => {
        //   setSelectedProduct(product);
        //   setRestockOpen(true);
        // }}
        onRestock={() => {}}
        onEdit={(product) => {
          setSelectedProduct(product);
          setEditOpen(true);
        }}
        onDelete={handleDeleteClick}
        onMarkExpired={(productId) => handleMarkExpired(productId, products)}
      />

      <InventoryDialogs
        addProductOpen={addProductOpen}
        editOpen={editOpen}
        // RESTOCK PROPS COMMENTED OUT FOR SAFETY
        // restockOpen={restockOpen}
        restockOpen={false}
        selectedProduct={selectedProduct}
        actionLoading={actionLoading}
        onAddProductOpenChange={setAddProductOpen}
        onEditOpenChange={setEditOpen}
        // onRestockOpenChange={setRestockOpen}
        onRestockOpenChange={() => {}}
        onAddProduct={handleAddProduct}
        onEditProduct={handleEditProduct}
        // onRestock={handleRestock}
        onRestock={async () => {}}
        onSelectedProductChange={setSelectedProduct}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{productToDelete?.name}"</strong>?
              <br /><br />
              This action cannot be undone. The product will be permanently removed from your inventory.
              All sales history and related data will remain intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProduct} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Product'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Stock Dialog */}
      <TransferStockDialog
        open={transferStockOpen}
        onOpenChange={setTransferStockOpen}
        onTransferComplete={fetchInventoryData}
      />
    </div>
  );
};

export default InventoryDashboardPage;
