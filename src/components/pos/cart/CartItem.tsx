
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { ProductCategory } from '@/types/product';

interface CartItemProps {
  item?: any;
  id: string;
  name: string;
  category?: ProductCategory;
  quantity: number;
  sellingPrice: number;
  discount?: number;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  formatCurrency: (amount: number) => string;
  categoryColors: Record<ProductCategory, string>;
}

export const CartItem: React.FC<CartItemProps> = ({
  id,
  name,
  quantity,
  sellingPrice,
  discount = 0,
  updateQuantity,
  removeItem,
  formatCurrency,
}) => {
  console.log('CartItem - Rendering item:', { id, name, quantity, sellingPrice });

  const safeQuantity = Math.max(1, Number(quantity) || 1);
  const safeSellingPrice = Number(sellingPrice) || 0;
  const safeDiscount = Number(discount) || 0;
  const safeName = String(name || 'Unnamed Product');

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      console.log('CartItem - Updating quantity:', id, newQuantity);
      updateQuantity(id, newQuantity);
    }
  };

  const handleRemove = () => {
    console.log('CartItem - Removing item:', id);
    removeItem(id);
  };

  const itemTotal = (safeSellingPrice * safeQuantity) - safeDiscount;

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
      {/* QTY Column */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 hover:scale-105"
            onClick={() => handleQuantityChange(safeQuantity - 1)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-sm font-semibold min-w-[1.5rem] text-center text-gray-900">
            {safeQuantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 hover:scale-105"
            onClick={() => handleQuantityChange(safeQuantity + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </td>

      {/* ITEM NAME Column */}
      <td className="py-3 px-4">
        <div className="text-sm font-medium text-gray-900 leading-tight">
          {safeName}
        </div>
      </td>

      {/* UNIT PRICE Column */}
      <td className="py-3 px-4 text-sm text-gray-600 text-right">
        {formatCurrency(safeSellingPrice)}
      </td>

      {/* SUBTOTAL Column */}
      <td className="py-3 px-4 text-sm font-semibold text-gray-900 text-right">
        {formatCurrency(itemTotal)}
      </td>

      {/* ACTION Column */}
      <td className="py-3 px-4 text-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200 hover:scale-110"
          onClick={handleRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
};
