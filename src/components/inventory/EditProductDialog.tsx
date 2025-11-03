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
import { CalendarIcon, Save } from 'lucide-react';
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

  // Load product data when dialog opens
  useEffect(() => {
    if (open && product) {
      console.log('EditProductDialog: Loading product data:', {
        productId: product.id,
        name: product.name,
        imageUrl: product.image_url,
        userRole: profile?.role
      });

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
      
      setExpiryDate(product.expiryDate ? new Date(product.expiryDate) : undefined);
      setImageUrl(product.image_url || '');
    }
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
        updateData.barcode = barcodeValue?.trim() ? [barcodeValue.trim()] : null;
        
        // Only admins can update stock quantity
        if (isAdmin) {
          updateData.stock_quantity = stockQuantity;
        }
      }

      // All users with edit permission can edit expiry dates and images
      if (isAdmin || isInventory || isCashier) {
        updateData.expiry_date = expiryDate?.toISOString() || null;
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
              
              {/* Expiry date - available to admin, inventory, and cashiers */}
              <FormItem>
                <FormLabel>Expiry Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !expiryDate && "text-muted-foreground"
                        )}
                      >
                        {expiryDate ? (
                          format(expiryDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={expiryDate}
                      onSelect={setExpiryDate}
                      disabled={(date) =>
                        date < new Date()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FormItem>
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
