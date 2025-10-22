
import React from 'react';
import { Button } from '@/components/ui/button';
import { Keyboard, RefreshCw } from 'lucide-react';
import { useCashManagement } from '@/hooks/useCashManagement';

interface CompactDailyStatsProps {
  dailyStats: {
    totalSales: number;
    totalTransactions: number;
    itemsSold: number;
    floatRemaining: number;
  };
  formatCurrency: (amount: number) => string;
  setShowShortcuts: (show: boolean) => void;
}

export const CompactDailyStats: React.FC<CompactDailyStatsProps> = ({
  dailyStats,
  formatCurrency,
  setShowShortcuts
}) => {
  const { cashBalance, refreshData, currentShift } = useCashManagement();

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span><strong>Today's Total:</strong> {formatCurrency(dailyStats.totalSales)}</span>
          <span>Items Sold: {dailyStats.itemsSold}</span>
          <div className="flex items-center gap-1">
            <span>Till Balance: <strong className="text-primary">{formatCurrency(cashBalance.realTimeBalance)}</strong></span>
            <Button variant="ghost" size="sm" onClick={refreshData} className="h-4 w-4 p-0">
              <RefreshCw size={10} />
            </Button>
          </div>
          <span>Shift: {currentShift ? 'Active' : 'Inactive'}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-6 px-2"
          onClick={() => setShowShortcuts(true)}
        >
          <Keyboard className="h-3 w-3 mr-1" />
          Shortcuts
        </Button>
      </div>
    </div>
  );
};
