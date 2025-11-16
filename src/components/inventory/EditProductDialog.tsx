import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, Plus, Save, Trash2 } from 'lucide-react';
import { ProductImageUpload } from './ProductImageUpload';
import { toast } from 'sonner';
import { Product } from '@/utils/supabaseUtils';
import { Product as FrontendProduct } from '@/types/product';
import { useAuth } from '@/contexts/AuthContext';

interface FormValues {
  name: string;
  category: string;
  cost: string;
  price: string;
  reorder_level: string;
  stock_quantity: string;
  expiryDate?: Date;
  sku: string;
  barcode: string;
}

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: FrontendProduct | null;
  onSubmit: (productId: string, data: Partial<Product>) => Promise<boolean>;
  loading: boolean;
}

export const EditProductDialog: React.FC<EditProductDialogProps> = ({
  open,
  onOpenChange,
  product,
  onSubmit,
  loading
}) => {
  const { profile } = useAuth();
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [expiryQueue, setExpiryQueue] = useState<string[]>([]);
  const [newExpiryDate, setNewExpiryDate] = useState<Date | undefined>(undefined);

  // Determine user permissions
  const isAdmin = profile?.role === 'admin';
  const isInventory = profile?.role === 'inventory';
  const isCashier = profile?.role === 'cashier';
  const canEdit = isAdmin || isInventory || isCashier;

  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      category: 'personal-care',
      cost: '',
      price: '',
      reorder_level: '',
      stock_quantity: '',
      sku: '',
      barcode: '',
    }
  });

  // Load product data when dialog opens - fetch fresh data from database
  useEffect(() => {
    const fetchProductData = async () => {
      if (open && product) {
        console.log('EditProductDialog: Loading product data:', {
          productId: product.id,
          name: product.name,
          imageUrl: product.image_url,
          userRole: profile?.role
        });

        // Reset form with current product data
        form.reset({
          name: product.name || '',
          category: product.category || 'personal-care',
          cost: product.buyingPrice?.toString() || '0',
          price: product.sellingPrice?.toString() || '0',
          reorder_level: product.reorderLevel?.toString() || '10',
          stock_quantity: product.quantity?.toString() || '0',
          sku: product.barcode || '',
          barcode: product.barcode || '',
        });
        
        setImageUrl(product.image_url || '');

        // Fetch fresh expiry_queue data from database
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data: freshProduct, error } = await supabase
            .from('products')
            .select('expiry_queue, expiry_date')
            .eq('id', product.id)
            .single();

          if (error || !freshProduct) {
            console.error('Failed to fetch expiry_queue:', error);
            // Fallback to product data passed in props
            setExpiryDate(product.expiryDate ? new Date(product.expiryDate) : undefined);
            setExpiryQueue(product.expiry_queue || []);
          } else {
            // Use fresh data from database - cast to any to handle dynamic columns
            const productData = freshProduct as any;
            const queue = Array.isArray(productData.expiry_queue) ? productData.expiry_queue : [];
            setExpiryQueue(queue);
            
            // Find the nearest expiry date (closest to today, not FIFO)
            const today = new Date();
            const sortedQueue = [...queue].sort((a: string, b: string) => {
              return new Date(a).getTime() - new Date(b).getTime();
            });
            
            // Find the nearest date that's >= today
            const nearestExpiry = sortedQueue.find((date: string) => {
              const expiryDate = new Date(date);
              return expiryDate >= today;
            }) || sortedQueue[sortedQueue.length - 1] || productData.expiry_date;
            
            setExpiryDate(nearestExpiry ? new Date(nearestExpiry) : undefined);
            
            console.log('EditProductDialog: Fetched expiry_queue:', {
              productId: product.id,
              expiry_queue: queue,
              sortedQueue,
              nearestExpiry: nearestExpiry
            });
          }
        } catch (err) {
          console.error('Error fetching expiry_queue:', err);
          // Fallback to product data passed in props
          setExpiryDate(product.expiryDate ? new Date(product.expiryDate) : undefined);
          setExpiryQueue(product.expiry_queue || []);
        }
      }
    };

    fetchProductData();
  }, [open, product, form, profile?.role]);

  // Handle image URL changes - separate from stock operations
  const handleImageChange = (url: string) => {
    console.log('EditProductDialog: Image URL changed:', {
      url,
      productId: product?.id,
      userRole: profile?.role
    });
    setImageUrl(url);
  };

  const handleAddExpiryDate = async () => {
    if (!product || !newExpiryDate) {
      toast.error('Please select a date to add.');
      return;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Fetch the current queue
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('expiry_queue')
        .eq('id', product.id)
        .single();

      if (fetchError) throw fetchError;

      const currentQueue = (currentProduct as any).expiry_queue || [];
      const formattedDate = format(newExpiryDate, 'yyyy-MM-dd');
      
      // Prevent adding duplicate dates
      if (currentQueue.includes(formattedDate)) {
        toast.info('This expiry date is already in the queue.');
        return;
      }

      const newQueue = [...currentQueue, formattedDate];

      // Update the product with the new queue
      const { error: updateError } = await supabase
        .from('products')
        .update({ expiry_queue: newQueue } as any)
        .eq('id', product.id);

      if (updateError) throw updateError;

      toast.success('Expiry date added to the queue.');
      setExpiryQueue(newQueue); // Update local state to reflect change
      setNewExpiryDate(undefined); // Reset the date picker
    } catch (error: any) {
      console.error('Failed to add expiry date:', error);
      toast.error(error.message || 'Failed to add expiry date.');
    }
  };

  const handleDeleteExpiryDate = async (dateToDelete: string) => {
    if (!product) return;

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Optimistic UI update
      const originalQueue = expiryQueue;
      const newQueue = expiryQueue.filter(d => d !== dateToDelete);
      setExpiryQueue(newQueue);

      const { error } = await supabase
        .from('products')
        .update({ expiry_queue: newQueue } as any)
        .eq('id', product.id);

      if (error) {
        // Revert on failure
        setExpiryQueue(originalQueue);
        throw error;
      }

      toast.success('Expiry date removed from queue.');
    } catch (error: any) {
      console.error('Failed to delete expiry date:', error);
      toast.error(error.message || 'Failed to remove expiry date.');
    }
  };

  const handleSubmit = async (data: FormValues) => {
    if (!product) {
      console.error('EditProductDialog: No product selected for update');
      toast.error('No product selected');
      return;
    }

    console.log('EditProductDialog: Form submission started', {
      productId: product.id,
      formData: data,
      imageUrl,
      expiryDate,
      userRole: profile?.role,
      isAdmin,
      isInventory
    });

    // Basic validation
    if (!data.name?.trim() && isAdmin) {
      toast.error('Product name is required');
      return;
    }

    try {
      const updateData: Partial<Product> = {};

      // Admin and cashiers can edit all fields
      if (isAdmin || isCashier) {
        const cost = parseFloat(data.cost) || 0;
        const price = parseFloat(data.price) || 0;
        const reorderLevel = parseInt(data.reorder_level) || 10;
        const stockQuantity = parseInt(data.stock_quantity) || 0;

        if (price < 0) {
          toast.error('Price cannot be negative');
          return;
        }

        if (cost < 0) {
          toast.error('Cost cannot be negative');
          return;
        }

        if (stockQuantity < 0) {
          toast.error('Stock quantity cannot be negative');
          return;
        }

        // Handle sku and barcode - they might be arrays or strings
        const skuValue = Array.isArray(data.sku) ? data.sku[0] : data.sku;
        const barcodeValue = Array.isArray(data.barcode) ? data.barcode[0] : data.barcode;

        updateData.name = data.name.trim();
        updateData.category = data.category;
        updateData.cost = cost;
        updateData.price = price;
        updateData.reorder_level = reorderLevel;
        updateData.sku = skuValue?.trim() || null;
        updateData.barcode = barcodeValue?.trim() ? [barcodeValue.trim()] : [];
        
        // Only admins can update stock quantity
        if (isAdmin) {
          updateData.stock_quantity = stockQuantity;
        }
      }

      // All users with edit permission can edit images (expiry dates are read-only)
      if (isAdmin || isInventory || isCashier) {
        updateData.image_url = imageUrl?.trim() || null;
      }

      // Always set updated_at
      updateData.updated_at = new Date().toISOString();

      console.log('EditProductDialog: Sending update data:', {
        productId: product.id,
        updateData,
        userRole: profile?.role
      });
      
      const success = await onSubmit(product.id, updateData);
      
      if (success) {
        toast.success('Product updated successfully');
        onOpenChange(false);
      } else {
        toast.error('Failed to update product');
      }
    } catch (error) {
      console.error('EditProductDialog: Update failed:', error);
      toast.error('Failed to update product. Please try again.');
    }
  };

  if (!product) return null;

  // Check if user has edit permissions
  if (!canEdit) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Access Restricted</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              You don't have permission to edit product details.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isAdmin ? 'Edit Product' : 'Edit Product (Expiry & Image Only)'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Product Image Upload - Available to admin, inventory, and cashiers */}
            <ProductImageUpload 
              key={`${product.id}-${open}`}
              imageUrl={imageUrl}
              onImageChange={handleImageChange}
              productId={product.id}
              resetKey={`${product.id}-${open}`}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Admin and Cashier fields */}
              {(isAdmin || isCashier) && (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    rules={{ required: 'Product name is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Geisha Soap 125g" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="personal-care">Personal Care</SelectItem>
                            <SelectItem value="beverages">Beverages</SelectItem>
                            <SelectItem value="dry-food">Dry Food</SelectItem>
                            <SelectItem value="snacks">Snacks</SelectItem>
                            <SelectItem value="cleaning">Cleaning</SelectItem>
                            <SelectItem value="cooking">Cooking</SelectItem>
                            <SelectItem value="household">Household</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cost"
                    rules={{ 
                      required: 'Cost price is required',
                      min: { value: 0, message: 'Cost must be 0 or greater' }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost Price (KES)*</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="price"
                    rules={{ 
                      required: 'Selling price is required',
                      min: { value: 0, message: 'Price must be 0 or greater' }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selling Price (KES)*</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reorder_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reorder Level</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            placeholder="Min quantity before alert"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="Product SKU" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Barcode (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter barcode number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Read-only fields for inventory users only */}
              {isInventory && !isAdmin && !isCashier && (
                <>
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <div className="p-3 bg-muted rounded-md">
                      <span className="text-sm font-medium">{product.name}</span>
                    </div>
                  </FormItem>

                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <div className="p-3 bg-muted rounded-md">
                      <span className="text-sm font-medium">{product.category}</span>
                    </div>
                  </FormItem>

                  <FormItem>
                    <FormLabel>Selling Price</FormLabel>
                    <div className="p-3 bg-muted rounded-md">
                      <span className="text-sm font-medium">KES {product.sellingPrice || 0}</span>
                    </div>
                  </FormItem>
                </>
              )}
              
              {/* Stock quantity - editable for admins, read-only for others */}
              {isAdmin ? (
                <FormField
                  control={form.control}
                  name="stock_quantity"
                  rules={{ 
                    required: 'Stock quantity is required',
                    min: { value: 0, message: 'Stock quantity must be 0 or greater' }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Quantity*</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="Enter stock quantity"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormItem>
                  <FormLabel>Current Stock Quantity</FormLabel>
                  <div className="p-3 bg-muted rounded-md">
                    <span className="text-sm font-medium">{product.quantity || 0} units</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Only admins can edit stock quantity
                    </p>
                  </div>
                </FormItem>
              )}
              
              {/* Expiry date - read-only display from expiry_queue */}
              <div className="md:col-span-2">
                <FormItem>
                  <FormLabel>Expiry Dates</FormLabel>
                  {expiryQueue.length > 0 && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Showing nearest expiry from queue ({expiryQueue.length} batch{expiryQueue.length > 1 ? 'es' : ''} total)
                    </p>
                  )}
                  <div className="p-3 bg-muted rounded-md border">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {expiryDate ? format(expiryDate, "PPP") : "No expiry date set"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Expiry queue list with delete buttons */}
                  {isAdmin && expiryQueue.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <FormLabel className="text-sm font-medium">Expiry Queue Management</FormLabel>
                      <div className="max-h-32 overflow-y-auto rounded-md border p-2">
                        {expiryQueue.map((date) => (
                          <div key={date} className="flex items-center justify-between p-1.5 hover:bg-muted rounded-md">
                            <span className="text-sm">{format(new Date(date), "MMM d, yyyy")}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleDeleteExpiryDate(date)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add to expiry queue - only for admins */}
                  {isAdmin && (
                    <div className="mt-4 pt-4 border-t">
                      <FormLabel className="text-sm font-medium">Add to Expiry Queue</FormLabel>
                      <div className="flex items-center gap-2 mt-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={'outline'}
                              className={cn(
                                "flex-1 justify-start text-left font-normal",
                                !newExpiryDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {newExpiryDate ? format(newExpiryDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={newExpiryDate}
                              onSelect={setNewExpiryDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Button type="button" onClick={handleAddExpiryDate} disabled={!newExpiryDate}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add to Queue
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        This will add a new expiry date to the product's queue.
                      </p>
                    </div>
                  )}
                </FormItem>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Updating...' : 'Update Product'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
