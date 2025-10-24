import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface LineItem {
  id?: string;
  product_id?: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

interface SupplierInvoice {
  id: string;
  supplier_name: string;
  supplier_invoice_number?: string;
  amount: number;
  status: string;
  due_date: string;
  issue_date: string;
  payment_terms?: string;
  description?: string;
}

interface CreateSupplierInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceCreated: () => void;
  invoice?: SupplierInvoice | null;
}

export const CreateSupplierInvoiceDialog: React.FC<CreateSupplierInvoiceDialogProps> = ({
  open,
  onOpenChange,
  onInvoiceCreated,
  invoice,
}) => {
  const [formData, setFormData] = useState({
    supplier_name: '',
    supplier_invoice_number: '',
    description: '',
    due_date: '',
    issue_date: new Date().toISOString().split('T')[0],
    payment_terms: 'Net 30',
    status: 'draft'
  });
  
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      product_name: '',
      description: '',
      quantity: 1,
      unit_cost: 0,
      total: 0,
    }
  ]);
  
  const [manualTax, setManualTax] = useState<number>(0);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchProducts();
      fetchSuppliers();
      
      if (invoice) {
        // Populate form for editing
        setFormData({
          supplier_name: invoice.supplier_name,
          supplier_invoice_number: invoice.supplier_invoice_number || '',
          description: invoice.description || '',
          due_date: invoice.due_date,
          issue_date: invoice.issue_date,
          payment_terms: invoice.payment_terms || 'Net 30',
          status: invoice.status,
        });
        fetchInvoiceDetails(invoice.id);
      }
    }
  }, [open, invoice]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, cost, price')
        .order('name');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchInvoiceDetails = async (invoiceId: string) => {
    try {
      // Fetch invoice details to get tax amount
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('tax_amount')
        .eq('id', invoiceId)
        .single();
      
      if (invoiceError) throw invoiceError;
      
      if (invoiceData?.tax_amount) {
        setManualTax(invoiceData.tax_amount);
      }

      // Fetch line items
      const { data: lineItemsData, error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', invoiceId);
      
      if (lineItemsError) throw lineItemsError;
      
      if (lineItemsData && lineItemsData.length > 0) {
        setLineItems(lineItemsData);
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    }
  };

  const calculateLineItem = (item: LineItem): LineItem => {
    const total = item.quantity * item.unit_cost;
    
    return {
      ...item,
      total,
    };
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // If product is selected, populate name and cost
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index].product_name = product.name;
        updatedItems[index].unit_cost = product.cost || product.price || 0;
      }
    }
    
    // Recalculate totals
    updatedItems[index] = calculateLineItem(updatedItems[index]);
    
    setLineItems(updatedItems);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, {
      product_name: '',
      description: '',
      quantity: 1,
      unit_cost: 0,
      total: 0,
    }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const netAmount = lineItems.reduce((acc, item) => acc + item.total, 0);
    const finalTotal = netAmount + manualTax;
    
    return {
      netAmount,
      tax: manualTax,
      total: finalTotal,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const totals = calculateTotals();
      const invoiceId = invoice?.id || `SINV-${Date.now().toString().slice(-6)}`;
      
      // Create or update invoice
      const invoiceData = {
        id: invoiceId,
        supplier_name: formData.supplier_name,
        supplier_invoice_number: formData.supplier_invoice_number,
        description: formData.description,
        due_date: formData.due_date,
        issue_date: formData.issue_date,
        payment_terms: formData.payment_terms,
        status: formData.status,
        subtotal: totals.netAmount,
        tax_amount: totals.tax,
        total_amount: totals.total,
        amount: totals.total,
        amount_paid: invoice?.id ? undefined : 0, // Keep existing amount_paid if editing
        outstanding_balance: totals.total - (invoice?.id ? 0 : 0), // Will be updated by trigger
      };

      const { error: invoiceError } = invoice?.id 
        ? await supabase.from('invoices').update(invoiceData).eq('id', invoice.id)
        : await supabase.from('invoices').insert(invoiceData);

      if (invoiceError) throw invoiceError;

      // Delete existing line items if editing
      if (invoice?.id) {
        await supabase.from('invoice_line_items').delete().eq('invoice_id', invoice.id);
      }

      // Insert line items
      const lineItemsData = lineItems.map(item => ({
        invoice_id: invoiceId,
        product_id: item.product_id || null,
        product_name: item.product_name,
        description: item.description,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        tax_rate: 0,
        tax_amount: 0,
        subtotal: item.total,
        total: item.total,
      }));

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItemsData);

      if (lineItemsError) throw lineItemsError;

      toast({
        title: 'Success',
        description: `Supplier invoice ${invoice?.id ? 'updated' : 'created'} successfully`,
      });

      onInvoiceCreated();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({
        title: 'Error',
        description: `Failed to ${invoice?.id ? 'update' : 'create'} supplier invoice`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_name: '',
      supplier_invoice_number: '',
      description: '',
      due_date: '',
      issue_date: new Date().toISOString().split('T')[0],
      payment_terms: 'Net 30',
      status: 'draft'
    });
    setLineItems([{
      product_name: '',
      description: '',
      quantity: 1,
      unit_cost: 0,
      total: 0,
    }]);
    setManualTax(0);
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? 'Edit' : 'Create'} Supplier Invoice</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_name">Supplier Name</Label>
              <Select value={formData.supplier_name} onValueChange={(value) => setFormData({ ...formData, supplier_name: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Or enter supplier name"
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supplier_invoice_number">Supplier Invoice Number</Label>
              <Input
                id="supplier_invoice_number"
                value={formData.supplier_invoice_number}
                onChange={(e) => setFormData({ ...formData, supplier_invoice_number: e.target.value })}
                placeholder="Enter supplier's invoice number"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issue_date">Issue Date</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <Select value={formData.payment_terms} onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                  <SelectItem value="Net 30">Net 30</SelectItem>
                  <SelectItem value="Net 60">Net 60</SelectItem>
                  <SelectItem value="Net 90">Net 90</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partially-paid">Partially Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Invoice description or notes"
              />
            </div>
          </div>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Line Items</CardTitle>
                <Button type="button" variant="outline" onClick={addLineItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product/Service</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                    <TableHead className="w-32">Unit Cost</TableHead>
                    <TableHead className="w-32">Total</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select value={item.product_id || ''} onValueChange={(value) => updateLineItem(index, 'product_id', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          className="mt-1"
                          placeholder="Or enter product name"
                          value={item.product_name}
                          onChange={(e) => updateLineItem(index, 'product_name', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          placeholder="Description"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_cost}
                          onChange={(e) => updateLineItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>KES {item.total.toFixed(2)}</TableCell>
                      <TableCell>
                        {lineItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Totals */}
              <div className="mt-4 flex justify-end">
                <div className="w-80 space-y-3">
                  <div className="flex justify-between">
                    <span>Net Amount:</span>
                    <span>KES {totals.netAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="manual_tax">Tax (Manual Entry):</Label>
                    <Input
                      id="manual_tax"
                      type="number"
                      min="0"
                      step="0.01"
                      value={manualTax}
                      onChange={(e) => setManualTax(parseFloat(e.target.value) || 0)}
                      className="w-40 text-right"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Final Total:</span>
                    <span>KES {totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (invoice ? 'Update' : 'Create') + ' Invoice'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
