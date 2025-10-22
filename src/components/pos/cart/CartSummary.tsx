
import React from 'react';
import { Separator } from '@/components/ui/separator';

interface CartSummaryProps {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  itemCount: number;
  formatCurrency: (amount: number) => string;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  discount,
  itemCount,
  formatCurrency,
}) => {
  const finalTotal = subtotal - discount;

  return (
    <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 p-4 shadow-lg">
      {/* Summary Section with Naivas-style layout */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4 font-sans">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Items:</span>
            <span className="font-semibold text-gray-900">{itemCount}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Subtotal:</span>
            <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Discount:</span>
            <span className="text-gray-400">
              {discount > 0 ? `-${formatCurrency(discount)}` : '—'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Tax:</span>
            <span className="text-gray-400">—</span>
          </div>
        </div>
        
        <Separator className="my-3 bg-gray-300" />
        
        {/* Naivas-style Total with green background */}
        <div className="bg-green-100 border-2 border-green-300 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900 tracking-wide">TOTAL:</span>
            <span className="text-xl font-bold text-green-700 tracking-wider">
              {formatCurrency(finalTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
