
import { supabase } from "@/integrations/supabase/client";

// Product categories
export type ProductCategory = 
  | 'personal-care' 
  | 'beverages' 
  | 'dry-food' 
  | 'snacks' 
  | 'cleaning' 
  | 'cooking'
  | 'household';

// Units of measure
export type UnitOfMeasure = 
  | 'piece' 
  | 'packet' 
  | 'carton' 
  | 'bale' 
  | 'outer' 
  | 'dozen'
  | 'tin'
  | 'jar'
  | 'sachet';

// Product interface with consistent field naming
export interface Product {
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
  image_url?: string; // Use consistent database field name
  receivedDate?: string;
  expiryDate?: string;
  reorderLevel?: number;
  inventoryAge?: number;
  packSize?: string;
  is_quick_item?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Category information
export interface CategoryInfo {
  id: ProductCategory;
  name: string;
  description: string;
  icon: string;
}

export const UnitOfMeasureOptions = async ()=>{
const { data: units_of_measure, error } = await supabase
  .from('units_of_measure')
  .select('*');
  if (error) {
    return error.message;
  }
  return units_of_measure as UnitOfMeasure[];

};
//filter products

export const filteredProducts = async (searchQuery, selectedCategory) => {
const { data: filteredProducts, error } = await supabase
  .from('products')
  .select('*')
  .ilike('name', `%${searchQuery}%`)
  .or(
    `brand.ilike.%${searchQuery}%,barcode.ilike.%${{searchQuery}}%`
  )
  .match(selectedCategory !== 'all' ? { category: selectedCategory } : {});
  if (error) {
    return error.message;
  }
  return filteredProducts as Product[];
};

// Products
export const getAllProducts = async () => {
const { data: products, error } = await supabase
  .from('products')
  .select('*')
  .order('name', { ascending: true });
  if (error) {
    return error.message;
  }
  return products as Product[];
};

// Category data
export const productCategories = async ()=>{
  const { data: product_categories, error } = await supabase
  .from('product_categories')
  .select('*');
  if (error) {
    console.error('Error fetching product categories:', error.message);
    return [];
  }
  return product_categories as CategoryInfo[];
};

// Product service functions
export const getProductsByCategory = async (categoryId: ProductCategory) => {
  const  { data: products, error } = await supabase
  .from('products')
  .select(`${categoryId}, id, name, brand, quantity, unitOfMeasure, buyingPrice, sellingPrice, taxRate, supplier, barcode, image_url, receivedDate, expiryDate, reorderLevel, inventoryAge, packSize`)
if (error) {
    console.error('Error fetching products by category:', error.message);
    return [];
  }
  return products ;
};

export const getProductById = async  (productId: string)=> {
 const { data: products, error } = await supabase
  .from('products')
  .select(`${productId}, name, brand, quantity, unitOfMeasure, buyingPrice, sellingPrice, taxRate, supplier, barcode, image_url, receivedDate, expiryDate, reorderLevel, inventoryAge, packSize`);
  if (error) {
    console.error('Error fetching product by ID:', error.message);
    return null;
  }
  return products ;
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('name', `%${query}%`) // case-insensitive partial match on name
    .or(`barcode.eq.${query}`);  // exact match on barcode

  if (error) {
    console.error('Error searching products:', error);
    return [];
  }

  return data as Product[];
};

// Add new utility functions for inventory age

export const getExpiringProducts = async (daysThreshold: number = 30): Promise<Product[]> => {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysThreshold);

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .gte('expiry_date', today.toISOString())
    .lte('expiry_date', futureDate.toISOString());

  if (error) {
    console.error('Error fetching expiring products:', error);
    return [];
  }

  return data as Product[];
};

// Database product interface for functions that return database format
export interface DatabaseProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock_quantity: number;
  reorder_level: number | null;
  sku: string | null;
  barcode: string[] | null;
  description: string | null;
  expiry_date: string | null;
  supplier_id: string | null;
  image_url: string | null;
  is_featured: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export const getProductsNeedingReorder = async (): Promise<DatabaseProduct[]> => {
  const { data, error } = await supabase.rpc('get_products_needing_reorder');

  if (error) {
    console.error('Error fetching products needing reorder:', error.message);
    return [];
  }

  return data as DatabaseProduct[];
};

export const getInventoryAgeStats = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('inventory_age')
    .not('inventory_age', 'is', null); // Only include rows with defined inventory_age

  if (error) {
    console.error('Error fetching inventory ages:', error);
    return { average: 0, oldest: 0, newest: 0, total: 0 };
  }

  const ages = data.map(p => p.inventory_age || 0);
  const total = ages.length;

  if (total === 0) return { average: 0, oldest: 0, newest: 0, total };

  const average = Math.round(ages.reduce((sum, age) => sum + age, 0) / total);
  const oldest = Math.max(...ages);
  const newest = Math.min(...ages);

  return { average, oldest, newest, total };
};
