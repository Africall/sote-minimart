import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, Product } from '@/utils/supabaseUtils';

interface LowStockTableProps {
  items: Product[];
  loading: boolean;
  onRestock?: (product: Product) => void;
}

export const LowStockTable: React.FC<LowStockTableProps> = ({
  items,
  loading,
  onRestock
}) => {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted">
              <tr>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Current Stock</th>
                <th className="px-6 py-3">Reorder Level</th>
                <th className="px-6 py-3">Value</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.sku}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-red-500">
                      {item.stock_quantity}
                    </td>
                    <td className="px-6 py-4">{item.reorder_level}</td>
                    <td className="px-6 py-4">
                      {formatCurrency(item.cost * item.stock_quantity)}
                    </td>
                    <td className="px-6 py-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onRestock?.(item)}
                      >
                        Restock
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    No low stock items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}; 