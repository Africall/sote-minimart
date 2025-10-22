import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { CompactPosHeader } from '@/components/pos/CompactPosHeader';
import { CompactPosLayout } from '@/components/pos/CompactPosLayout';
import { CompactDailyStats } from '@/components/pos/CompactDailyStats';
import { PosDialogManager } from '@/components/pos/PosDialogManager';

import { EcommerceOrdersPanel } from '@/components/pos/EcommerceOrdersPanel';
import { CashManagementPanel } from '@/components/pos/CashManagementPanel';
import { useEcommerceOrders } from '@/hooks/useEcommerceOrders';
import { formatCurrency } from '@/components/pos/utils';
import { Product, getAllProducts } from '../types/product';
import { toast } from 'sonner';
import { useQuickItems, useDailyStats, useHeldTransactions, prefetchQuickItems, prefetchDailyStats } from '@/lib/queries';
import { useQueryClient } from '@tanstack/react-query';
import { usePosState } from '@/hooks/usePosState';
import { useShiftTimer } from '@/hooks/useShiftTimer';
import { usePosHandlers } from '@/hooks/usePosHandlers';
import { useRealtimeProducts } from '@/hooks/useRealtimeProducts';
import { useCashManagement } from '@/hooks/useCashManagement';
import { CashierExpenseForm } from '@/components/accountant/CashierExpenseForm';

// Add type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      on: (event: string, callback: () => void) => void;
    };
  }
}

// Add this check at the top level of the file
if (typeof window !== 'undefined' && window.ethereum) {
  window.ethereum.on('chainChanged', () => {
    window.location.reload();
  });
}

const CashierPosPage = () => {
  const { profile } = useAuth();
  const { items: cartItems } = useCart();
  const queryClient = useQueryClient();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Cash management integration
  const { 
    currentShift, 
    cashBalance, 
    transactions: cashTransactions,
    loading: cashLoading,
    startShift: startCashShift,
    endShift: endCashShift,
    addCashOut,
    processCashSale,
    performReconciliation,
    refreshData: refreshCashData
  } = useCashManagement();

  // Use custom hooks for state and handlers
  const posState = usePosState();
  const { isActive: isShiftStarted, formattedTime: elapsedTime, startShift, endShift } = useShiftTimer();
  const { handleBarcodeInput, restoreTransaction, handleCheckout, syncOfflineTransactions } = usePosHandlers(processCashSale);
  const [activeTab, setActiveTab] = useState<'pos' | 'orders' | 'cash' | 'expenses'>('pos');
  
  // E-commerce orders data
  const { totalPendingCount } = useEcommerceOrders();

  // Real-time product updates
  const handleProductUpdate = (updatedProduct: Product) => {
    setProducts(prevProducts => {
      if (!prevProducts) return prevProducts;
      
      return prevProducts.map(product => 
        product.id === updatedProduct.id ? updatedProduct : product
      );
    });
    
    // Invalidate React Query cache to keep it in sync
    queryClient.invalidateQueries({ queryKey: ['quickItems'] });
  };

  const { isListening } = useRealtimeProducts(products, handleProductUpdate);

  // Prefetch data on mount
  useEffect(() => {
    prefetchQuickItems(queryClient);
    prefetchDailyStats(queryClient, profile?.id);
    getAllProducts().then((fetchedProducts) => {
      if (typeof fetchedProducts === 'string') {
        toast.error('Error fetching products: ' + fetchedProducts);
      } else {
        setProducts(fetchedProducts);
      }
    }).catch((error) => {
      toast.error('Error fetching products: ' + error.message);
    });
  }, [queryClient, profile?.id]);

  // Use React Query hooks with cashier ID
  const { data: quickItems = [] } = useQuickItems();
  const { data: dailyStats } = useDailyStats(profile?.id);
  const { data: heldTransactions = [] } = useHeldTransactions();

  // Terminal and user info
  const terminalInfo = {
    branch: profile?.branch || 'Main Branch',
    terminalId: profile?.terminal_id || 'POS-001',
    currentDate: new Date().toLocaleDateString(),
    currentTime: new Date().toLocaleTimeString()
  };

  const user = {
    name: profile?.name || 'Cashier'
  };

  const networkStatus = true;

  // Handlers with state integration
  const handleBarcodeInputWithState = (e: React.KeyboardEvent<HTMLInputElement>) => {
    handleBarcodeInput(e, posState.barcodeInput, posState.setBarcodeInput);
  };

  const handleCheckoutWithState = async (paymentMethod: string, paymentDetails?: any) => {
    if (isProcessingCheckout) return; // Prevent multiple clicks
    
    setIsProcessingCheckout(true);
    try {
      await handleCheckout(total, paymentMethod, paymentDetails);
      posState.setOpenCheckout(false);
      // Invalidate daily stats to refresh totals
      queryClient.invalidateQueries({ queryKey: ['dailyStats', profile?.id] });
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const syncOfflineTransactionsWithState = () => {
    syncOfflineTransactions(posState.pendingOfflineTransactions, (txns: any[]) => {
      posState.setPendingOfflineTransactions(txns);
    });
  };

  const toggleShift = () => {
    if (isShiftStarted) {
      endShift();
      toast.success('Shift ended');
    } else {
      startShift();
      toast.success('Shift started - Timer is now running');
    }
  };

  // Checkout calculations - without VAT
  const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.sellingPrice) * item.quantity), 0);
  const discount = 0;
  const tax = 0; // Remove VAT calculation
  const total = subtotal - discount; // Total without VAT

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Compact Header */}
      <CompactPosHeader
        user={user}
        networkStatus={networkStatus}
        isShiftStarted={isShiftStarted}
        toggleShift={toggleShift}
        elapsedTime={elapsedTime}
        terminalInfo={terminalInfo}
        showOrderManagement={posState.showOrderManagement}
        setShowOrderManagement={posState.setShowOrderManagement}
        isListening={isListening}
        pendingOrderCount={totalPendingCount}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1">
          <CompactPosLayout
            products={products || []}
            quickItems={quickItems}
            searchQuery={posState.searchQuery}
            setSearchQuery={posState.setSearchQuery}
            barcodeInput={posState.barcodeInput}
            setBarcodeInput={posState.setBarcodeInput}
            handleBarcodeInput={handleBarcodeInputWithState}
            formatCurrency={formatCurrency}
            onCheckout={() => posState.setOpenCheckout(true)}
            onLowStockAlert={(product) => {
              posState.setLowStockProduct(product);
              posState.setOpenLowStockAlert(true);
            }}
            showOrderManagement={posState.showOrderManagement}
            heldTransactions={heldTransactions}
            onHoldTransaction={() => {
              // Refresh held transactions when a new one is added
              if (queryClient) {
                queryClient.invalidateQueries({ queryKey: ['heldTransactions'] });
              }
            }}
          />
        </div>

        {/* Side Panel (Resizable) */}
        {posState.showOrderManagement && (
          <div className="min-w-80 max-w-96 w-80 border-l border-gray-200 bg-white overflow-hidden resize-x">
            <div className="h-full flex flex-col">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`flex-1 px-3 py-2 text-sm font-medium border-b-2 relative ${
                      activeTab === 'orders' 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Orders
                    {totalPendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {totalPendingCount}
                      </span>
                    )}
                  </button>
                   <button
                     onClick={() => setActiveTab('cash')}
                     className={`flex-1 px-3 py-2 text-sm font-medium border-b-2 ${
                       activeTab === 'cash' 
                         ? 'border-primary text-primary' 
                         : 'border-transparent text-gray-500 hover:text-gray-700'
                     }`}
                   >
                     Cash
                   </button>
                   <button
                     onClick={() => setActiveTab('expenses')}
                     className={`flex-1 px-3 py-2 text-sm font-medium border-b-2 ${
                       activeTab === 'expenses' 
                         ? 'border-primary text-primary' 
                         : 'border-transparent text-gray-500 hover:text-gray-700'
                     }`}
                   >
                     Expenses
                   </button>
                </div>
              </div>
              
              {/* Tab Content */}
              <div className="flex-1 overflow-auto p-3">
                {activeTab === 'orders' && (
                  <EcommerceOrdersPanel />
                )}
                 {activeTab === 'cash' && (
                   <CashManagementPanel />
                 )}
                 {activeTab === 'expenses' && (
                   <CashierExpenseForm />
                 )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compact Footer */}
      <CompactDailyStats
        dailyStats={dailyStats || {
          totalSales: 0,
          totalTransactions: 0,
          averageTransaction: 0,
          itemsSold: 0,
          floatRemaining: 1000,
          shiftStart: '',
          shiftEnd: ''
        }}
        formatCurrency={formatCurrency}
        setShowShortcuts={posState.setOpenShortcuts}
      />

      {/* Dialogs */}
      <PosDialogManager
        openCheckout={posState.openCheckout}
        setOpenCheckout={posState.setOpenCheckout}
        openHeldTransactions={posState.openHeldTransactions}
        setOpenHeldTransactions={posState.setOpenHeldTransactions}
        openLowStockAlert={posState.openLowStockAlert}
        setOpenLowStockAlert={posState.setOpenLowStockAlert}
        openCustomizeReceipt={posState.openCustomizeReceipt}
        setOpenCustomizeReceipt={posState.setOpenCustomizeReceipt}
        openPriceCheck={posState.openPriceCheck}
        setOpenPriceCheck={posState.setOpenPriceCheck}
        openShortcuts={posState.openShortcuts}
        setOpenShortcuts={posState.setOpenShortcuts}
        lowStockProduct={posState.lowStockProduct}
        subtotal={subtotal}
        discount={discount}
        tax={tax}
        total={total}
        handleCheckout={handleCheckoutWithState}
        formatCurrency={formatCurrency}
        heldTransactions={heldTransactions}
        restoreTransaction={restoreTransaction}
        receiptCustomization={posState.receiptCustomization}
        setReceiptCustomization={posState.setReceiptCustomization}
        terminalInfo={terminalInfo}
        user={user}
        isProcessingCheckout={isProcessingCheckout}
      />
    </div>
  );
};

export default CashierPosPage;
