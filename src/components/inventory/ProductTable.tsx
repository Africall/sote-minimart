
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, ArrowUpDown, Edit } from 'lucide-react';
import { formatCurrency } from '@/utils/supabaseUtils';
import { Product as FrontendProduct } from '@/types/product';
import { ProductImage } from './ProductImage';

interface ProductTableProps {
  products: FrontendProduct[];
  loading: boolean;
  onRestock?: (product: FrontendProduct) => void;
  onEdit?: (product: FrontendProduct) => void;
}

type SortField = 'name' | 'stock' | 'price' | 'value';
type SortDirection = 'asc' | 'desc';

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  loading,
  onRestock,
  onEdit
}) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Helper function to get stock quantity from quantity field
  const getStockQuantity = (product: FrontendProduct) => {
    return product.quantity || 0;
  };

  const sortedProducts = [...products].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'stock':
        comparison = getStockQuantity(a) - getStockQuantity(b);
        break;
      case 'price':
        comparison = (a.sellingPrice || 0) - (b.sellingPrice || 0);
        break;
      case 'value':
        comparison = ((a.buyingPrice || 0) * getStockQuantity(a)) - ((b.buyingPrice || 0) * getStockQuantity(b));
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
    <Card>
      <CardContent className="p-0">
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted">
              <tr>
                <th className="px-6 py-3">Image</th>
                <th 
                  className="px-6 py-3 cursor-pointer hover:bg-muted/80"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Product
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th className="px-6 py-3">SKU</th>
                <th 
                  className="px-6 py-3 cursor-pointer hover:bg-muted/80"
                  onClick={() => handleSort('stock')}
                >
                  <div className="flex items-center">
                    Stock
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 cursor-pointer hover:bg-muted/80"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center">
                    Price
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 cursor-pointer hover:bg-muted/80"
                  onClick={() => handleSort('value')}
                >
                  <div className="flex items-center">
                    Value
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : sortedProducts.length > 0 ? (
                sortedProducts.map((product) => {
                  const stockQuantity = getStockQuantity(product);
                  const reorderLevel = product.reorderLevel || 10;
                  
                  console.log('ProductTable: Rendering product:', {
                    productId: product.id,
                    productName: product.name,
                    sellingPrice: product.sellingPrice,
                    buyingPrice: product.buyingPrice,
                    quantity: product.quantity,
                    image_url: product.image_url,
                    hasImage: !!product.image_url
                  });
                  
                  return (
                    <tr key={product.id} className="border-b hover:bg-muted/50">
                      <td className="px-6 py-4">
                        {product.image_url ? (
                          <ProductImage
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                            showDebugInfo={false}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.category}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{product.barcode || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p>{stockQuantity}</p>
                          <p className="text-sm text-muted-foreground">
                            Reorder: {reorderLevel}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {formatCurrency(product.sellingPrice || 0)}
                      </td>
                      <td className="px-6 py-4">
                        {formatCurrency((product.buyingPrice || 0) * stockQuantity)}
                      </td>
                      <td className="px-6 py-4">
                        {stockQuantity <= reorderLevel ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Package className="w-3 h-3 mr-1" />
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onEdit?.(product)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          {/* RESTOCK BUTTON COMMENTED OUT FOR SAFETY */}
                          {/* <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onRestock?.(product)}
                          >
                            Restock
                          </Button> */}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
