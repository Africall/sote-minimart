
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Ticket, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCashManagement } from '@/hooks/useCashManagement';

interface DailyStatsFooterProps {
  dailyStats: {
    totalSales: number;
    itemsSold: number;
    floatRemaining: number;
    shiftStart: string;
    shiftEnd: string;
  };
  formatCurrency: (amount: number) => string;
  setShowShortcuts: React.Dispatch<React.SetStateAction<boolean>>;
}

export const DailyStatsFooter: React.FC<DailyStatsFooterProps> = ({
  dailyStats,
  formatCurrency,
  setShowShortcuts
}) => {
  const queryClient = useQueryClient();
  const { cashBalance, refreshData } = useCashManagement();

  // Listen for transaction updates and invalidate daily stats
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'updated' && 
          (event.query.queryKey.includes('transactions') || 
           event.query.queryKey.includes('sales'))) {
        console.log('Transaction updated, invalidating daily stats');
        queryClient.invalidateQueries({ queryKey: ['dailyStats'] });
      }
    });

    return unsubscribe;
  }, [queryClient]);

  const handleRefresh = () => {
    refreshData();
    queryClient.invalidateQueries({ queryKey: ['dailyStats'] });
  };

  return (
    <div className="mt-4 py-3 border-t flex justify-between items-center text-sm bg-muted/30 px-4 rounded-md">
      <div className="flex items-center gap-1">
        <Ticket size={14} />
        <span className="font-medium">Today's Total:</span> {formatCurrency(dailyStats.totalSales)}
      </div>
      <div>Items Sold: <span className="font-medium">{dailyStats.itemsSold}</span></div>
      <div className="flex items-center gap-1">
        <span>Till Balance:</span> 
        <span className="font-medium text-primary">{formatCurrency(cashBalance.realTimeBalance)}</span>
        <Button variant="ghost" size="sm" onClick={handleRefresh} className="h-6 w-6 p-0">
          <RefreshCw size={12} />
        </Button>
      </div>
      <div>Shift: <span className="font-medium">{dailyStats.shiftStart} - {dailyStats.shiftEnd}</span></div>
      <Button variant="link" size="sm" onClick={() => setShowShortcuts(true)}>Keyboard Shortcuts</Button>
    </div>
  );
};
