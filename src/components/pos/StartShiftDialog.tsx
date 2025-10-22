import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, DollarSign } from 'lucide-react';

interface StartShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartShift: (floatAmount: number) => Promise<boolean>;
  loading: boolean;
}

export const StartShiftDialog: React.FC<StartShiftDialogProps> = ({
  open,
  onOpenChange,
  onStartShift,
  loading
}) => {
  const [floatAmount, setFloatAmount] = useState('0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(floatAmount);
    
    if (amount < 0) {
      return;
    }

    const success = await onStartShift(amount);
    if (success) {
      setFloatAmount('0');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Start Your Shift
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              Enter the initial cash float amount for your shift. This is the starting cash in your till.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="floatAmount">Float Amount (KES)</Label>
            <Input
              id="floatAmount"
              type="number"
              value={floatAmount}
              onChange={(e) => setFloatAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
            <p className="text-sm text-muted-foreground">
              Enter the actual amount of cash you have in your till to start the shift.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Starting...' : 'Start Shift'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};