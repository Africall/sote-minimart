
import React, { useState } from 'react';
import { Product } from '../../types/product';
import { searchProducts } from '../../types/product';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCartActions } from '@/hooks/useCartActions'; // Import from the correct location

interface PriceCheckDialogProps {
  formatCurrency: (amount: number) => string;
  setPriceCheckOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const PriceCheckDialog: React.FC<PriceCheckDialogProps> = ({
  formatCurrency,
  setPriceCheckOpen
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priceCheckProduct, setPriceCheckProduct] = useState<Product | null>(null);
  const { addToCart } = useCartActions(); // Use the cart actions hook

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1, { source: 'price-check' });
    setPriceCheckOpen(false);
  };

  return (
    <Dialog open={true} onOpenChange={setPriceCheckOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Price Check</DialogTitle>
          <DialogDescription>
            Search for a product to check its price and stock
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="price-check-search">Product Search</Label>
            <Input
              id="price-check-search"
              placeholder="Scan or type product name..."
              onChange={(e) => {
                const query = e.target.value;
                if (query.length > 1) {
                  searchProducts(query).then((res) => {
                    if (res.length > 0) {
                      setPriceCheckProduct(res[0]);
                    } else {
                      setPriceCheckProduct(null);
                    }
                  });
                } else {
                  setPriceCheckProduct(null);
                }
              }}
            />
          </div>

          {priceCheckProduct && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium">{priceCheckProduct.name}</h3>
                <p className="text-sm text-muted-foreground">{priceCheckProduct.brand}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Price:</p>
                    <p className="font-bold">{formatCurrency(priceCheckProduct.sellingPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stock:</p>
                    <p className={`font-medium ${priceCheckProduct.quantity && priceCheckProduct.quantity <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {priceCheckProduct.quantity !== undefined ? 
                        priceCheckProduct.quantity <= 0 ? 'Out of Stock' : `${priceCheckProduct.quantity} units` 
                        : 'Available'}
                    </p>
                  </div>
                </div>
                <Button className="mt-4 w-full" onClick={() => handleAddToCart(priceCheckProduct)}>
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
