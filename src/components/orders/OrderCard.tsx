
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/supabaseUtils';
import { Eye, Check, DollarSign } from 'lucide-react';

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

interface OrderCardProps {
  order: Order;
  onViewDetails: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
  onProcessPayment: (orderId: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onViewDetails,
  onUpdateStatus,
  onProcessPayment,
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

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {order.guest_name || 'Guest Order'} • {new Date(order.created_at).toLocaleDateString()}
            </p>
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
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Amount</span>
            <span className="font-semibold">{formatCurrency(Number(order.total))}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Items</span>
            <span className="text-sm">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Payment Method</span>
            <span className="text-sm capitalize">{order.payment_method}</span>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(order)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            
            {order.order_status !== 'completed' && order.order_status !== 'cancelled' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextStatus = order.order_status === 'pending' ? 'processing' : 'completed';
                  onUpdateStatus(order.id, nextStatus);
                }}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-1" />
                {order.order_status === 'pending' ? 'Process' : 'Complete'}
              </Button>
            )}
            
            {order.payment_status === 'pending' && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onProcessPayment(order.id)}
                className="flex-1"
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Confirm Payment
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;
