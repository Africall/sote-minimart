import React, { useState } from 'react';
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
import { CalendarIcon, Save } from 'lucide-react';
import { productCategories, UnitOfMeasureOptions } from '../types/product';
import { SAMPLE_SUPPLIERS } from '../types/inventory';
import { ProductImageUpload } from '../components/inventory/ProductImageUpload';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface FormValues {
  name: string;
  brand: string;
  category: string;
  unitOfMeasure: string;
  buyingPrice: string;
  sellingPrice: string;
  quantity: string;
  reorderLevel: string;
  expiryDate?: Date;
  taxRate: string;
  supplier: string;
  barcode: string;
}

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string>('');
  
  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      brand: '',
      category: 'personal-care',
      unitOfMeasure: 'piece',
      buyingPrice: '',
      sellingPrice: '',
      quantity: '',
      reorderLevel: '',
      taxRate: '16',
      supplier: '',
      barcode: '',
    }
  });
  
  const onSubmit = (data: FormValues) => {
    console.log('Product data to save:', {...data, expiryDate, imageUrl});
    toast.success('Product added successfully!');
    navigate('/inventory');
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Branded header band */}
      <div className="rounded-xl overflow-hidden shadow border border-blue-100">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Add New Product</h1>
          <p className="opacity-90">Enter details for the new product</p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="border-blue-100 shadow">
        <CardHeader>
          <CardTitle className="text-xl">Product Information</CardTitle>
          <CardDescription>
            Fill in all required fields to add a new product to inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Product Image Upload */}
              <ProductImageUpload 
                imageUrl={imageUrl}
                onImageChange={setImageUrl}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="mr-1">🏷</span> Product Name*
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Geisha Soap 125g"
                          {...field}
                          className="focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Unilever"
                          {...field}
                          className="focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                        />
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
                      <FormLabel>
                        <span className="mr-1">🧾</span> Category*
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(productCategories).map(([value, category]) => (
                            <SelectItem key={value} value={value}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="unitOfMeasure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="mr-1">📦</span> Unit of Measure*
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(UnitOfMeasureOptions).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        <span className="mr-1">🧮</span> Buying Price (KES)*
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          className="focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="mr-1">💸</span> Selling Price (KES)*
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          className="focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="mr-1">🔢</span> Opening Quantity*
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          className="focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="reorderLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="mr-1">⚠️</span> Reorder Level*
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="Min quantity before alert"
                          {...field}
                          className="focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormItem>
                  <FormLabel>
                    <span className="mr-1">🧪</span> Expiry Date (Optional)
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal focus-visible:ring-4 focus-visible:ring-primary/20",
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
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
                
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="mr-1">🧾</span> VAT Rate (% )*
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary">
                            <SelectValue placeholder="Select VAT rate" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">0% (Exempt)</SelectItem>
                          <SelectItem value="8">8% (Reduced)</SelectItem>
                          <SelectItem value="16">16% (Standard)</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <span className="mr-1">📋</span> Supplier
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary">
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SAMPLE_SUPPLIERS.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="new">+ Add New Supplier</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="mr-1">📎</span> Barcode (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter barcode number"
                          {...field}
                          className="focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Gradient Save button (no custom variant needed) */}
              <Button
                type="submit"
                className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:opacity-95 transition-transform duration-200 active:scale-[0.98]"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Product
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Soft page background tint (optional): wrap outer container if you want a stronger tint on this page only */}
      <style>{`
        /* Optional: page-level soft gradient—kept here so it only affects this page */
        .animate-fade-in {
          animation: fade-in 0.3s ease-out both;
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px) }
          100% { opacity: 1; transform: translateY(0) }
        }
      `}</style>
    </div>
  );
};

export default AddProductPage;
