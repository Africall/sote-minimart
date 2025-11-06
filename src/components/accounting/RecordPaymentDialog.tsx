// RecordPaymentDialog.tsx — FINAL VERSION
import React, { useState } from 'react';
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
  amount_paid: number;
  outstanding_balance: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: SupplierInvoice;
  onPaymentRecorded: () => void;
}

export const RecordPaymentDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  invoice,
  onPaymentRecorded,
}) => {
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'mpesa',
    reference_number: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const round2 = (n: number | string) => Math.round(Number(n) * 100) / 100;

  const total = round2(invoice.total_amount);
  const paid = round2(invoice.amount_paid);
  const balance = round2(total - paid);
  const isPaid = balance <= 0.01;

  const payFull = () => setFormData({ ...formData, amount: balance.toFixed(2) });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amt = round2(formData.amount);
      if (amt <= 0) throw new Error("Enter valid amount");
      if (amt > balance + 0.01) throw new Error(`Max: KSh ${balance.toFixed(2)}`);

      const { data, error } = await supabase.rpc('record_invoice_payment', {
        invoice_id_param: invoice.id,
        payment_amount: amt,
        payment_method_param: formData.payment_method,
        payment_date_param: formData.payment_date,
        reference_number_param: formData.reference_number || null,
        notes_param: formData.notes || null,
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed');

      toast({ title: "Paid!", description: `KSh ${amt.toFixed(2)} recorded` });
      onPaymentRecorded();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle className="text-lg">{invoice.id}</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between"><span>Supplier</span><span className="font-medium">{invoice.supplier_name}</span></div>
              <div className="flex justify-between"><span>Total</span><span>KSh {total.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Paid</span><span className="text-green-600">KSh {paid.toFixed(2)}</span></div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Balance</span>
                <span className="text-red-600">KSh {balance.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount (KSh)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                    disabled={isPaid}
                  />
                  <Button type="button" variant="outline" onClick={payFull} disabled={isPaid}>
                    Full
                  </Button>
                </div>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={formData.payment_date} onChange={e => setFormData({ ...formData, payment_date: e.target.value })} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Method</Label>
                <Select value={formData.payment_method} onValueChange={v => setFormData({ ...formData, payment_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>M-Pesa Code</Label>
                <Input
                  value={formData.reference_number}
                  onChange={e => setFormData({ ...formData, reference_number: e.target.value })}
                  placeholder="P9K8L7M2N1"
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Paid via M-Pesa..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={loading || isPaid}>
                {loading ? 'Saving...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};