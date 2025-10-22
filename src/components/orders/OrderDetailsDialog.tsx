
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/utils/supabaseUtils';

interface Order {
  id: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  subtotal: number;
  delivery_fee: number;
  promo_discount: number;
  total: number;
  order_status: string;
  payment_status: string;
  payment_method: string;
  delivery_address: string;
  items: any;
  created_at: string;
  updated_at: string;
}

interface OrderDetailsDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleteOrder?: (orderId: string) => void;
  onUpdateStatus?: (orderId: string, status: string) => void;
  isCompleting?: boolean;
  isUpdating?: boolean;
}

const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({
  order,
  open,
  onOpenChange,
  onCompleteOrder,
  onUpdateStatus,
  isCompleting = false,
  isUpdating = false,
}) => {
  if (!order) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details - #{order.id.slice(0, 8)}</DialogTitle>
          <DialogDescription>
            Created on {new Date(order.created_at).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Section */}
          <div className="flex gap-4">
            <div>
              <p className="text-sm font-medium mb-1">Order Status</p>
              <Badge className={getStatusColor(order.order_status)}>
                {order.order_status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Payment Status</p>
              <Badge className={getStatusColor(order.payment_status)}>
                {order.payment_status}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Customer Information */}
          <div>
            <h3 className="font-semibold mb-3">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p>{order.guest_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p>{order.guest_email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p>{order.guest_phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment Method</p>
                <p className="capitalize">{order.payment_method}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Delivery Address */}
          <div>
            <h3 className="font-semibold mb-3">Delivery Address</h3>
            <p className="text-sm">{order.delivery_address}</p>
          </div>

          <Separator />

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-3">Order Items</h3>
            <div className="space-y-2">
              {items.length > 0 ? (
                items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                    <div>
                      <p className="font-medium">{item.name || `Item ${index + 1}`}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity || 1} × {formatCurrency(Number(item.price || 0))}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(Number(item.quantity || 1) * Number(item.price || 0))}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No items found</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Order Summary */}
          <div>
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(Number(order.subtotal))}</span>
              </div>
              {order.delivery_fee > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>{formatCurrency(Number(order.delivery_fee))}</span>
                </div>
              )}
              {order.promo_discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(Number(order.promo_discount))}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatCurrency(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {(order.order_status === 'confirmed' && order.payment_status === 'pending') && (
            <div className="flex gap-2 pt-4">
              {onUpdateStatus && (
                <Button
                  variant="outline"
                  onClick={() => onUpdateStatus(order.id, 'processing')}
                  disabled={isUpdating || isCompleting}
                  className="flex-1"
                >
                  {isUpdating ? 'Processing...' : 'Start Processing'}
                </Button>
              )}
              {onCompleteOrder && (
                <Button
                  variant="default"
                  onClick={() => onCompleteOrder(order.id)}
                  disabled={isCompleting || isUpdating}
                  className="flex-1"
                >
                  {isCompleting ? 'Completing...' : 'Complete Order'}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
