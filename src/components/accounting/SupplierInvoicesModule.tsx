import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Filter, Eye, Edit, CreditCard, Paperclip, Download, Mail, MoreHorizontal, Loader2, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CreateSupplierInvoiceDialog } from './CreateSupplierInvoiceDialog';
import { InvoiceDetailsDialog } from './InvoiceDetailsDialog';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import { AccountsPayableTracker } from '@/components/accountant/AccountsPayableTracker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LineItem {
  product_name: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

interface SupplierInvoice {
  id: string;
  supplier_name: string;
  supplier_invoice_number: string;
  amount: number;
  total_amount: number;
  amount_paid: number;
  outstanding_balance: number;
  status: string;
  due_date: string;
  issue_date: string;
  payment_terms: string;
  description: string;
  invoice_file_url?: string;
  line_items?: LineItem[];
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

export const SupplierInvoicesModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<SupplierInvoice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      
      // Fetch all invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Fetch line items for all invoices
      if (invoicesData && invoicesData.length > 0) {
        const invoiceIds = invoicesData.map(inv => inv.id);
        const { data: lineItemsData, error: lineItemsError } = await supabase
          .from('invoice_line_items')
          .select('invoice_id, product_name, quantity, unit_cost, total')
          .in('invoice_id', invoiceIds);

        if (lineItemsError) throw lineItemsError;

        // Group line items by invoice
        const lineItemsByInvoice = lineItemsData?.reduce((acc, item) => {
          if (!acc[item.invoice_id]) {
            acc[item.invoice_id] = [];
          }
          acc[item.invoice_id].push({
            product_name: item.product_name,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            total: item.total
          });
          return acc;
        }, {} as Record<string, LineItem[]>) || {};

        // Attach line items to invoices
        const invoicesWithItems = invoicesData.map(invoice => ({
          ...invoice,
          line_items: lineItemsByInvoice[invoice.id] || []
        }));

        setInvoices(invoicesWithItems);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch supplier invoices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.supplier_invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewInvoice = (invoice: SupplierInvoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsDialog(true);
  };

  const handleEditInvoice = (invoice: SupplierInvoice) => {
    setSelectedInvoice(invoice);
    setShowCreateDialog(true);
  };

  const handleRecordPayment = (invoice: SupplierInvoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentDialog(true);
  };

  const handleExportPDF = (invoiceId: string) => {
    toast({
      title: 'Export PDF',
      description: `Exporting invoice ${invoiceId} to PDF...`,
    });
  };

  const handleSendEmail = (invoiceId: string) => {
    toast({
      title: 'Send Email',
      description: `Sending invoice ${invoiceId} via email...`,
    });
  };

  const handleDeleteClick = (invoice: SupplierInvoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteDialog(true);
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;

    setIsDeleting(true);
    try {
      // First delete line items
      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .delete()
        .eq('invoice_id', invoiceToDelete.id);

      if (lineItemsError) throw lineItemsError;

      // Then delete the invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceToDelete.id);

      if (invoiceError) throw invoiceError;

      toast({
        title: 'Success',
        description: `Invoice ${invoiceToDelete.id} has been deleted successfully`,
      });

      // Refresh the invoice list
      await fetchInvoices();
      setShowDeleteDialog(false);
      setInvoiceToDelete(null);
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete invoice',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate totals
  const totals = filteredInvoices.reduce((acc, invoice) => ({
    total: acc.total + (invoice.total_amount || invoice.amount),
    paid: acc.paid + invoice.amount_paid,
    outstanding: acc.outstanding + (invoice.outstanding_balance || (invoice.total_amount || invoice.amount) - invoice.amount_paid),
    overdue: acc.overdue + (invoice.status === 'overdue' ? (invoice.outstanding_balance || (invoice.total_amount || invoice.amount) - invoice.amount_paid) : 0),
  }), { total: 0, paid: 0, outstanding: 0, overdue: 0 });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Supplier Invoices & Accounts Payable</h2>
          <p className="text-muted-foreground">Manage supplier bills, payments, and track payables</p>
        </div>
        <Button onClick={() => {
          setSelectedInvoice(null);
          setShowCreateDialog(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invoices">Invoice Management</TabsTrigger>
          <TabsTrigger value="payables">Accounts Payable Tracker</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSh {totals.total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">KSh {totals.paid.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">KSh {totals.outstanding.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">KSh {totals.overdue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices by supplier, invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partially-paid">Partially Paid</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No. / Product</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No supplier invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <React.Fragment key={invoice.id}>
                      {/* Invoice Header Row */}
                      <TableRow className="bg-muted/50 font-medium border-b-2">
                        <TableCell className="font-bold">
                          <div>
                            <div>{invoice.id}</div>
                            {invoice.supplier_invoice_number && (
                              <div className="text-sm text-muted-foreground font-normal">
                                Ref: {invoice.supplier_invoice_number}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold">{invoice.supplier_name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-muted-foreground text-sm">
                            {invoice.line_items?.length || 0} item(s)
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell>
                          <div className="font-bold">KSh {(invoice.total_amount || invoice.amount).toLocaleString()}</div>
                        </TableCell>
                        <TableCell className="text-green-600">
                          <div className="font-bold">KSh {invoice.amount_paid.toLocaleString()}</div>
                        </TableCell>
                        <TableCell className="text-yellow-600">
                          <div className="font-bold">
                            KSh {(invoice.outstanding_balance || (invoice.total_amount || invoice.amount) - invoice.amount_paid).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1).replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleViewInvoice(invoice)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEditInvoice(invoice)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {invoice.status !== 'paid' && (
                              <Button 
                                size="sm" 
                                variant="default"
                                className="bg-primary hover:bg-primary/90"
                                onClick={() => handleRecordPayment(invoice)}
                              >
                                <CreditCard className="h-4 w-4 mr-1" />
                                Pay
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleExportPDF(invoice.id)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Export PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendEmail(invoice.id)}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Paperclip className="h-4 w-4 mr-2" />
                                  Attach File
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteClick(invoice)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Invoice
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Line Items Rows */}
                      {invoice.line_items && invoice.line_items.length > 0 ? (
                        invoice.line_items.map((item, idx) => (
                          <TableRow key={`${invoice.id}-item-${idx}`} className="border-b-0">
                            <TableCell className="pl-8">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">└</span>
                                <span className="font-medium">{item.product_name}</span>
                              </div>
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-sm">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-sm">
                              KSh {item.unit_cost.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-sm">
                              KSh {item.total.toLocaleString()}
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow className="border-b-0">
                          <TableCell className="pl-8 text-sm text-muted-foreground" colSpan={10}>
                            No line items
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateSupplierInvoiceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onInvoiceCreated={fetchInvoices}
        invoice={selectedInvoice}
      />
      
      {selectedInvoice && (
        <>
          <InvoiceDetailsDialog
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
            invoice={selectedInvoice}
            onInvoiceUpdated={fetchInvoices}
          />
          
          <RecordPaymentDialog
            open={showPaymentDialog}
            onOpenChange={setShowPaymentDialog}
            invoice={selectedInvoice}
            onPaymentRecorded={fetchInvoices}
          />
        </>
      )}
        </TabsContent>

        <TabsContent value="payables" className="space-y-6">
          <AccountsPayableTracker />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice <strong>{invoiceToDelete?.id}</strong> from <strong>{invoiceToDelete?.supplier_name}</strong>?
              <br /><br />
              <span className="text-red-600 font-semibold">
                This action cannot be undone. The invoice and all its line items will be permanently removed.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInvoice}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Invoice
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
