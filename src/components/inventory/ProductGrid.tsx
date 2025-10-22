
import React from 'react';
import { Product as FrontendProduct } from '@/types/product';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: FrontendProduct[];
  loading?: boolean;
  onRestock?: (product: FrontendProduct) => void;
  onEdit?: (product: FrontendProduct) => void;
  onDelete?: (product: FrontendProduct) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  onRestock,
  onEdit,
  onDelete
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
        {Array.from({ length: 20 }).map((_, index) => (
          <div key={index} className="bg-muted animate-pulse rounded-lg h-40" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
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
