import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, Plus, Search } from 'lucide-react';
import { getProducts } from '@/utils/supabaseUtils';
import { Product } from '@/types/product';
import { SAMPLE_SUPPLIERS } from '../types/inventory';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface FormValues {
  productId: string;
  quantityToAdd: string;
  buyingPrice: string;
  supplier: string;
}

const RestockPage: React.FC = () => {
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  
  const form = useForm<FormValues>({
    defaultValues: {
      productId: '',
      quantityToAdd: '',
      buyingPrice: '',
      supplier: '',
    }
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsData = await getProducts();
        // Convert frontend products to consistent format for RestockPage
        const formattedProducts: Product[] = productsData.map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand || '',
          quantity: p.quantity,
          unitOfMeasure: p.unitOfMeasure,
          buyingPrice: p.buyingPrice,
          sellingPrice: p.sellingPrice,
          category: p.category,
          taxRate: p.taxRate || 0.16,
          supplier: p.supplier,
          barcode: p.barcode,
          image_url: p.image_url,
          receivedDate: p.receivedDate,
          expiryDate: p.expiryDate,
          reorderLevel: p.reorderLevel,
          inventoryAge: p.inventoryAge,
          packSize: p.packSize,
          is_quick_item: p.is_quick_item,
          created_at: p.created_at,
          updated_at: p.updated_at
        }));
        setProducts(formattedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);
  
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) {
      setFilteredProducts([]);
      return;
    }
    
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(term.toLowerCase()) || 
      (product.barcode && product.barcode.includes(term))
    );
    if (filtered.length === 0) {
      setFilteredProducts([]);
      return;
    }
    setFilteredProducts(filtered);
  };
  
  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    form.setValue('productId', product.id);
    form.setValue('buyingPrice', product.buyingPrice.toString());
    setFilteredProducts([]);
    setSearchTerm(product.name);
  };
  
  const onPriceChange = (newPrice: string) => {
    if (selectedProduct && parseFloat(newPrice) !== selectedProduct.buyingPrice) {
      setShowPriceAlert(true);
    }
  };
  
  const onSubmit = (data: FormValues) => {
    // In a real app, this would call an API to update the product
    console.log('Restock data:', {...data, expiryDate});
    
    toast.success(`${selectedProduct?.name} restocked with ${data.quantityToAdd} units`);
    
    // Reset form
    form.reset();
    setSelectedProduct(undefined);
    setSearchTerm('');
    setExpiryDate(undefined);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Restock Existing Product</h1>
        <p className="text-muted-foreground">
          Update inventory levels for existing products
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Restock Product</CardTitle>
          <CardDescription>
            Search for a product and add stock to inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="🔍 Search product by name or scan barcode"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
              
              {filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-auto">
                  {filteredProducts.map(product => (
                    <div 
                      key={product.id}
                      className="p-2 hover:bg-muted cursor-pointer border-b last:border-0"
                      onClick={() => selectProduct(product)}
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.category} • Current Stock: {product.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {selectedProduct && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-2">Product Details</h3>
                      <div className="bg-muted rounded-md p-3 space-y-1">
                        <p><span className="font-medium">Name:</span> {selectedProduct.name}</p>
                        <p><span className="font-medium">Category:</span> {selectedProduct.category}</p>
                        <p><span className="font-medium">Current Stock:</span> {selectedProduct.quantity} units</p>
                        <p><span className="font-medium">Last Buying Price:</span> KES {selectedProduct.buyingPrice}</p>
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="quantityToAdd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <span className="mr-1">📥</span> Quantity to Add*
                          </FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="buyingPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <span className="mr-1">🧮</span> New Buying Price (KES)*
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              {...field} 
                              onChange={(e) => {
                                field.onChange(e);
                                onPriceChange(e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="supplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <span className="mr-1">🧾</span> Supplier*
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select supplier" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SAMPLE_SUPPLIERS.map((supplier) => (
                                <SelectItem key={supplier.id} value={supplier.id}>
                                  {supplier.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormItem>
                      <FormLabel>
                        <span className="mr-1">🧪</span> Expiry Date (if applicable)
                      </FormLabel>
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
                  
                  <Button type="submit">
                    <Plus className="mr-2 h-4 w-4" />
                    Confirm Restock
                  </Button>
                </form>
              </Form>
            )}
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={showPriceAlert} onOpenChange={setShowPriceAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buying Price Change</AlertDialogTitle>
            <AlertDialogDescription>
              The buying price differs from the last entry. Are you sure you want to update it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              if (selectedProduct) {
                form.setValue('buyingPrice', selectedProduct.buyingPrice.toString());
              }
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction>Confirm Change</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RestockPage;
