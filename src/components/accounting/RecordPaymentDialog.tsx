import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SupplierInvoice {
  id: string;
  supplier_name: string;
  total_amount: number;
  amount: number;
  amount_paid: number;
  outstanding_balance: number;
  status: string;
}

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: SupplierInvoice;
  onPaymentRecorded: () => void;
}

export const RecordPaymentDialog: React.FC<RecordPaymentDialogProps> = ({
  open,
  onOpenChange,
  invoice,
  onPaymentRecorded,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const submitRef = useRef<HTMLButtonElement | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference_number: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const outstandingAmount = invoice.outstanding_balance || (invoice.total_amount || invoice.amount) - invoice.amount_paid;
  
  // Handle floating-point precision issues - treat balances < 0.01 as fully paid
  const MINIMUM_PAYMENT = 0.01;
  const isEffectivelyPaid = outstandingAmount < MINIMUM_PAYMENT;
  const maxPaymentAmount = isEffectivelyPaid ? 0 : outstandingAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if invoice is effectively paid due to floating-point precision
      if (isEffectivelyPaid) {
        toast({
          title: 'Invoice Already Paid',
          description: 'This invoice has been fully paid (remaining balance is less than KSh 0.01)',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const paymentAmount = parseFloat(formData.amount);
      if (Number.isNaN(paymentAmount)) {
        toast({
          title: 'Invalid Amount',
          description: 'Please enter a valid payment amount',
          variant: 'destructive',
        });
        return;
      }
      
      if (paymentAmount < MINIMUM_PAYMENT) {
        toast({
          title: 'Invalid Amount',
          description: `Payment amount must be at least KSh ${MINIMUM_PAYMENT.toFixed(2)}`,
          variant: 'destructive',
        });
        return;
      }

      if (paymentAmount > maxPaymentAmount + MINIMUM_PAYMENT) {
        toast({
          title: 'Amount Too High',
          description: `Payment amount cannot exceed outstanding balance of KSh ${maxPaymentAmount.toFixed(2)}`,
          variant: 'destructive',
        });
        return;
      }

      console.log('Recording payment for invoice:', invoice.id, 'Amount:', paymentAmount);
      
      // Use the record_invoice_payment function for proper payment recording
      const { data, error } = await supabase.rpc('record_invoice_payment', {
        invoice_id_param: invoice.id,
        payment_amount: paymentAmount,
        payment_method_param: formData.payment_method,
        payment_date_param: formData.payment_date,
        reference_number_param: formData.reference_number || null,
        notes_param: formData.notes || null
      });

      console.log('Payment recording response:', { data, error });

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data?.success) {
        const errorMsg = data?.error || 'Unknown error occurred';
        const errorCode = data?.error_code || 'UNKNOWN';
        
        console.error('Payment recording failed:', { data, errorCode });
        
        // Provide user-friendly error messages based on error codes
        let userMessage = errorMsg;
        switch (errorCode) {
          case 'NOT_AUTHENTICATED':
            userMessage = 'Please log in to record payments';
            break;
          case 'INSUFFICIENT_PERMISSIONS':
            userMessage = `You don't have permission to record payments. Current role: ${data?.user_role || 'unknown'}`;
            break;
          case 'INVOICE_NOT_FOUND':
            userMessage = 'Invoice not found. Please refresh and try again.';
            break;
          case 'INVALID_AMOUNT':
            userMessage = 'Payment amount must be greater than zero';
            break;
          case 'AMOUNT_EXCEEDS_BALANCE':
            userMessage = `Payment amount (${data?.payment_amount}) exceeds outstanding balance (${data?.outstanding_balance})`;
            break;
          default:
            userMessage = `Payment failed: ${errorMsg}`;
        }
        
        throw new Error(userMessage);
      }

      console.log('Payment recorded successfully:', data);
      
      toast({
        title: 'Payment Recorded',
        description: `Payment of KSh ${paymentAmount.toFixed(2)} recorded successfully`,
      });

      onPaymentRecorded();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error recording payment:', error);
      const errMsg = (error as any)?.message || (typeof error === 'string' ? error : 'Failed to record payment');
      toast({
        title: 'Error',
        description: errMsg,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      reference_number: '',
      notes: '',
    });
  };

  const setFullPayment = () => {
    if (!isEffectivelyPaid) {
      setFormData({ ...formData, amount: maxPaymentAmount.toFixed(2) });
    }
  };

  const scrollToSubmit = (smooth = true) => {
    // Try to scroll the inner container so the submit button becomes visible
    if (submitRef.current) {
      submitRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' });
    } else if (scrollContainerRef.current) {
      // fallback: scroll to bottom
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        
  <div ref={scrollContainerRef} className="max-h-[70vh] overflow-auto space-y-4 pb-4">
  {/* Invoice Summary */}
  <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Invoice:</span>
              <span className="font-medium">{invoice.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Supplier:</span>
              <span className="font-medium">{invoice.supplier_name}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span className="font-medium">KSh {(invoice.total_amount || invoice.amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount Paid:</span>
              <span className="font-medium text-green-600">KSh {invoice.amount_paid.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Outstanding Balance:</span>
              <span className="text-red-600">KSh {outstandingAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount (KSh)</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  max={isEffectivelyPaid ? undefined : maxPaymentAmount}
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  onFocus={() => scrollToSubmit()}
                  placeholder="0.00"
                  required
                  disabled={isEffectivelyPaid}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={setFullPayment}
                  disabled={isEffectivelyPaid}
                >
                  Full
                </Button>
              </div>
              {isEffectivelyPaid && (
                <p className="text-sm text-yellow-600">
                  This invoice is fully paid (remaining balance less than KSh 0.01)
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reference_number">Reference Number</Label>
              <Input
                id="reference_number"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                placeholder="Transaction ID, Cheque #, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              onFocus={() => scrollToSubmit()}
              placeholder="Additional notes about this payment"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button ref={submitRef as any} type="submit" disabled={isSubmitting} onFocus={() => scrollToSubmit(false)}>
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
