import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ReceiptCustomization {
  thankYouMessage: string;
  showCashierName: boolean;
  showDateTime: boolean;
  additionalFooter: string;
}

interface CustomizeReceiptDialogProps {
  receiptCustomization: ReceiptCustomization;
  setReceiptCustomization: React.Dispatch<React.SetStateAction<ReceiptCustomization>>;
  setCustomizeReceiptOpen: React.Dispatch<React.SetStateAction<boolean>>;
  terminalInfo: {
    branch: string;
    currentDate: string;
  };
  user?: {
    name: string;
  };
}

export const CustomizeReceiptDialog: React.FC<CustomizeReceiptDialogProps> = ({
  receiptCustomization,
  setReceiptCustomization,
  setCustomizeReceiptOpen,
  terminalInfo,
  user
}) => {
  return (
    <Dialog open={true} onOpenChange={setCustomizeReceiptOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Customize Receipt</DialogTitle>
          <DialogDescription>
            Personalize the receipt for your customers
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="thank-you-message">Thank You Message</Label>
            <Input 
              id="thank-you-message" 
              value={receiptCustomization.thankYouMessage}
              onChange={(e) => setReceiptCustomization({
                ...receiptCustomization, 
                thankYouMessage: e.target.value
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional-footer">Additional Footer Text</Label>
            <Textarea 
              id="additional-footer" 
              value={receiptCustomization.additionalFooter}
              onChange={(e) => setReceiptCustomization({
                ...receiptCustomization, 
                additionalFooter: e.target.value
              })}
              placeholder="Enter additional text to display at the bottom of the receipt"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="show-cashier" 
              checked={receiptCustomization.showCashierName} 
              onCheckedChange={(checked) => setReceiptCustomization({
                ...receiptCustomization,
                showCashierName: checked
              })}
            />
            <Label htmlFor="show-cashier">Show Cashier Name</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="show-datetime" 
              checked={receiptCustomization.showDateTime} 
              onCheckedChange={(checked) => setReceiptCustomization({
                ...receiptCustomization,
                showDateTime: checked
              })}
            />
            <Label htmlFor="show-datetime">Show Date and Time</Label>
          </div>

          <div className="bg-muted p-4 rounded-md">
            <h3 className="text-sm font-medium mb-2">Receipt Preview</h3>
            <ScrollArea className="h-80 w-full rounded-md">
              <div className="text-sm space-y-1 font-mono whitespace-pre overflow-x-auto p-2">
                <p className="text-center">════════════════════════════════</p>
                <p className="text-center">🛒 SOTE MINIMART</p>
                <p className="text-center">Ngong Road, Nairobi Kenya</p>
                <p className="text-center">Till: 123456 | VAT No: P051234567K</p>
                <p className="text-center">Phone: 0712 345 678</p>
                <p className="text-center">════════════════════════════════</p>
                {receiptCustomization.showDateTime && (
                  <>
                    <p>RECEIPT #:   #SOTE-07145</p>
                    <p>DATE:        21-May-2025</p>
                    <p>TIME:        1:42 PM</p>
                  </>
                )}
                {receiptCustomization.showCashierName && user?.name && (
                  <p>CASHIER:     {user.name}</p>
                )}
                <p className="text-center">════════════════════════════════</p>
                <p>ITEM                  QTY   PRICE    VAT     TOTAL</p>
                <p>───────────────────────────────────────────────</p>
                <p>Soko Maize Meal       1     180.00   24.83    204.83</p>
                <p>Ajab Flour 2kg        2     165.00   45.52    375.52</p>
                <p>Brookside Milk 500ml  3      55.00   22.76    187.76</p>
                <p>Sunlight Soap         1      80.00   11.03     91.03</p>
                <p className="text-center">════════════════════════════════</p>
                <p>SUBTOTAL (Incl. VAT):            Ksh 859.14</p>
                <p>TOTAL VAT:                       Ksh 104.14</p>
                <p>TOTAL PAYABLE:                   Ksh 963.28</p>
                <p></p>
                <p>PAYMENT METHOD:                  M-PESA</p>
                <p>AMOUNT PAID:                     Ksh 963.28</p>
                <p>CHANGE:                          Ksh 0.00</p>
                <p className="text-center">════════════════════════════════</p>
                <p className="text-center">🌟 {receiptCustomization.thankYouMessage} 🌟</p>
                <p className="text-center">Enjoy Freshness & Fair Prices</p>
                {receiptCustomization.additionalFooter && (
                  <p className="text-center">{receiptCustomization.additionalFooter}</p>
                )}
                <p className="text-center">www.sote.co.ke | hello@sote.co.ke</p>
                <p className="text-center">════════════════════════════════</p>
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => setCustomizeReceiptOpen(false)}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
