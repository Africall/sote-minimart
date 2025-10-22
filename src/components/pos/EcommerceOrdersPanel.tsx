
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EcommerceOrderNotification } from './EcommerceOrderNotification';
import OrderDetailsDialog from '@/components/orders/OrderDetailsDialog';
import { useEcommerceOrders } from '@/hooks/useEcommerceOrders';
import { ShoppingCart, RefreshCw, Package } from 'lucide-react';

export const EcommerceOrdersPanel: React.FC = () => {
  const { pendingOrders, totalPendingCount, updateOrderStatus, completeOrder, refetchPendingOrders } = useEcommerceOrders();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setIsUpdating(true);
    try {
      await updateOrderStatus(orderId, status);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    setIsCompleting(true);
    try {
      await completeOrder(orderId, true); // Complete with receipt printing option
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              E-commerce Orders
              {totalPendingCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {totalPendingCount} pending
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refetchPendingOrders}
              title="Refresh orders"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No pending e-commerce orders</p>
                <p className="text-sm text-muted-foreground mt-1">
                  New orders will appear here automatically
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <EcommerceOrderNotification
                    key={order.id}
                    order={order}
                    onUpdateStatus={handleUpdateStatus}
                    onViewDetails={handleViewDetails}
                    onCompleteOrder={handleCompleteOrder}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <OrderDetailsDialog
        order={selectedOrder}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCompleteOrder={handleCompleteOrder}
        onUpdateStatus={handleUpdateStatus}
        isCompleting={isCompleting}
        isUpdating={isUpdating}
      />
    </>
  );
};
