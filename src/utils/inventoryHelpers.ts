
import { Product } from '@/utils/supabaseUtils';
import { Product as FrontendProduct, ProductCategory, UnitOfMeasure } from '@/types/product';

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
export const convertToFrontendProduct = (product: Partial<Product>): FrontendProduct => {
  return {
    id: product.id || '',
    name: product.name || '',
    brand: product.name || '', // Use name as brand since database doesn't have brand field
    quantity: product.stock_quantity || 0,
    unitOfMeasure: 'piece' as UnitOfMeasure,
    buyingPrice: product.cost || 0,
    sellingPrice: product.price || 0,
    category: (product.category || 'personal-care') as ProductCategory,
    taxRate: 16,
    supplier: undefined,
    barcode: convertBarcodeToString(product.barcode),
    image_url: product.image_url || undefined,
    receivedDate: product.created_at || undefined,
    expiryDate: product.expiry_date || undefined,
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
