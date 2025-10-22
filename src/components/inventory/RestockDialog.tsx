
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Product as FrontendProduct } from '@/types/product';

interface RestockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: FrontendProduct | null;
  onSubmit: (productId: string, quantity: number) => Promise<void>;
  loading?: boolean;
}

export const RestockDialog: React.FC<RestockDialogProps> = ({
  open,
  onOpenChange,
  product,
  onSubmit,
  loading
}) => {
  const [quantity, setQuantity] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (product) {
      await onSubmit(product.id, parseInt(quantity));
      onOpenChange(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Restock Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Product Name</Label>
            <p className="text-sm font-medium">{product.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Current Stock</Label>
              <p className="text-sm font-medium">{product.quantity}</p>
            </div>
            <div className="space-y-2">
              <Label>Reorder Level</Label>
              <p className="text-sm font-medium">{product.reorderLevel}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Add</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>New Stock Level</Label>
            <p className="text-sm font-medium">
              {product.quantity + (parseInt(quantity) || 0)}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Restocking...' : 'Restock Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
