
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Timer, Users, Keyboard } from 'lucide-react';

interface CompactPosHeaderProps {
  user: { name: string };
  networkStatus: boolean;
  isShiftStarted: boolean;
  toggleShift: () => void;
  elapsedTime: string;
  terminalInfo: {
    branch: string;
    terminalId: string;
  };
  showOrderManagement: boolean;
  setShowOrderManagement: (show: boolean) => void;
  isListening: boolean;
  pendingOrderCount?: number;
}

export const CompactPosHeader: React.FC<CompactPosHeaderProps> = ({
  user,
  networkStatus,
  isShiftStarted,
  toggleShift,
  elapsedTime,
  terminalInfo,
  showOrderManagement,
  setShowOrderManagement,
  isListening,
  pendingOrderCount = 0
}) => {
  return (
    <div className="bg-white border-b border-gray-200">
      {/* Main Header */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left Side - System Info */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900">POS System</h1>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>{user.name}</span>
                <span>•</span>
                <span>{terminalInfo.branch}</span>
                <span>•</span>
                <span>{terminalInfo.terminalId}</span>
                <div className={`ml-2 flex items-center gap-1`}>
                  <div className={`w-2 h-2 rounded-full ${networkStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs">{networkStatus ? 'Online' : 'Offline'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Actions */}
          <div className="flex items-center gap-2">
            {isShiftStarted && (
              <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <Timer className="h-3 w-3" />
                <span>{elapsedTime}</span>
              </div>
            )}
            <Button
              onClick={toggleShift}
              size="sm"
              variant={isShiftStarted ? "destructive" : "default"}
              className="text-xs px-3 py-1 h-7"
            >
              {isShiftStarted ? 'End Shift' : 'Start Shift'}
            </Button>
            <Button
              onClick={() => setShowOrderManagement(!showOrderManagement)}
              size="sm"
              variant="outline"
              className="text-xs px-3 py-1 h-7 relative"
            >
              {showOrderManagement ? 'Hide Panel' : 'Orders & Cash'}
              {!showOrderManagement && pendingOrderCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {pendingOrderCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Real-time Status */}
      {isListening && (
        <div className="px-4 py-1 bg-green-50 border-t border-green-200">
          <div className="flex items-center text-xs text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Real-time updates active - Stock and price changes will appear automatically
          </div>
        </div>
      )}
    </div>
  );
};
