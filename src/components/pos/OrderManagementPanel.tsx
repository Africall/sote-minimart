
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useOrders, Order } from '@/hooks/useOrders';
import { formatCurrency } from '@/utils/supabaseUtils';
import { Package, Clock, CheckCircle, XCircle, Eye, RefreshCw } from 'lucide-react';

export const OrderManagementPanel: React.FC = () => {
  const { orders, loading, updateOrderStatus, refetchOrders } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading orders...</div>
        </CardContent>
      </Card>
    );
  }

  const pendingOrders = orders.filter((order: Order) => 
    order.order_status === 'pending' || order.order_status === 'processing'
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Management ({pendingOrders.length} pending)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            {pendingOrders.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No pending orders
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map((order: Order) => (
                  <div key={order.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">Order #{order.id.slice(0, 8)}</h4>
                        <p className="text-sm text-muted-foreground">
                          {order.guest_name || 'Guest Order'}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.order_status)}>
                        {getStatusIcon(order.order_status)}
                        <span className="ml-1">{order.order_status}</span>
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">{formatCurrency(Number(order.total))}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(order)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      
                      {order.order_status === 'pending' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'processing')}
                          className="flex-1"
                        >
                          Process
                        </Button>
                      )}
                      
                      {order.order_status === 'processing' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="flex-1"
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Order #{selectedOrder.id.slice(0, 8)}</h4>
                <p className="text-sm text-muted-foreground">
                  Customer: {selectedOrder.guest_name || 'Guest'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Email: {selectedOrder.guest_email || 'N/A'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Delivery Address:</p>
                <p className="text-sm text-muted-foreground">{selectedOrder.delivery_address}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Items:</p>
                {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                  <div className="space-y-1">
                    {selectedOrder.items.map((item: any, index: number) => (
                      <div key={index} className="text-sm">
                        {item.name} x{item.quantity} - {formatCurrency(item.price * item.quantity)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No items available</p>
                )}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>{formatCurrency(Number(selectedOrder.total))}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
