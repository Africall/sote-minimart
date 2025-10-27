import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, Package, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  sku: string;
}

interface TransferStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferComplete?: () => void;
}

export const TransferStockDialog: React.FC<TransferStockDialogProps> = ({
  open,
  onOpenChange,
  onTransferComplete,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sourceProductId, setSourceProductId] = useState('');
  const [destinationProductId, setDestinationProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [sourceProduct, setSourceProduct] = useState<Product | null>(null);
  const [destinationProduct, setDestinationProduct] = useState<Product | null>(null);
  const [sourceSearchQuery, setSourceSearchQuery] = useState('');
  const [destinationSearchQuery, setDestinationSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

  useEffect(() => {
    if (sourceProductId) {
      const product = products.find((p) => p.id === sourceProductId);
      setSourceProduct(product || null);
    } else {
      setSourceProduct(null);
    }
  }, [sourceProductId, products]);

  useEffect(() => {
    if (destinationProductId) {
      const product = products.find((p) => p.id === destinationProductId);
      setDestinationProduct(product || null);
    } else {
      setDestinationProduct(null);
    }
  }, [destinationProductId, products]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity, sku')
        .order('name');

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!sourceProductId || !destinationProductId) {
      toast.error('Please select both source and destination products');
      return;
    }

    if (sourceProductId === destinationProductId) {
      toast.error('Source and destination products cannot be the same');
      return;
    }

    const transferQty = parseInt(quantity);
    if (!transferQty || transferQty <= 0) {
      toast.error('Please enter a valid quantity greater than 0');
      return;
    }

    if (sourceProduct && transferQty > sourceProduct.stock_quantity) {
      toast.error(
        `Insufficient stock. Available: ${sourceProduct.stock_quantity} units`
      );
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for the transfer');
      return;
    }

    setSubmitting(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Start transaction by updating both products
      // 1. Decrease stock from source product
      const { error: sourceError } = await supabase
        .from('products')
        .update({
          stock_quantity: (sourceProduct?.stock_quantity || 0) - transferQty,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', sourceProductId);

      if (sourceError) throw sourceError;

      // 2. Increase stock to destination product
      const { error: destinationError } = await supabase
        .from('products')
        .update({
          stock_quantity:
            (destinationProduct?.stock_quantity || 0) + transferQty,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', destinationProductId);

      if (destinationError) {
        // Rollback source product update if destination fails
        await supabase
          .from('products')
          .update({
            stock_quantity: sourceProduct?.stock_quantity || 0,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', sourceProductId);
        throw destinationError;
      }

      // 3. Create a log entry in the activity or transactions table (if available)
      // Note: This is a placeholder. You may want to create a dedicated stock_transfers table
      try {
        await supabase.from('stock_transfer_log').insert({
          source_product_id: sourceProductId,
          source_product_name: sourceProduct?.name,
          destination_product_id: destinationProductId,
          destination_product_name: destinationProduct?.name,
          quantity: transferQty,
          reason: reason,
          transferred_by: user.id,
          transfer_date: new Date().toISOString(),
        } as any);
      } catch (logError) {
        // Ignore if stock_transfer_log table doesn't exist
        console.log('Note: Transfer completed but not logged (table may not exist)');
      }

      toast.success(
        `Successfully transferred ${transferQty} units from ${sourceProduct?.name} to ${destinationProduct?.name}`
      );

      // Reset form
      setSourceProductId('');
      setDestinationProductId('');
      setQuantity('');
      setReason('');
      onOpenChange(false);

      // Notify parent component
      if (onTransferComplete) {
        onTransferComplete();
      }
    } catch (error: any) {
      console.error('Error transferring stock:', error);
      toast.error('Failed to transfer stock: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Filter products based on search queries
  const filteredSourceProducts = products.filter((product) => {
    const searchLower = sourceSearchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.sku?.toLowerCase().includes(searchLower)
    );
  });

  const filteredDestinationProducts = products.filter((product) => {
    const searchLower = destinationSearchQuery.toLowerCase();
    return (
      product.id !== sourceProductId &&
      (product.name.toLowerCase().includes(searchLower) ||
        product.sku?.toLowerCase().includes(searchLower))
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Transfer Stock
          </DialogTitle>
          <DialogDescription>
            Transfer stock quantity from one product to another. This action will
            update inventory levels and record the transfer.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleTransfer} className="space-y-4 overflow-y-auto flex-1 px-1">
            {/* Source Product */}
            <div className="space-y-2">
              <Label htmlFor="source-search">From Product (Source)</Label>
              <div className="space-y-2">
                <Input
                  id="source-search"
                  placeholder="🔍 Type to search by name or SKU..."
                  value={sourceSearchQuery}
                  onChange={(e) => setSourceSearchQuery(e.target.value)}
                  className="border-primary/50 focus:border-primary"
                />
                <Select 
                  value={sourceProductId} 
                  onValueChange={(value) => {
                    setSourceProductId(value);
                    setSourceSearchQuery(''); // Clear search after selection
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Click to select from filtered list" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {filteredSourceProducts.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        {sourceSearchQuery ? 
                          `No products found matching "${sourceSearchQuery}"` : 
                          'No products available'}
                      </div>
                    ) : (
                      <>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 sticky top-0">
                          {filteredSourceProducts.length} product{filteredSourceProducts.length !== 1 ? 's' : ''} found
                        </div>
                        {filteredSourceProducts.map((product) => (
                          <SelectItem 
                            key={product.id} 
                            value={product.id}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col py-1">
                              <span className="font-medium">{product.name}</span>
                              <span className="text-xs text-muted-foreground">
                                SKU: {product.sku || 'N/A'} • Stock: {product.stock_quantity} units
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                {sourceProduct && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900">{sourceProduct.name}</p>
                      <p className="text-xs text-green-700">
                        Available: {sourceProduct.stock_quantity} units
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transfer Arrow */}
            {sourceProductId && (
              <div className="flex justify-center">
                <ArrowRight className="h-6 w-6 text-primary" />
              </div>
            )}

            {/* Destination Product */}
            <div className="space-y-2">
              <Label htmlFor="destination-search">To Product (Destination)</Label>
              <div className="space-y-2">
                <Input
                  id="destination-search"
                  placeholder={sourceProductId ? "🔍 Type to search by name or SKU..." : "Select source product first"}
                  value={destinationSearchQuery}
                  onChange={(e) => setDestinationSearchQuery(e.target.value)}
                  disabled={!sourceProductId}
                  className="border-primary/50 focus:border-primary"
                />
                <Select
                  value={destinationProductId}
                  onValueChange={(value) => {
                    setDestinationProductId(value);
                    setDestinationSearchQuery(''); // Clear search after selection
                  }}
                  disabled={!sourceProductId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={sourceProductId ? "Click to select from filtered list" : "Select source first"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {!sourceProductId ? (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        Please select a source product first
                      </div>
                    ) : filteredDestinationProducts.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        {destinationSearchQuery ? 
                          `No products found matching "${destinationSearchQuery}"` : 
                          'No other products available'}
                      </div>
                    ) : (
                      <>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 sticky top-0">
                          {filteredDestinationProducts.length} product{filteredDestinationProducts.length !== 1 ? 's' : ''} found
                        </div>
                        {filteredDestinationProducts.map((product) => (
                          <SelectItem 
                            key={product.id} 
                            value={product.id}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col py-1">
                              <span className="font-medium">{product.name}</span>
                              <span className="text-xs text-muted-foreground">
                                SKU: {product.sku || 'N/A'} • Stock: {product.stock_quantity} units
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                {destinationProduct && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">{destinationProduct.name}</p>
                      <p className="text-xs text-blue-700">
                        Current: {destinationProduct.stock_quantity} units
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Transfer</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={sourceProduct?.stock_quantity || undefined}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                disabled={!sourceProductId || !destinationProductId}
                required
              />
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Transfer</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="E.g., Product consolidation, repackaging, correction, etc."
                rows={3}
                required
              />
            </div>

            {/* Summary Alert */}
            {sourceProduct && destinationProduct && quantity && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Transfer Summary:</strong>
                  <br />
                  {sourceProduct.name} will have{' '}
                  <span className="font-semibold">
                    {sourceProduct.stock_quantity - parseInt(quantity)} units
                  </span>{' '}
                  remaining
                  <br />
                  {destinationProduct.name} will have{' '}
                  <span className="font-semibold">
                    {destinationProduct.stock_quantity + parseInt(quantity)} units
                  </span>{' '}
                  total
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter className="flex-shrink-0 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  'Transfer Stock'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
