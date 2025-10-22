
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Search, Filter, Calendar, TrendingDown, Eye, Download, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  supplier_name: string;
  amount: number;
  amount_paid: number;
  issue_date: string;
  due_date: string;
  status: 'paid' | 'partially-paid' | 'unpaid' | 'overdue';
}

export const AccountsPayableTracker: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const handleViewInvoice = (invoiceId: string) => {
    toast.info(`Viewing invoice ${invoiceId}`);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.info(`Downloading invoice ${invoiceId}`);
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      // Find the invoice to get outstanding balance
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) {
        toast.error('Invoice not found');
        return;
      }

      const outstandingBalance = invoice.amount - invoice.amount_paid;

      // Record a payment for the full outstanding balance
      const { data, error } = await supabase.rpc('record_invoice_payment', {
        invoice_id_param: invoiceId,
        payment_amount: outstandingBalance,
        payment_method_param: 'cash',
        payment_date_param: new Date().toISOString().split('T')[0],
        reference_number_param: null,
        notes_param: 'Marked as paid from Accounts Payable tracker'
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to mark invoice as paid');
      }

      toast.success('Invoice marked as paid successfully');
      fetchInvoices();
    } catch (error: any) {
      console.error('Error marking invoice as paid:', error);
      toast.error('Failed to mark invoice as paid: ' + error.message);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const calculateDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Function to get status badge based on invoice status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'partially-paid':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Partially Paid</Badge>;
      case 'unpaid':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Unpaid</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center">
          <FileText className="mr-2 h-5 w-5 text-primary" />
          Accounts Payable Tracker
        </CardTitle>
        <CardDescription>
          Track and manage supplier invoices and payment deadlines
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search invoices..." className="pl-9" />
          </div>
          
          <div className="flex gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => {
                  const daysUntilDue = calculateDaysUntilDue(invoice.due_date);
                  return (
                    <TableRow key={invoice.id} className={invoice.status === 'overdue' ? "bg-red-50" : ""}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{invoice.supplier_name}</TableCell>
                      <TableCell className="text-right">
                        {invoice.status === 'partially-paid' ? (
                          <div>
                            <div className="font-medium">KES {invoice.amount_paid.toLocaleString()} / {invoice.amount.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round((invoice.amount_paid / invoice.amount) * 100)}% paid
                            </div>
                          </div>
                        ) : (
                          <div className="font-medium">KES {invoice.amount.toLocaleString()}</div>
                        )}
                      </TableCell>
                      <TableCell>{invoice.issue_date}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          {invoice.due_date}
                          {daysUntilDue < 0 && (
                            <Badge variant="outline" className="ml-2 bg-red-100 text-red-800 text-xs">
                              {Math.abs(daysUntilDue)} days late
                            </Badge>
                          )}
                          {daysUntilDue > 0 && daysUntilDue <= 7 && (
                            <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 text-xs">
                              Due soon
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleViewInvoice(invoice.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleDownloadInvoice(invoice.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-green-600"
                            onClick={() => handleMarkAsPaid(invoice.id)}
                            disabled={invoice.status === 'paid'}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing {invoices.length} invoices
            </div>
            <div className="flex items-center gap-3">
              <div className="font-medium text-sm">
                Total Due: <span className="text-primary font-bold">
                  KES {invoices.reduce((sum, inv) => sum + (inv.amount - inv.amount_paid), 0).toLocaleString()}
                </span>
              </div>
              <Button variant="outline" size="sm">
                <TrendingDown className="h-4 w-4 mr-1" />
                Pay Selected
              </Button>
            </div>
          </div>
      </CardContent>
    </Card>
  );
};
