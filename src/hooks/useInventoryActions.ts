
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
      
      // CRITICAL FIX: Remove stock_quantity if accidentally included
      const { stock_quantity, ...safeData } = productData;
      
      if (stock_quantity !== undefined) {
        console.warn('PREVENTED: stock_quantity was in edit data, removing it:', stock_quantity);
        toast.warning('Stock quantity cannot be edited here. Use Restock button.');
      }
      
      // Create a clean update object with only the fields that should be updated
      const updateData: Partial<Product> = {};
      
      // Only add fields that are defined in safeData (no stock_quantity)
      if (safeData.name !== undefined) updateData.name = safeData.name;
      if (safeData.category !== undefined) updateData.category = safeData.category;
      if (safeData.cost !== undefined) updateData.cost = safeData.cost;
      if (safeData.price !== undefined) updateData.price = safeData.price;
      if (safeData.reorder_level !== undefined) updateData.reorder_level = safeData.reorder_level;
      if (safeData.sku !== undefined) updateData.sku = safeData.sku;
      if (safeData.barcode !== undefined) updateData.barcode = safeData.barcode;
      if (safeData.expiry_date !== undefined) updateData.expiry_date = safeData.expiry_date;
      if (safeData.image_url !== undefined) updateData.image_url = safeData.image_url;
      if (safeData.description !== undefined) updateData.description = safeData.description;
      if (safeData.is_featured !== undefined) updateData.is_featured = safeData.is_featured;
      if (safeData.supplier_id !== undefined) updateData.supplier_id = safeData.supplier_id;
      
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
