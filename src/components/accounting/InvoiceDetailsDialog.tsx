import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Download, Mail, Edit, CreditCard, Paperclip } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { RecordPaymentDialog } from './RecordPaymentDialog';

interface LineItem {
  id: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_cost: number;
  tax_rate: number;
  tax_amount: number;
  subtotal: number;
  total: number;
}

interface Payment {
  id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number: string;
  notes: string;
}

interface SupplierInvoice {
  id: string;
  supplier_name: string;
  supplier_invoice_number?: string;
  amount: number;
  total_amount: number;
  amount_paid: number;
  outstanding_balance: number;
  status: string;
  due_date: string;
  issue_date: string;
  payment_terms?: string;
  description?: string;
  invoice_file_url?: string;
}

interface InvoiceDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: SupplierInvoice;
  onInvoiceUpdated: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'partially-paid': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'unpaid': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

export const InvoiceDetailsDialog: React.FC<InvoiceDetailsDialogProps> = ({
  open,
  onOpenChange,
  invoice,
  onInvoiceUpdated,
}) => {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    if (open && invoice) {
      fetchInvoiceDetails();
    }
  }, [open, invoice]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch line items
      const { data: lineItemsData, error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('created_at');

      if (lineItemsError) throw lineItemsError;
      
      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('invoice_payments')
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;
      
      setLineItems(lineItemsData || []);
      setPayments(paymentsData || []);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch invoice details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    toast({
      title: 'Export PDF',
      description: `Exporting invoice ${invoice.id} to PDF...`,
    });
  };

  const handleSendEmail = () => {
    toast({
      title: 'Send Email',
      description: `Sending invoice ${invoice.id} via email...`,
    });
  };

  const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status !== 'paid';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>Invoice Details</DialogTitle>
              <p className="text-muted-foreground">Invoice #{invoice.id}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleSendEmail}>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Invoice Header */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Supplier</h4>
                    <p>{invoice.supplier_name}</p>
                    {invoice.supplier_invoice_number && (
                      <p className="text-sm text-muted-foreground">
                        Ref: {invoice.supplier_invoice_number}
                      </p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold">Status</h4>
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1).replace('-', ' ')}
                    </Badge>
                    {isOverdue && (
                      <Badge className="ml-2 bg-red-100 text-red-800">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold">Issue Date</h4>
                    <p>{new Date(invoice.issue_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Due Date</h4>
                    <p>{new Date(invoice.due_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Payment Terms</h4>
                    <p>{invoice.payment_terms || 'Net 30'}</p>
                  </div>
                </div>

                {invoice.description && (
                  <div>
                    <h4 className="font-semibold">Description</h4>
                    <p>{invoice.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle>Line Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product/Service</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-center">Tax %</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">KES {item.unit_cost.toFixed(2)}</TableCell>
                        <TableCell className="text-center">{item.tax_rate}%</TableCell>
                        <TableCell className="text-right">KES {item.subtotal.toFixed(2)}</TableCell>
                        <TableCell className="text-right">KES {item.tax_amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">KES {item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Invoice Totals */}
                <div className="mt-6 flex justify-end">
                  <div className="w-80 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>KES {lineItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>KES {lineItems.reduce((sum, item) => sum + item.tax_amount, 0).toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>KES {(invoice.total_amount || invoice.amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Paid:</span>
                      <span>KES {invoice.amount_paid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-yellow-600 font-medium">
                      <span>Outstanding:</span>
                      <span>KES {(invoice.outstanding_balance || (invoice.total_amount || invoice.amount) - invoice.amount_paid).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            {payments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                          <TableCell>KES {payment.amount.toFixed(2)}</TableCell>
                          <TableCell className="capitalize">{payment.payment_method}</TableCell>
                          <TableCell>{payment.reference_number || '-'}</TableCell>
                          <TableCell>{payment.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {invoice.status !== 'paid' && (
                <Button onClick={() => setShowPaymentDialog(true)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>

      <RecordPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        invoice={invoice}
        onPaymentRecorded={() => {
          fetchInvoiceDetails();
          onInvoiceUpdated();
        }}
      />
    </Dialog>
  );
};