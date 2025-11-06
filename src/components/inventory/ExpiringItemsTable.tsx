import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/utils/supabaseUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';

interface Product {
  id: string;
  name: string;
  barcode: string | null;
  quantity: number;
  sellingPrice: number;
  expiry_queue: string[] | null; // ← NEW: array of dates
}

interface ExpiringItemsTableProps {
  products: Product[];
  loading: boolean;
  onRefresh?: () => void;
}

const getNextExpiry = (queue: string[] | null): string | null => {
  if (!queue || queue.length === 0) return null;
  return queue[0]; // First = next to expire
};

const getDaysUntilExpiry = (dateStr: string | null): number | null => {
  if (!dateStr) return null;
  const expiry = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = differenceInDays(expiry, today);
  return diff >= 0 ? diff : 0;
};

const ExpiringItemsTable: React.FC<ExpiringItemsTableProps> = ({
  products,
  loading,
  onRefresh
}) => {
  const handleSorted = async (productId: string) => {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('expiry_queue')
        .eq('id', productId)
        .single();

        if (error || !product) {
          toast({ title: "Error", description: "Product not found", variant: "destructive" });
          return;
        }

      const newQueue = product?.expiry_queue?.slice(1) || [];

      await supabase
        .from('products')
        .update({ expiry_queue: newQueue })
        .eq('id', productId);

      toast({
        title: "Sorted!",
        description: "Expiry removed. Next batch ready.",
      });

      onRefresh?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark as sorted",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        Loading expiring items...
      </div>
    );
  }

  const expiringProducts = products
    .filter(p => getNextExpiry(p.expiry_queue))
    .sort((a, b) => {
      const dateA = getNextExpiry(a.expiry_queue);
      const dateB = getNextExpiry(b.expiry_queue);
      return new Date(dateA!).getTime() - new Date(dateB!).getTime();
    });

  if (expiringProducts.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        No items expiring soon. You're all clear!
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-semibold">Product</th>
                <th className="text-left p-4 font-semibold">Next Expiry</th>
                <th className="text-left p-4 font-semibold">Days Left</th>
                <th className="text-left p-4 font-semibold">Stock</th>
                <th className="text-left p-4 font-semibold">Value</th>
                <th className="text-right p-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {expiringProducts.map((product) => {
                const nextExpiry = getNextExpiry(product.expiry_queue);
                const daysLeft = getDaysUntilExpiry(nextExpiry);
                const isUrgent = daysLeft !== null && daysLeft <= 7;
                const isWarning = daysLeft !== null && daysLeft <= 30;

                return (
                  <tr key={product.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.barcode && (
                          <p className="text-sm text-muted-foreground">{product.barcode}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {nextExpiry ? format(new Date(nextExpiry), 'dd MMM yyyy') : 'N/A'}
                    </td>
                    <td className="p-4">
                      {daysLeft !== null ? (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          isUrgent
                            ? 'bg-red-100 text-red-700 border border-red-300'
                            : isWarning
                            ? 'bg-amber-100 text-amber-700 border border-amber-300'
                            : 'bg-green-100 text-green-700 border border-green-300'
                        }`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td className="p-4 font-medium">{product.quantity}</td>
                    <td className="p-4 font-medium">
                      {formatCurrency(product.sellingPrice * product.quantity)}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        onClick={() => handleSorted(product.id)}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        SORTED
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpiringItemsTable;