import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Database } from '@/types/database';

type HeldTransactionRow = Database['public']['Tables']['held_transactions']['Row'];

interface HeldTransactionSheetProps {
  heldTransactions: HeldTransactionRow[];
  restoreTransaction: (transaction: HeldTransactionRow) => void;
  formatCurrency: (amount: number) => string;
}

export const HeldTransactionSheet: React.FC<HeldTransactionSheetProps> = ({
  heldTransactions,
  restoreTransaction,
  formatCurrency,
}) => {
  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Held Transactions</SheetTitle>
        <SheetDescription>
          Select a transaction to restore
        </SheetDescription>
      </SheetHeader>
      <div className="mt-6 space-y-4">
        {heldTransactions.map((transaction) => (
          <Card key={transaction.id} className="cursor-pointer hover:bg-muted/50" onClick={() => restoreTransaction(transaction)}>
            <CardContent className="p-3">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{transaction.id}</h3>
                <p className="font-bold">{formatCurrency(transaction.total)}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(transaction.created_at), 'MMM d, h:mm a')} • {Array.isArray(transaction.items) ? transaction.items.length : 0} items
              </p>
            </CardContent>
          </Card>
        ))}
        {heldTransactions.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No held transactions
          </div>
        )}
      </div>
    </SheetContent>
  );
};
