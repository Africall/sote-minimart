
import React from 'react';
import { ProductSearch } from './ProductSearch';
import { CartPanel } from './CartPanel';
import { OrderManagementPanel } from './OrderManagementPanel';
import { EcommerceOrdersPanel } from './EcommerceOrdersPanel';
import { Product } from '@/types/product';

interface PosMainContentProps {
  products: Product[];
  quickItems: Product[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  barcodeInput: string;
  setBarcodeInput: (input: string) => void;
  handleBarcodeInput: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  formatCurrency: (amount: number) => string;
  showOrderManagement: boolean;
  onCheckout: () => void;
  onLowStockAlert: (product: Product) => void;
}

export const PosMainContent: React.FC<PosMainContentProps> = ({
  products,
  quickItems,
  searchQuery,
  setSearchQuery,
  barcodeInput,
  setBarcodeInput,
  handleBarcodeInput,
  formatCurrency,
  showOrderManagement,
  onCheckout,
  onLowStockAlert
}) => {
  return (
    <div className="flex h-full">
      {/* Left Side - Product Search */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200">
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
        
        <div className="flex-1 overflow-auto p-6">
          <div className="text-center text-gray-500 py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Process Sales</h3>
              <p className="text-gray-600 mb-4">Use the search above to find products or scan barcodes to add items to the cart</p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tips:</strong> Press Enter after scanning or type product names to search
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Cart */}
      <div className="w-96 border-l border-gray-200 bg-gray-50">
        <CartPanel
          onCheckout={onCheckout}
          onLowStockAlert={onLowStockAlert}
        />
      </div>

      {/* Orders Panel (Collapsible) */}
      {showOrderManagement && (
        <div className="w-80 border-l border-gray-200 bg-white overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Order Management</h3>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <EcommerceOrdersPanel />
              <OrderManagementPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
