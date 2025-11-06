import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface LineItem {
  id?: string;
  product_id?: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_cost: number;
  total: number;
  expiry_date?: string;
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
    status: 'unpaid'
  });
  
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      product_name: '',
      description: '',
      quantity: 1,
      unit_cost: 0,
      total: 0,
      expiry_date: '',
    }
  ]);
  
  const [manualTax, setManualTax] = useState<number>(0);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openProductCombobox, setOpenProductCombobox] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    if (open) {
      fetchProducts();
      fetchSuppliers();
      
      if (invoice) {
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
      } else {
        resetForm();
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
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('tax_amount')
        .eq('id', invoiceId)
        .single();
      
      if (invoiceError) throw invoiceError;
      if (invoiceData?.tax_amount) setManualTax(invoiceData.tax_amount);

      const { data: lineItemsData, error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', invoiceId);
      
      if (lineItemsError) throw lineItemsError;
      
      if (lineItemsData && lineItemsData.length > 0) {
        setLineItems(lineItemsData.map(item => ({
          ...item,
          expiry_date: item.expiry_date || ''
        })));
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    }
  };

  const calculateLineItem = (item: LineItem): LineItem => {
    const total = item.quantity * item.unit_cost;
    return { ...item, total };
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index].product_name = product.name;
        updatedItems[index].unit_cost = product.cost || product.price || 0;
      }
    }
    
    updatedItems[index] = calculateLineItem(updatedItems[index]);
    setLineItems(updatedItems);
  };

  const addLineItem = () => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    setLineItems([...lineItems, {
      product_name: '',
      description: '',
      quantity: 1,
      unit_cost: 0,
      total: 0,
      expiry_date: thirtyDaysFromNow.toISOString().split('T')[0], // Auto 30 days
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
    return { netAmount, tax: manualTax, total: finalTotal };
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const totals = calculateTotals();
    const invoiceId = invoice?.id || `SINV-${Date.now().toString().slice(-6)}`;
    
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
      amount_paid: invoice?.id ? undefined : 0,
      outstanding_balance: totals.total,
    };

    const { error: invoiceError } = invoice?.id 
      ? await supabase.from('invoices').update(invoiceData).eq('id', invoice.id)
      : await supabase.from('invoices').insert(invoiceData);

    if (invoiceError) throw invoiceError;

    if (invoice?.id) {
      await supabase.from('invoice_line_items').delete().eq('invoice_id', invoice.id);
    }

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
      expiry_date: item.expiry_date || null,
    }));

    const { error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .insert(lineItemsData);

    if (lineItemsError) throw lineItemsError;

    // ONLY ON CREATE: Update stock + expiry_queue
    if (!invoice?.id) {
      // 1. Update stock
      const stockPromises = lineItems
        .filter(item => item.product_id)
        .map(item => supabase.rpc('update_product_stock', {
          product_id_param: item.product_id!,
          quantity_change: item.quantity
        }));

      const stockResults = await Promise.all(stockPromises);
      const stockErrors = stockResults.filter(r => r.error);
      if (stockErrors.length > 0) {
        toast({ title: "Stock Warning", description: "Some stock updates failed", variant: "destructive" });
      }

      // 2. Push expiry dates to queue
      const expiryUpdates = lineItems
        .filter(item => item.product_id && item.expiry_date)
        .map(async (item) => {
          // First: GET current queue
          const { data: product } = await supabase
            .from('products')
            .select('expiry_queue')
            .eq('id', item.product_id!)
            .single();

          const currentQueue = product?.expiry_queue || [];
          const newQueue = [...currentQueue, item.expiry_date!];

          // Then: UPDATE with new array
          const { error } = await supabase
            .from('products')
            .update({ expiry_queue: newQueue })
            .eq('id', item.product_id!);

          if (error) console.error('Expiry queue error:', error);
        });

      await Promise.all(expiryUpdates);
    }

    toast({ 
      title: "Success", 
      description: `Invoice ${invoice?.id ? 'updated' : 'created'} and expiry queue updated!` 
    });

    onInvoiceCreated();
    onOpenChange(false);
    resetForm();
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Failed to save",
      variant: "destructive",
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
      status: 'unpaid'
    });
    setLineItems([{
      product_name: '',
      description: '',
      quantity: 1,
      unit_cost: 0,
      total: 0,
      expiry_date: '',
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
          {/* Header Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supplier Name</Label>
              <Select value={formData.supplier_name} onValueChange={(v) => setFormData({ ...formData, supplier_name: v })}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                placeholder="Or type manually"
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Supplier Invoice #</Label>
              <Input
                value={formData.supplier_invoice_number}
                onChange={(e) => setFormData({ ...formData, supplier_invoice_number: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div><Label>Issue Date</Label><Input type="date" value={formData.issue_date} onChange={e => setFormData({ ...formData, issue_date: e.target.value })} required /></div>
            <div><Label>Due Date</Label><Input type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} required /></div>
            <div><Label>Terms</Label>
              <Select value={formData.payment_terms} onValueChange={v => setFormData({ ...formData, payment_terms: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                  <SelectItem value="Net 30">Net 30</SelectItem>
                  <SelectItem value="Net 60">Net 60</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
          </div>

          {/* LINE ITEMS */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Line Items</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-20">Qty</TableHead>
                    <TableHead className="w-28">Unit Cost</TableHead>
                    <TableHead className="w-28">Total</TableHead>
                    <TableHead className="w-36">Expiry Date</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Popover open={openProductCombobox[index]} onOpenChange={open => setOpenProductCombobox({ ...openProductCombobox, [index]: open })}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              {item.product_name || "Select..."} <ChevronsUpDown className="h-4 w-4 ml-2 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0">
                            <Command>
                              <CommandInput placeholder="Search products..." />
                              <CommandList>
                                <CommandEmpty>No product found.</CommandEmpty>
                                <CommandGroup>
                                  {products.map(product => (
                                    <CommandItem
                                      key={product.id}
                                      onSelect={() => {
                                        updateLineItem(index, 'product_id', product.id);
                                        setOpenProductCombobox({ ...openProductCombobox, [index]: false });
                                      }}
                                    >
                                      <Check className={cn("mr-2 h-4 w-4", item.product_id === product.id ? "opacity-100" : "opacity-0")} />
                                      {product.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <Input
                          className="mt-1"
                          placeholder="or type name"
                          value={item.product_name}
                          onChange={e => updateLineItem(index, 'product_name', e.target.value)}
                        />
                      </TableCell>

                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={e => updateLineItem(index, 'description', e.target.value)}
                          placeholder="Desc"
                        />
                      </TableCell>

                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          className="w-20"
                          value={item.quantity}
                          onChange={e => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </TableCell>

                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          className="w-28"
                          value={item.unit_cost}
                          onChange={e => updateLineItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>

                      <TableCell className="font-medium">
                        KES {item.total.toFixed(2)}
                      </TableCell>

                      <TableCell>
                        <Input
                          type="date"
                          className="w-full"
                          value={item.expiry_date || ''}
                          onChange={e => updateLineItem(index, 'expiry_date', e.target.value)}
                        />
                      </TableCell>

                      <TableCell>
                        {lineItems.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between">
                    <span>Net Amount:</span>
                    <span>KES {totals.netAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="tax">Tax:</Label>
                    <Input
                      id="tax"
                      type="number"
                      step="0.01"
                      value={manualTax}
                      onChange={e => setManualTax(parseFloat(e.target.value) || 0)}
                      className="w-32 text-right"
                    />
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
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
              {isSubmitting ? 'Saving...' : invoice ? 'Update' : 'Create'} Invoice
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};