
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreditCard, DollarSign, Printer, Wallet } from 'lucide-react';

interface CheckoutDialogProps {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  handleCheckout: (paymentMethod: string, paymentDetails?: any) => void;
  setCheckoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  formatCurrency: (amount: number) => string;
  isProcessing?: boolean;
}

export const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
  subtotal,
  discount,
  tax,
  total,
  handleCheckout,
  setCheckoutOpen,
  formatCurrency,
  isProcessing = false
}) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [splitPayment, setSplitPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [mpesaAmount, setMpesaAmount] = useState('');

  // Calculate change for cash payment
  const calculateChange = () => {
    if (splitPayment) {
      return 0; // No change in split payment
    }
    const received = parseFloat(amountReceived) || 0;
    return received - total;
  };

  const handleCompleteCheckout = () => {
    let paymentDetails = {};
    
    if (splitPayment) {
      paymentDetails = {
        splitPayment: true,
        cashAmount: parseFloat(cashAmount) || 0,
        mpesaAmount: parseFloat(mpesaAmount) || 0
      };
    } else if (paymentMethod === 'cash') {
      paymentDetails = {
        amountReceived: parseFloat(amountReceived) || total,
        change: calculateChange()
      };
    }
    
    handleCheckout(paymentMethod, paymentDetails);
  };

  const isCheckoutDisabled = () => {
    if (splitPayment) {
      const totalSplit = (parseFloat(cashAmount) || 0) + (parseFloat(mpesaAmount) || 0);
      return totalSplit !== total;
    }
    
    if (paymentMethod === 'cash') {
      return calculateChange() < 0;
    }
    
    return false;
  };

  return (
    <Dialog open={true} onOpenChange={setCheckoutOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Sale</DialogTitle>
          <DialogDescription>
            Select a payment method to complete the sale
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-2">
            <p className="col-span-2">Subtotal:</p>
            <p className="col-span-2 text-right">{formatCurrency(subtotal)}</p>
          </div>
          {discount > 0 && (
            <div className="grid grid-cols-4 items-center gap-2">
              <p className="col-span-2">Discount:</p>
              <p className="col-span-2 text-right text-destructive">-{formatCurrency(discount)}</p>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-2">
            <p className="col-span-2">VAT (16%):</p>
            <p className="col-span-2 text-right">{formatCurrency(tax)}</p>
          </div>
          <Separator />
          <div className="grid grid-cols-4 items-center gap-2">
            <p className="col-span-2 font-bold">Total:</p>
            <p className="col-span-2 text-right font-bold">{formatCurrency(total)}</p>
          </div>
          
          <div className="flex gap-2 items-center">
            <input
              type="checkbox"
              id="split-payment"
              checked={splitPayment}
              onChange={() => setSplitPayment(!splitPayment)}
              className="mr-1"
            />
            <Label htmlFor="split-payment">Split Payment</Label>
          </div>
          
          {splitPayment ? (
            <div className="space-y-3">
              <div>
                <Label>Cash Amount</Label>
                <div className="flex items-center">
                  <span className="bg-muted px-3 py-2 border-y border-l border-input rounded-l-md">KSh</span>
                  <Input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="Enter cash amount"
                    className="rounded-l-none"
                  />
                </div>
              </div>
              <div>
                <Label>M-PESA Amount</Label>
                <div className="flex items-center">
                  <span className="bg-muted px-3 py-2 border-y border-l border-input rounded-l-md">KSh</span>
                  <Input
                    type="number"
                    value={mpesaAmount}
                    onChange={(e) => setMpesaAmount(e.target.value)}
                    placeholder="Enter M-PESA amount"
                    className="rounded-l-none"
                  />
                </div>
              </div>
              {parseFloat(cashAmount) + parseFloat(mpesaAmount) !== 0 && (
                <div className="text-sm">
                  Total: {formatCurrency(parseFloat(cashAmount) || 0 + parseFloat(mpesaAmount) || 0)}
                  {parseFloat(cashAmount) + parseFloat(mpesaAmount) !== total && (
                    <span className="text-destructive ml-2">
                      (Difference: {formatCurrency((parseFloat(cashAmount) || 0) + (parseFloat(mpesaAmount) || 0) - total)})
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <RadioGroup defaultValue="cash" value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="grid grid-cols-3 gap-2">
                <div className={`border rounded-md p-3 flex items-center gap-2 cursor-pointer ${paymentMethod === 'cash' ? 'border-primary bg-primary/10' : 'border-input'}`} onClick={() => setPaymentMethod('cash')}>
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                    <DollarSign size={16} /> Cash
                  </Label>
                </div>
                <div className={`border rounded-md p-3 flex items-center gap-2 cursor-pointer ${paymentMethod === 'mpesa' ? 'border-primary bg-primary/10' : 'border-input'}`} onClick={() => setPaymentMethod('mpesa')}>
                  <RadioGroupItem value="mpesa" id="mpesa" />
                  <Label htmlFor="mpesa" className="flex items-center gap-2 cursor-pointer">
                    <Wallet size={16} /> M-PESA
                  </Label>
                </div>
                <div className={`border rounded-md p-3 flex items-center gap-2 cursor-pointer ${paymentMethod === 'card' ? 'border-primary bg-primary/10' : 'border-input'}`} onClick={() => setPaymentMethod('card')}>
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard size={16} /> Card
                  </Label>
                </div>
              </div>
            </RadioGroup>
          )}
          
          {paymentMethod === 'cash' && !splitPayment && (
            <>
              <div>
                <Label htmlFor="amount">Amount received:</Label>
                <div className="flex items-center">
                  <span className="bg-muted px-3 py-2 border-y border-l border-input rounded-l-md">KSh</span>
                  <Input
                    id="amount"
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="rounded-l-none"
                  />
                </div>
              </div>
              {parseFloat(amountReceived) > 0 && (
                <div className="flex justify-between items-center">
                  <p className="font-medium">Change:</p>
                  <p className={`text-right font-medium text-lg ${calculateChange() < 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {formatCurrency(calculateChange())}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={() => setCheckoutOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleCompleteCheckout}
              disabled={isCheckoutDisabled() || isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Printer className="mr-2 h-4 w-4" />
              {isProcessing ? 'Processing...' : 'Complete & Print'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
