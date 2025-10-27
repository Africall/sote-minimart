
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/supabaseUtils';
import { Product as FrontendProduct } from '@/types/product';
import { ProductImage } from './ProductImage';
import { useAuth } from '@/contexts/AuthContext';

interface ProductCardProps {
  product: FrontendProduct;
  onRestock?: (product: FrontendProduct) => void;
  onEdit?: (product: FrontendProduct) => void;
  onDelete?: (product: FrontendProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onRestock,
  onEdit,
  onDelete
}) => {
  const { profile } = useAuth();
  const stockQuantity = product.quantity || 0;
  const reorderLevel = product.reorderLevel || 10;
  const isLowStock = stockQuantity <= reorderLevel;
  const canEdit = profile?.role === 'admin' || profile?.role === 'inventory' || profile?.role === 'cashier';

  return (
    <Card className="h-fit hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex flex-col space-y-2">
          {/* Product Image */}
          <div className="flex justify-center">
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
          </div>

          {/* Product Name */}
          <h3 className="font-medium text-xs text-center line-clamp-2 min-h-[2rem] flex items-center justify-center">
            {product.name}
          </h3>

          {/* Price */}
          <div className="text-center">
            <p className="text-sm font-bold text-primary">
              {formatCurrency(product.sellingPrice || 0)}
            </p>
          </div>

          {/* Stock Level */}
          <div className="flex items-center justify-center space-x-1">
            <div className="flex items-center space-x-1">
              {isLowStock ? (
                <AlertTriangle className="w-3 h-3 text-red-500" />
              ) : (
                <Package className="w-3 h-3 text-green-500" />
              )}
              <span className={`text-xs font-medium ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                {stockQuantity} units
              </span>
            </div>
          </div>

          {/* Stock Status Badge */}
          <div className="flex justify-center">
            {isLowStock ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Low Stock
              </span>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                In Stock
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1 flex-wrap">
            {canEdit && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 h-6 text-xs px-1"
                  onClick={() => onEdit?.(product)}
                >
                  <Edit className="w-2 h-2 mr-1" />
                  Edit
                </Button>
                {onDelete && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="flex-1 h-6 text-xs px-1"
                    onClick={() => onDelete?.(product)}
                  >
                    <Trash2 className="w-2 h-2 mr-1" />
                    Delete
                  </Button>
                )}
              </>
            )}
            {/* RESTOCK BUTTON COMMENTED OUT FOR SAFETY */}
            {/* <Button 
              variant="outline" 
              size="sm"
              className={`h-6 text-xs px-1 ${canEdit ? 'flex-1' : 'w-full'}`}
              onClick={() => onRestock?.(product)}
            >
              Restock
            </Button> */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
