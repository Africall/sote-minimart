
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Bug } from 'lucide-react';
import { Product, Supplier, getSuppliers } from '@/utils/supabaseUtils';
import { ProductImageUpload } from './ProductImageUpload';
import { ImageDebugger } from './ImageDebugger';
import { DatabaseCleanup } from './DatabaseCleanup';
import { toast } from 'sonner';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  loading?: boolean;
}

export const AddProductDialog: React.FC<AddProductDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  loading
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showDebugMode, setShowDebugMode] = useState(false);
  const [resetKey, setResetKey] = useState(0); // Add reset key for image component
  const [formData, setFormData] = React.useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    description: '',
    price: '',
    cost: '',
    stock_quantity: '0',
    reorder_level: '10',
    expiry_date: '',
    supplier_id: '',
    image_url: '',
    is_featured: false
  });

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const data = await getSuppliers();
        setSuppliers(data);
      } catch (error) {
        console.error('Error loading suppliers:', error);
      }
    };
    loadSuppliers();
  }, []);

  const handleImageChange = (url: string) => {
    console.log('AddProductDialog: Image URL changed:', url);
    setFormData(prev => ({ ...prev, image_url: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert string values to appropriate types
    const numericFields = {
      price: parseFloat(formData.price) || 0,
      cost: parseFloat(formData.cost) || 0,
      stock_quantity: 0, // Always 0 for new products
      reorder_level: parseInt(formData.reorder_level) || 10
    };

    // Create the final product data object
    const productData = {
      name: formData.name,
      sku: formData.sku || null,
      barcode: formData.barcode ? [formData.barcode] : null,
      category: formData.category,
      description: formData.description || null,
      price: numericFields.price,
      cost: numericFields.cost,
      stock_quantity: 0, // Explicitly set to 0 for new products
      reorder_level: numericFields.reorder_level,
      expiry_date: formData.expiry_date || null,
      supplier_id: formData.supplier_id || null,
      image_url: formData.image_url || null,
      is_featured: formData.is_featured
    };

    console.log('AddProductDialog: Submitting product data with stock_quantity:', productData.stock_quantity);
    console.log('Full product data:', productData);

    try {
      await onSubmit(productData);
      
      // Reset form and force image component reset
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        category: '',
        description: '',
        price: '',
        cost: '',
        stock_quantity: '0',
        reorder_level: '10',
        expiry_date: '',
        supplier_id: '',
        image_url: '',
        is_featured: false
      });
      setResetKey(prev => prev + 1); // Force image component reset
      onOpenChange(false);
    } catch (error) {
      console.error('AddProductDialog: Error submitting product:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Add New Product
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4" />
              <Switch
                checked={showDebugMode}
                onCheckedChange={setShowDebugMode}
              />
              <span className="text-sm">Debug</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Image Section */}
          <ProductImageUpload
            imageUrl={formData.image_url}
            onImageChange={handleImageChange}
            showDebugInfo={showDebugMode}
            resetKey={resetKey.toString()} // Pass reset key to force component reset
          />

          {/* Debug Mode */}
          {showDebugMode && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between" type="button">
                  <span className="flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    Debug Tools & Database Cleanup
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <DatabaseCleanup />
                <ImageDebugger />
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Existing form fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="groceries">Groceries</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="household">Household</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Selling Price (KES)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost Price (KES)</Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Initial Stock</Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                disabled
                className="bg-muted cursor-not-allowed"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorder_level">Reorder Level</Label>
              <Input
                id="reorder_level"
                type="number"
                min="0"
                value={formData.reorder_level}
                onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier_id">Supplier</Label>
            <Select
              value={formData.supplier_id}
              onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry_date">Expiry Date</Label>
            <Input
              id="expiry_date"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
