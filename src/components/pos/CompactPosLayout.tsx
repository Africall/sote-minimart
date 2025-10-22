
import React from 'react';
import { ProductSearch } from './ProductSearch';
import { CompactCartPanel } from './CompactCartPanel';
import { Product } from '@/types/product';

interface CompactPosLayoutProps {
  products: Product[];
  quickItems: Product[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  barcodeInput: string;
  setBarcodeInput: (input: string) => void;
  handleBarcodeInput: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  formatCurrency: (amount: number) => string;
  onCheckout: () => void;
  onLowStockAlert: (product: Product) => void;
  showOrderManagement: boolean;
  heldTransactions?: any[];
  onHoldTransaction?: () => void;
}

export const CompactPosLayout: React.FC<CompactPosLayoutProps> = ({
  products,
  quickItems,
  searchQuery,
  setSearchQuery,
  barcodeInput,
  setBarcodeInput,
  handleBarcodeInput,
  formatCurrency,
  onCheckout,
  onLowStockAlert,
  showOrderManagement,
  heldTransactions = [],
  onHoldTransaction
}) => {
  return (
    <div className="flex h-full gap-2 p-2">
      {/* Left Side - Product Search */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-3 border-b border-gray-100">
          <ProductSearch
            products={products}
            formatCurrency={formatCurrency}
            quickItems={quickItems}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            barcodeInput={barcodeInput}
            setBarcodeInput={setBarcodeInput}
            handleBarcodeInput={handleBarcodeInput}
          />
        </div>
        
        {/* Ready to Process Sales - Compact Version */}
        <div className="p-4 text-center text-gray-500">
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-medium text-gray-900 mb-1">Ready to Process Sales</h3>
            <p className="text-sm text-gray-600 mb-2">Search products or scan barcodes to begin</p>
            <div className="bg-blue-50 p-2 rounded text-xs text-blue-800">
              <strong>Tip:</strong> Press Enter after scanning
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Compact Cart */}
      <div className="w-80">
        <CompactCartPanel
          onCheckout={onCheckout}
          onLowStockAlert={onLowStockAlert}
          formatCurrency={formatCurrency}
          heldTransactions={heldTransactions}
          onHoldTransaction={onHoldTransaction}
        />
      </div>
    </div>
  );
};
