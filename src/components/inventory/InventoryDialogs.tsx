
import { Product as FrontendProduct } from '@/types/product';
import { Product } from '@/utils/supabaseUtils';
import { AddProductDialog } from './AddProductDialog';
import { EditProductDialog } from './EditProductDialog';
import { RestockDialog } from './RestockDialog';

interface InventoryDialogsProps {
  addProductOpen: boolean;
  editOpen: boolean;
  restockOpen: boolean;
  selectedProduct: FrontendProduct | null;
  actionLoading: boolean;
  onAddProductOpenChange: (open: boolean) => void;
  onEditOpenChange: (open: boolean) => void;
  onRestockOpenChange: (open: boolean) => void;
  onAddProduct: (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onEditProduct: (productId: string, productData: Partial<Product>) => Promise<boolean>;
  onRestock: (productId: string, quantity: number) => Promise<void>;
  onSelectedProductChange: (product: FrontendProduct | null) => void;
}

export const InventoryDialogs = ({
  addProductOpen,
  editOpen,
  restockOpen,
  selectedProduct,
  actionLoading,
  onAddProductOpenChange,
  onEditOpenChange,
  onRestockOpenChange,
  onAddProduct,
  onEditProduct,
  onRestock,
  onSelectedProductChange
}: InventoryDialogsProps) => {
  const handleEditSubmit = async (productId: string, productData: Partial<Product>) => {
    console.log('InventoryDialogs: handleEditSubmit called with:', { productId, productData });
    
    try {
      const success = await onEditProduct(productId, productData);
      console.log('InventoryDialogs: onEditProduct returned:', success);
      
      if (success) {
        onSelectedProductChange(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('InventoryDialogs: Error in handleEditSubmit:', error);
      return false;
    }
  };

  return (
    <>
      <AddProductDialog
        open={addProductOpen}
        onOpenChange={onAddProductOpenChange}
        onSubmit={onAddProduct}
        loading={actionLoading}
      />

      <EditProductDialog
        open={editOpen}
        onOpenChange={(open) => {
          onEditOpenChange(open);
          if (!open) {
            onSelectedProductChange(null);
          }
        }}
        product={selectedProduct}
        onSubmit={handleEditSubmit}
        loading={actionLoading}
      />

      <RestockDialog
        open={restockOpen}
        onOpenChange={(open) => {
          onRestockOpenChange(open);
          if (!open) {
            onSelectedProductChange(null);
          }
        }}
        product={selectedProduct}
        onSubmit={async (productId, quantity) => {
          await onRestock(productId, quantity);
        }}
        loading={actionLoading}
      />
    </>
  );
};
