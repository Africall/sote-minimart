
import { Product } from '@/types/product';

export interface Activity {
  id: string;
  type: string;
  description: string;
  performedByName: string;
  date: string;
  remarks?: string;
}

export const calculateInventoryAge = (receivedDate: string): number => {
  const received = new Date(receivedDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - received.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getStockStatus = (quantity: number, reorderLevel: number): 'low' | 'medium' | 'high' => {
  if (quantity <= reorderLevel) return 'low';
  if (quantity <= reorderLevel * 2) return 'medium';
  return 'high';
};

export const getExpiryStatus = (expiryDate: string | null): 'expired' | 'expiring' | 'fresh' => {
  if (!expiryDate) return 'fresh';
  
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'expired';
  if (diffDays <= 7) return 'expiring';
  return 'fresh';
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const calculateTotalValue = (products: Product[]): number => {
  return products.reduce((total, product) => {
    return total + (product.sellingPrice * product.quantity);
  }, 0);
};

export const getProductCategories = (products: Product[]): string[] => {
  const categories = products.map(product => product.category);
  return [...new Set(categories)].sort();
};

export const filterProductsByCategory = (products: Product[], category: string): Product[] => {
  return products.filter(product => product.category === category);
};

export const searchProducts = (products: Product[], query: string): Product[] => {
  const searchTerm = query.toLowerCase();
  return products.filter(product =>
    product.name.toLowerCase().includes(searchTerm) ||
    product.brand?.toLowerCase().includes(searchTerm) ||
    product.category.toLowerCase().includes(searchTerm) ||
    product.barcode?.toLowerCase().includes(searchTerm)
  );
};

export const getRecentActivity = async (): Promise<Activity[]> => {
  // Mock data for now - this would be replaced with actual database calls
  return [
    {
      id: '1',
      type: 'restock',
      description: 'Restocked Coca Cola 500ml',
      performedByName: 'John Doe',
      date: new Date().toISOString(),
      remarks: 'Added 50 units'
    },
    {
      id: '2',
      type: 'edit',
      description: 'Updated price for Bread White',
      performedByName: 'Jane Smith',
      date: new Date(Date.now() - 3600000).toISOString(),
      remarks: 'Price changed from KES 50 to KES 55'
    }
  ];
};

export const getFormattedDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
