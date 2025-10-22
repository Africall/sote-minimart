
import React from 'react';
import { Product } from '../../types/product';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell } from 'lucide-react';

interface LowStockAlertDialogProps {
  lowStockProduct: Product | null;
  setShowLowStockAlert: React.Dispatch<React.SetStateAction<boolean>>;
}

export const LowStockAlertDialog: React.FC<LowStockAlertDialogProps> = ({
  lowStockProduct,
  setShowLowStockAlert
}) => {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center text-amber-500 gap-2">
          <Bell size={18} /> Low Stock Alert
        </DialogTitle>
        <DialogDescription>
          This product has limited stock available
        </DialogDescription>
      </DialogHeader>
      
      {lowStockProduct && (
        <div className="py-4">
          <Alert className="bg-amber-50 text-amber-700 border-amber-200">
            <AlertDescription>
              <div className="flex flex-col gap-2">
                <p className="font-bold">{lowStockProduct.name}</p>
                <p>Only {lowStockProduct.quantity} units remaining in stock.</p>
                <p className="text-sm">Consider reordering this product soon to avoid stockout.</p>
              </div>
            </AlertDescription>
          </Alert>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowLowStockAlert(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </DialogContent>
  );
};
