import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, TrendingUp, TrendingDown, DollarSign, Calculator } from 'lucide-react';
import { formatCurrency } from '@/utils/supabaseUtils';
import type { CashTransaction } from '@/hooks/useCashManagement';

interface CashTransactionFeedProps {
  transactions: CashTransaction[];
  isLoading?: boolean;
}

export const CashTransactionFeed: React.FC<CashTransactionFeedProps> = ({
  transactions,
  isLoading = false
}) => {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'cash_in':
      case 'sale':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'cash_out':
      case 'change':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'float':
        return <DollarSign className="h-4 w-4 text-blue-600" />;
      case 'reconciliation':
        return <Calculator className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'cash_in':
      case 'sale':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cash_out':
      case 'change':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'float':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reconciliation':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'cash_in':
        return 'Cash In';
      case 'cash_out':
        return 'Cash Out';
      case 'sale':
        return 'Sale';
      case 'change':
        return 'Change';
      case 'float':
        return 'Float';
      case 'reconciliation':
        return 'Reconciliation';
      default:
        return type.replace('_', ' ').toUpperCase();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Live Transaction Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No transactions yet</p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {transactions.map((transaction, index) => (
                <div
                  key={transaction.id || index}
                  className="flex items-start justify-between p-3 bg-background rounded-lg border"
                >
                  <div className="flex items-start gap-3">
                    {getTransactionIcon(transaction.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant="outline" 
                          className={getTransactionColor(transaction.type)}
                        >
                          {formatTransactionType(transaction.type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {transaction.created_at && formatTime(transaction.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {transaction.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'cash_in' || transaction.type === 'sale'
                        ? 'text-green-600'
                        : transaction.type === 'cash_out' || transaction.type === 'change'
                        ? 'text-red-600'
                        : 'text-primary'
                    }`}>
                      {transaction.type === 'cash_out' || transaction.type === 'change' ? '-' : '+'}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};