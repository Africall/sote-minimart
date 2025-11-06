
import { Product } from '@/utils/supabaseUtils';
import { Product as FrontendProduct, ProductCategory, UnitOfMeasure } from '@/types/product';

// Add this type — it matches your REAL database
interface DBProduct {
  id: string;
  name: string;
  stock_quantity: number;
  price: number;
  cost: number;
  category: string;
  barcode: string | string[] | null;
  expiry_queue?: string[] | null;
  expiry_date?: string | null;
  image_url?: string | null;
  created_at?: string | null;
  reorder_level?: number | null;
  is_featured?: boolean | null;
}

// Helper function to safely convert barcode array to string
const convertBarcodeToString = (barcode: string | string[] | null | undefined): string | undefined => {
  if (!barcode) return undefined;
  
  if (Array.isArray(barcode)) {
    // Join array elements with comma and space, filter out empty strings
    const validCodes = barcode.filter(code => code && typeof code === 'string' && code.trim().length > 0);
    return validCodes.length > 0 ? validCodes.join(', ') : undefined;
  }
  
  return typeof barcode === 'string' && barcode.trim().length > 0 ? barcode : undefined;
};



// Helper function to convert database Product to FrontendProduct with safe defaults
export const convertToFrontendProduct = (product: any): FrontendProduct => {
  // Log raw product data for debugging
  console.log('convertToFrontendProduct - Raw product from DB:', {
    id: product.id,
    name: product.name,
    expiry_queue: product.expiry_queue,
    expiry_date: product.expiry_date
  });

  // Safely extract expiry_queue
  const expiryQueue = Array.isArray(product.expiry_queue) ? product.expiry_queue : [];
  
  // Find the nearest expiry date (closest to today, not FIFO)
  const today = new Date();
  const sortedQueue = [...expiryQueue].sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });
  
  // Find the nearest date that's >= today
  const nextExpiryDate = sortedQueue.find((date: string) => {
    const expiryDate = new Date(date);
    return expiryDate >= today;
  }) || sortedQueue[sortedQueue.length - 1] || product.expiry_date || undefined;

  console.log('convertToFrontendProduct - Processed:', {
    id: product.id,
    expiry_queue: expiryQueue,
    sortedQueue,
    nextExpiryDate: nextExpiryDate
  });

  return {
    id: product.id || '',
    name: product.name || '',
    brand: product.name || '',
    quantity: product.stock_quantity || product.quantity || 0,
    unitOfMeasure: 'piece' as UnitOfMeasure,
    buyingPrice: product.cost || 0,
    sellingPrice: product.price || product.sellingPrice || 0,
    category: (product.category || 'personal-care') as ProductCategory,
    taxRate: 16,
    supplier: undefined,
    barcode: convertBarcodeToString(product.barcode),
    image_url: product.image_url || undefined,
    receivedDate: product.created_at || undefined,
    expiry_queue: expiryQueue,
    expiryDate: nextExpiryDate,
    reorderLevel: product.reorder_level || 10,
    inventoryAge: undefined,
    packSize: undefined,
    is_quick_item: product.is_featured || false,
    created_at: product.created_at || undefined,
    updated_at: product.updated_at || undefined
  };
};

export const handleExport = (products: FrontendProduct[]) => {
  console.log('Exporting products:', products.slice(0, 3).map(p => ({ 
    name: p.name, 
    buyingPrice: p.buyingPrice,
    sellingPrice: p.sellingPrice
  })));
  
  // Create CSV content
  const headers = ['Name', 'SKU', 'Category', 'Stock', 'Reorder Level', 'Price', 'Value'];
  const rows = products.map(product => [
    product.name,
    product.barcode || 'N/A',
    product.category,
    product.quantity || 0,
    product.reorderLevel || 10,
    product.sellingPrice || 0,
    // Ensure we handle NaN values in CSV export
    (typeof product.buyingPrice === 'number' && !isNaN(product.buyingPrice) && 
     typeof product.quantity === 'number' && !isNaN(product.quantity)) 
      ? ((product.buyingPrice || 0) * (product.quantity || 0)).toFixed(2)
      : '0.00'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `inventory-report-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
