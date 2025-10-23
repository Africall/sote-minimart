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

  // POS state & handlers
  const posState = usePosState();
  const { isActive: isShiftStarted, formattedTime: elapsedTime, startShift, endShift } = useShiftTimer();
  const { handleBarcodeInput, restoreTransaction, handleCheckout, syncOfflineTransactions } = usePosHandlers(processCashSale);
  const [activeTab, setActiveTab] = useState<'pos' | 'orders' | 'cash' | 'expenses'>('pos');

  // E-commerce orders
  const { totalPendingCount } = useEcommerceOrders();

  // Realtime products
  const handleProductUpdate = (updatedProduct: Product) => {
    setProducts(prev =>
      prev ? prev.map(p => (p.id === updatedProduct.id ? updatedProduct : p)) : prev
    );
    queryClient.invalidateQueries({ queryKey: ['quickItems'] });
  };
  const { isListening } = useRealtimeProducts(products, handleProductUpdate);

  // Prefetch
  useEffect(() => {
    prefetchQuickItems(queryClient);
    prefetchDailyStats(queryClient, profile?.id);
    getAllProducts()
      .then((fetched) => {
        if (typeof fetched === 'string') {
          toast.error('Error fetching products: ' + fetched);
        } else {
          setProducts(fetched);
        }
      })
      .catch((error) => toast.error('Error fetching products: ' + error.message));
  }, [queryClient, profile?.id]);

  // React Query hooks
  const { data: quickItems = [] } = useQuickItems();
  const { data: dailyStats } = useDailyStats(profile?.id);
  const { data: heldTransactions = [] } = useHeldTransactions();

  // Terminal/user info
  const terminalInfo = {
    branch: profile?.branch || 'Main Branch',
    terminalId: profile?.terminal_id || 'POS-001',
    currentDate: new Date().toLocaleDateString(),
    currentTime: new Date().toLocaleTimeString()
  };
  const user = { name: profile?.name || 'Cashier' };
  const networkStatus = true;

  // Handlers with state integration
  const handleBarcodeInputWithState = (e: React.KeyboardEvent<HTMLInputElement>) => {
    handleBarcodeInput(e, posState.barcodeInput, posState.setBarcodeInput);
  };

  const handleCheckoutWithState = async (paymentMethod: string, paymentDetails?: any) => {
    if (isProcessingCheckout) return;
    setIsProcessingCheckout(true);
    try {
      await handleCheckout(total, paymentMethod, paymentDetails);
      posState.setOpenCheckout(false);
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

  // Totals (no VAT)
  const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.sellingPrice) * item.quantity), 0);
  const discount = 0;
  const tax = 0;
  const total = subtotal - discount;

  return (
    // <<< changed: from bg-gray-50 to the branded background + surfaced blocks
    <div className="flex flex-col h-screen overflow-hidden page-bg">
      {/* Header remains its own component; it will sit above the surfaced content nicely */}
      <div className="page-surface mx-2 md:mx-3 mt-2 md:mt-3 rounded-xl">
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
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex gap-2 md:gap-3 p-2 md:p-3">
        {/* Left: Sales area on an elevated surface */}
        <div className="flex-1 overflow-hidden page-surface rounded-xl">
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
              queryClient.invalidateQueries({ queryKey: ['heldTransactions'] });
            }}
          />
        </div>

        {/* Right: Side Panel (when visible) */}
        {posState.showOrderManagement && (
          <div className="min-w-80 max-w-96 w-80 overflow-hidden resize-x page-surface rounded-xl">
            <div className="h-full flex flex-col">
              {/* Tab Navigation with gradient strip */}
              <div className="border-b">
                <div className="h-1 w-full bg-gradient-to-r from-royal-blue-600 via-primary to-vibrant-red-500" />
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors rounded-t-md
                      ${activeTab === 'orders'
                        ? 'bg-white text-foreground shadow-inner'
                        : 'text-muted-foreground hover:bg-muted/60'
                      }`}
                  >
                    Orders
                    {totalPendingCount > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center rounded-full bg-vibrant-red-600 text-white text-xs h-5 px-2">
                        {totalPendingCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('cash')}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors rounded-t-md
                      ${activeTab === 'cash'
                        ? 'bg-white text-foreground shadow-inner'
                        : 'text-muted-foreground hover:bg-muted/60'
                      }`}
                  >
                    Cash
                  </button>
                  <button
                    onClick={() => setActiveTab('expenses')}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors rounded-t-md
                      ${activeTab === 'expenses'
                        ? 'bg-white text-foreground shadow-inner'
                        : 'text-muted-foreground hover:bg-muted/60'
                      }`}
                  >
                    Expenses
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-auto p-3">
                {activeTab === 'orders' && <EcommerceOrdersPanel />}
                {activeTab === 'cash' && <CashManagementPanel />}
                {activeTab === 'expenses' && <CashierExpenseForm />}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer on surface */}
      <div className="page-surface mx-2 md:mx-3 mb-2 md:mb-3 rounded-xl">
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
      </div>

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
