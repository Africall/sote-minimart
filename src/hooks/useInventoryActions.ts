
import { useState } from 'react';
import { 
  addProduct,
  updateProductStock,
  updateProduct,
  Product
} from '@/utils/supabaseUtils';
import { Product as FrontendProduct } from '@/types/product';
import { toast } from 'sonner';

export const useInventoryActions = (onDataChange: () => Promise<void>) => {
  const [actionLoading, setActionLoading] = useState(false);

  const handleAddProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('handleAddProduct: Starting with data:', productData);
      setActionLoading(true);
      
      const result = await addProduct(productData);
      console.log('handleAddProduct: Product added successfully:', result);
      
      await onDataChange();
      toast.success('Product added successfully');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product: ' + (error as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditProduct = async (productId: string, productData: Partial<Product>) => {
    try {
      setActionLoading(true);
      console.log('handleEditProduct: Starting update for product:', productId, productData);
      
      // Create a clean update object with only the fields that should be updated
      const updateData: Partial<Product> = {};
      
      // Add all fields that are defined in productData
      if (productData.name !== undefined) updateData.name = productData.name;
      if (productData.category !== undefined) updateData.category = productData.category;
      if (productData.cost !== undefined) updateData.cost = productData.cost;
      if (productData.price !== undefined) updateData.price = productData.price;
      if (productData.reorder_level !== undefined) updateData.reorder_level = productData.reorder_level;
      if (productData.sku !== undefined) updateData.sku = productData.sku;
      if (productData.barcode !== undefined) updateData.barcode = productData.barcode;
      if (productData.expiry_date !== undefined) updateData.expiry_date = productData.expiry_date;
      if (productData.image_url !== undefined) updateData.image_url = productData.image_url;
      if (productData.description !== undefined) updateData.description = productData.description;
      if (productData.is_featured !== undefined) updateData.is_featured = productData.is_featured;
      if (productData.supplier_id !== undefined) updateData.supplier_id = productData.supplier_id;
      
      // Allow stock_quantity updates (for admins)
      if (productData.stock_quantity !== undefined) {
        updateData.stock_quantity = productData.stock_quantity;
        console.log('handleEditProduct: Including stock_quantity in update:', productData.stock_quantity);
      }
      
      // Always set updated_at
      updateData.updated_at = new Date().toISOString();
      
      console.log('handleEditProduct: Calling updateProduct with safe data:', updateData);
      
      const result = await updateProduct(productId, updateData);
      console.log('handleEditProduct: Update result:', result);
      
      await onDataChange();
      toast.success('Product updated successfully');
      
      return true;
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product: ' + (error as Error).message);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestock = async (productId: string, quantity: number) => {
    try {
      console.log('handleRestock: Starting restock for product:', productId, 'quantity:', quantity);
      setActionLoading(true);
      
      // Ensure quantity is a proper integer
      const quantityChange = parseInt(quantity.toString(), 10);
      if (isNaN(quantityChange) || quantityChange <= 0) {
        throw new Error('Invalid quantity: must be a positive number');
      }
      
      console.log('handleRestock: Calling updateProductStock with:', productId, quantityChange);
      
      const result = await updateProductStock(productId, quantityChange);
      console.log('handleRestock: Stock update result:', result);
      
      if (result && result.success === false) {
        throw new Error(result.error || 'Failed to update stock');
      }
      
      await onDataChange();
      toast.success('Product restocked successfully');
    } catch (error) {
      console.error('Error restocking product:', error);
      toast.error('Failed to restock product: ' + (error as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkExpired = async (productId: string, products: FrontendProduct[]) => {
    try {
      console.log('handleMarkExpired: Starting for product:', productId);
      setActionLoading(true);
      
      const product = products.find(p => p.id === productId);
      if (!product) {
        throw new Error('Product not found');
      }
      
      const currentQuantity = product.quantity || 0;
      if (currentQuantity <= 0) {
        throw new Error('Product already has zero quantity');
      }
      
      console.log('handleMarkExpired: Reducing stock by:', currentQuantity);
      
      // Reduce stock to zero by subtracting current quantity
      const result = await updateProductStock(productId, -currentQuantity);
      console.log('handleMarkExpired: Stock update result:', result);
      
      if (result && result.success === false) {
        throw new Error(result.error || 'Failed to update stock');
      }
      
      await onDataChange();
      toast.success('Product marked as expired');
    } catch (error) {
      console.error('Error marking product as expired:', error);
      toast.error('Failed to mark product as expired: ' + (error as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  return {
    actionLoading,
    handleAddProduct,
    handleEditProduct,
    handleRestock,
    handleMarkExpired
  };
};
