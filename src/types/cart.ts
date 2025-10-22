
import { ProductCategory, UnitOfMeasure } from './product';

export interface CartItem {
  id: string;
  name: string;
  brand: string;
  quantity: number;
  unitOfMeasure: UnitOfMeasure;
  buyingPrice: number;
  sellingPrice: number;
  category: ProductCategory;
  taxRate: number;
  supplier?: string;
  barcode?: string;
  imageUrl?: string;
  receivedDate?: string;
  expiryDate?: string;
  reorderLevel?: number;
  inventoryAge?: number;
  packSize?: string;
  is_quick_item?: boolean;
  created_at?: string;
  updated_at?: string;
  discount: number;
}
