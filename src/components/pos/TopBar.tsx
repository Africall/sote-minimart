
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Wifi, WifiOff, Clock, BarChart3, LogOut, RefreshCcw, PlayCircle, StopCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TopBarProps {
  user: any;
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
  elapsedTime: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  networkStatus,
  offlineMode,
  toggleOfflineMode,
  pendingOfflineTransactions,
  syncOfflineTransactions,
  isShiftStarted,
  toggleShift,
  terminalInfo,
  elapsedTime
}) => {
  return (
    <div className="flex justify-between items-center border-b pb-4">
      <h1 className="text-2xl font-bold">SOTE MINIMART POS</h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <User size={16} />
          <span>Cashier: {user?.name}</span>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-2 text-sm">
          {terminalInfo.branch} | {terminalInfo.terminalId}
        </div>
        <Separator orientation="vertical" className="h-6" />
        {isShiftStarted && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} />
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <span>Shift Time: {elapsedTime}</span>
              </Badge>
            </div>
            <Separator orientation="vertical" className="h-6" />
          </>
        )}
        <div className="flex items-center gap-2 text-sm">
          {networkStatus ? 
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex gap-1">
              <Wifi size={14} /> Online
            </Badge> : 
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex gap-1">
              <WifiOff size={14} /> Offline
            </Badge>
          }
          {(!networkStatus || (networkStatus && offlineMode)) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className={offlineMode ? "bg-yellow-50 text-yellow-700" : ""}
              onClick={toggleOfflineMode}
            >
              {offlineMode ? "Disable Offline Mode" : "Enable Offline Mode"}
            </Button>
          )}
          {networkStatus && pendingOfflineTransactions.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              className="bg-blue-50 text-blue-700 border-blue-200 flex gap-1"
              onClick={syncOfflineTransactions}
            >
              <RefreshCcw size={14} />
              Sync ({pendingOfflineTransactions.length})
            </Button>
          )}
        </div>
        <Separator orientation="vertical" className="h-6" />
        <Button 
          variant={isShiftStarted ? "destructive" : "default"} 
          size="sm" 
          className="flex items-center gap-2"
          onClick={toggleShift}
        >
          {isShiftStarted ? <StopCircle size={16} /> : <PlayCircle size={16} />}
          <span>{isShiftStarted ? 'End Shift' : 'Start Shift'}</span>
        </Button>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <BarChart3 size={16} />
          <span>Daily Summary</span>
        </Button>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <LogOut size={16} />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
};
