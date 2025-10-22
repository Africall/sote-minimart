import React from 'react';
import { Product as FrontendProduct } from '@/types/product';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: FrontendProduct[];
  loading: boolean;
  onRestock?: (product: FrontendProduct) => void;
  onEdit?: (product: FrontendProduct) => void;
  onDelete?: (product: FrontendProduct) => void;
}

export const ProductGridWithDelete: React.FC<ProductGridProps> = ({
  products,
  loading,
  onRestock,
  onEdit,
  onDelete
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-lg text-primary">Loading products...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        No products found matching your criteria
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onRestock={onRestock}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
