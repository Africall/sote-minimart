
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/supabaseUtils';
import { Product as FrontendProduct } from '@/types/product';

interface ExpiringItemsTableProps {
  products: FrontendProduct[];
  loading: boolean;
  onMarkExpired?: (productId: string) => void;
}

const getDaysUntilExpiry = (expiryDate: string | undefined) => {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const ExpiringItemsTable: React.FC<ExpiringItemsTableProps> = ({
  products,
  loading,
  onMarkExpired
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        Loading expiring items...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        No items expiring soon
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Product</th>
                <th className="text-left p-4">Expiry Date</th>
                <th className="text-left p-4">Days Left</th>
                <th className="text-left p-4">Stock</th>
                <th className="text-left p-4">Value</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b last:border-0">
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.barcode}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-4">
                    {product.expiryDate && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getDaysUntilExpiry(product.expiryDate) !== null && getDaysUntilExpiry(product.expiryDate)! <= 7
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        <Clock className="w-3 h-3 mr-1" />
                        {getDaysUntilExpiry(product.expiryDate)} days
                      </span>
                    )}
                  </td>
                  <td className="p-4">{product.quantity}</td>
                  <td className="p-4">{formatCurrency(product.sellingPrice * product.quantity)}</td>
                  <td className="p-4 text-right">
                    {onMarkExpired && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onMarkExpired(product.id)}
                      >
                        Mark Expired
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpiringItemsTable;
