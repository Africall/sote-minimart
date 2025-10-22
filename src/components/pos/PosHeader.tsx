
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TopBar } from './TopBar';
import { NotificationBell } from './NotificationBell';
import { useEcommerceOrders } from '@/hooks/useEcommerceOrders';
import { ShoppingCart, Package, Users, Timer } from 'lucide-react';

interface PosHeaderProps {
  user: { name: string };
  networkStatus: boolean;
  offlineMode: boolean;
  toggleOfflineMode: () => void;
  pendingOfflineTransactions: any[];
  syncOfflineTransactions: () => void;
  isShiftStarted: boolean;
  toggleShift: () => void;
  terminalInfo: {
    branch: string;
    terminalId: string;
    currentDate: string;
    currentTime: string;
  };
  showOrderManagement: boolean;
  setShowOrderManagement: (show: boolean) => void;
  elapsedTime: string;
}

export const PosHeader: React.FC<PosHeaderProps> = ({
  user,
  networkStatus,
  offlineMode,
  toggleOfflineMode,
  pendingOfflineTransactions,
  syncOfflineTransactions,
  isShiftStarted,
  toggleShift,
  terminalInfo,
  showOrderManagement,
  setShowOrderManagement,
  elapsedTime
}) => {
  const { totalPendingCount } = useEcommerceOrders();

  return (
    <div className="bg-white border-b border-gray-200">
      <TopBar
        user={user}
        networkStatus={networkStatus}
        offlineMode={offlineMode}
        toggleOfflineMode={toggleOfflineMode}
        pendingOfflineTransactions={pendingOfflineTransactions}
        syncOfflineTransactions={syncOfflineTransactions}
        isShiftStarted={isShiftStarted}
        toggleShift={toggleShift}
        terminalInfo={terminalInfo}
        elapsedTime={elapsedTime}
      />
      
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-blue-700">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-sm font-medium">E-commerce Orders</span>
                  {totalPendingCount > 0 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {totalPendingCount}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button
              variant={showOrderManagement ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOrderManagement(!showOrderManagement)}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              {showOrderManagement ? 'Hide Orders' : 'Show Orders'}
              {totalPendingCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {totalPendingCount}
                </Badge>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            {isShiftStarted && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Timer className="h-4 w-4" />
                <span>Shift: {elapsedTime}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
