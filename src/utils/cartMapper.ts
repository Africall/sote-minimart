
import { Product } from '@/types/product';
import { CartItem } from '@/types/cart';

export const productToCartItem = (product: Product, quantity: number = 1): Omit<CartItem, 'discount'> => {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand || '',
    quantity,
    unitOfMeasure: product.unitOfMeasure,
    buyingPrice: product.buyingPrice,
    sellingPrice: product.sellingPrice,
    category: product.category,
    taxRate: product.taxRate || 0.16,
    supplier: product.supplier,
    barcode: product.barcode,
    imageUrl: product.image_url,
    receivedDate: product.receivedDate,
    expiryDate: product.expiryDate,
    reorderLevel: product.reorderLevel,
    inventoryAge: product.inventoryAge,
    packSize: product.packSize,
    is_quick_item: product.is_quick_item,
    created_at: product.created_at,
    updated_at: product.updated_at,
  };
};

export const validateProductForCart = (product: Product): { isValid: boolean; error?: string } => {
  // Check if product is expired
  if (product.expiryDate && new Date(product.expiryDate) < new Date()) {
    return { isValid: false, error: 'Product has expired' };
  }

  // Check if product has valid pricing
  if (!product.sellingPrice || product.sellingPrice <= 0) {
    return { isValid: false, error: 'Product has invalid pricing' };
  }

  // Check if product is out of stock
  if (product.quantity !== undefined && product.quantity <= 0) {
    return { isValid: false, error: 'This product is out of stock and cannot be added to cart' };
  }
  
  return { isValid: true };
};
