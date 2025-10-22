import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, AlertTriangle, Package } from 'lucide-react';
import { getAllProducts } from '@/types/product';
import { UnitOfMeasure } from '@/types/product';

const ExpiryTracker = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const result = await getAllProducts();
        if (typeof result === 'string') {
          setError(result);
          setProducts([]);
        } else {
          setProducts(result);
          setError(null);
        }
      } catch (err) {
        setError('Failed to fetch products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const getDaysUntilExpiry = (expiryDate: string | undefined): number | null => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diff = expiry.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const expiringSoon = products.filter(product => {
    const days = getDaysUntilExpiry(product.expiryDate);
    return days !== null && days <= 30 && days >= 0;
  });

  const expiredProducts = products.filter(product => {
    const days = getDaysUntilExpiry(product.expiryDate);
    return days !== null && days < 0;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Expiry Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <p>Loading products...</p>}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!loading && !error && (
          <>
            {expiringSoon.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Expiring Soon</h3>
                <ul>
                  {expiringSoon.map(product => (
                    <li key={product.id} className="flex justify-between items-center py-2 border-b">
                      <span>{product.name}</span>
                      <Badge variant="secondary">
                        {getDaysUntilExpiry(product.expiryDate)} days
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {expiredProducts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Expired Products</h3>
                <ul>
                  {expiredProducts.map(product => (
                    <li key={product.id} className="flex justify-between items-center py-2 border-b">
                      <span>{product.name}</span>
                      <Badge variant="destructive">
                        Expired {Math.abs(getDaysUntilExpiry(product.expiryDate) || 0)} days ago
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {expiringSoon.length === 0 && expiredProducts.length === 0 && (
              <p>No products expiring soon or expired.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpiryTracker;
