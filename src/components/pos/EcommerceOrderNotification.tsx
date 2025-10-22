
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/supabaseUtils';
import { ShoppingCart, Clock, MapPin, User, Phone } from 'lucide-react';

interface EcommerceOrder {
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

interface EcommerceOrderNotificationProps {
  order: EcommerceOrder;
  onUpdateStatus: (orderId: string, status: string) => void;
  onViewDetails: (order: EcommerceOrder) => void;
  onCompleteOrder?: (orderId: string) => void;
}

export const EcommerceOrderNotification: React.FC<EcommerceOrderNotificationProps> = ({
  order,
  onUpdateStatus,
  onViewDetails,
  onCompleteOrder
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const itemCount = Array.isArray(order.items) ? order.items.length : 0;
  const timeAgo = new Date(order.created_at).toLocaleString();

  return (
    <Card className="border-l-4 border-l-blue-500 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">
              E-commerce Order #{order.id.slice(0, 8)}
            </CardTitle>
          </div>
          <div className="flex flex-col gap-1">
            <Badge className={getStatusColor(order.order_status)}>
              {order.order_status}
            </Badge>
            <Badge className={getPaymentStatusColor(order.payment_status)}>
              {order.payment_status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Received: {timeAgo}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{order.guest_name || 'Guest Customer'}</p>
              <p className="text-sm text-muted-foreground">{order.guest_email || 'No email'}</p>
            </div>
          </div>
          {order.guest_phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm">{order.guest_phone}</p>
            </div>
          )}
        </div>

        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm font-medium">Delivery Address:</p>
            <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Items:</span>
            <span className="ml-2 font-medium">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Payment:</span>
            <span className="ml-2 font-medium capitalize">{order.payment_method}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="ml-2 font-medium">{formatCurrency(order.subtotal)}</span>
          </div>
          {order.delivery_fee > 0 && (
            <div>
              <span className="text-muted-foreground">Delivery:</span>
              <span className="ml-2 font-medium">{formatCurrency(order.delivery_fee)}</span>
            </div>
          )}
          {order.promo_discount > 0 && (
            <div>
              <span className="text-muted-foreground">Discount:</span>
              <span className="ml-2 font-medium text-green-600">-{formatCurrency(order.promo_discount)}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Total:</span>
            <span className="ml-2 font-bold text-lg">{formatCurrency(order.total)}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(order)}
            className="flex-1"
          >
            View Details
          </Button>
          
          {order.order_status === 'pending' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onUpdateStatus(order.id, 'processing')}
              className="flex-1"
            >
              Start Processing
            </Button>
          )}
          
          {order.order_status === 'processing' && (
            <div className="flex gap-2 flex-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateStatus(order.id, 'completed')}
                className="flex-1"
              >
                Mark Complete
              </Button>
              {onCompleteOrder && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onCompleteOrder(order.id)}
                  className="flex-1"
                >
                  Complete & Print
                </Button>
              )}
            </div>
          )}

          {order.order_status === 'confirmed' && order.payment_status === 'pending' && (
            <div className="flex gap-2 flex-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateStatus(order.id, 'processing')}
                className="flex-1"
              >
                Start Processing
              </Button>
              {onCompleteOrder && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onCompleteOrder(order.id)}
                  className="flex-1"
                >
                  Complete Order
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
