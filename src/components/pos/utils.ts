
import { Product, ProductCategory, UnitOfMeasure } from "@/types/product";
import { v4 as uuidv4 } from 'uuid';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(amount);
};

export const createQuickItem = (item: { id: string; name: string; price: number }): Product => {
  return {
    id: uuidv4(),
    name: item.name,
    brand: "Quick Item",
    quantity: 100,
    unitOfMeasure: 'item' as UnitOfMeasure,
    buyingPrice: item.price * 0.7,
    sellingPrice: item.price,
    category: 'Quick Items' as ProductCategory,
    taxRate: 16,
    barcode: `QI-${item.id}`,
    supplier: 'Quick Supplier',
    image_url: '/path/to/default/image.jpg',
    receivedDate: new Date().toISOString(),
    reorderLevel: 10
  };
};

export const LOW_STOCK_THRESHOLD = 10;
export const OUT_OF_STOCK_THRESHOLD = 0;

export const CATEGORY_COLORS = {
  'Beverages': 'bg-cyan-100 text-cyan-800',
  'Bakery': 'bg-yellow-100 text-yellow-800',
  'Canned Goods': 'bg-green-100 text-green-800',
  'Dairy': 'bg-blue-100 text-blue-800',
  'Dry Goods': 'bg-amber-100 text-amber-800',
  'Frozen Foods': 'bg-cyan-100 text-cyan-800',
  'Meat': 'bg-red-100 text-red-800',
  'Produce': 'bg-green-100 text-green-800',
  'Cleaners': 'bg-purple-100 text-purple-800',
  'Paper Goods': 'bg-gray-100 text-gray-800',
  'Personal Care': 'bg-pink-100 text-pink-800',
  'Snacks': 'bg-amber-100 text-amber-800',
  'Quick Items': 'bg-orange-100 text-orange-800',
  // Additional categories
  'household': 'bg-purple-100 text-purple-800',
  'personal-care': 'bg-pink-100 text-pink-800',
  'beverages': 'bg-cyan-100 text-cyan-800',
  'dry-food': 'bg-yellow-100 text-yellow-800',
  'snacks': 'bg-amber-100 text-amber-800',
  'cleaning': 'bg-blue-100 text-blue-800',
  'cooking': 'bg-orange-100 text-orange-800',
  'Other': 'bg-gray-100 text-gray-800'
};
