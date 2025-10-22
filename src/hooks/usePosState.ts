
import { useState } from 'react';
import { Product } from '@/types/product';

export const usePosState = () => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Dialog states
  const [openPriceCheck, setOpenPriceCheck] = useState(false);
  const [openHeldTransactions, setOpenHeldTransactions] = useState(false);
  const [openCustomizeReceipt, setOpenCustomizeReceipt] = useState(false);
  const [openLowStockAlert, setOpenLowStockAlert] = useState(false);
  const [openShortcuts, setOpenShortcuts] = useState(false);
  const [openCheckout, setOpenCheckout] = useState(false);
  const [lowStockProduct, setLowStockProduct] = useState<Product | null>(null);
  const [showOrderManagement, setShowOrderManagement] = useState(false);

  // System state
  const [offlineMode, setOfflineMode] = useState(false);
  const [isShiftStarted, setIsShiftStarted] = useState(false);
  const [pendingOfflineTransactions, setPendingOfflineTransactions] = useState<any[]>([]);

  // Receipt customization
  const [receiptCustomization, setReceiptCustomization] = useState({
    thankYouMessage: 'Thank You For Shopping With Us!',
    showCashierName: true,
    showDateTime: true,
    additionalFooter: 'Return Policy: 7 days with receipt'
  });

  return {
    // Search state
    searchQuery,
    setSearchQuery,
    barcodeInput,
    setBarcodeInput,
    
    // Dialog states
    openPriceCheck,
    setOpenPriceCheck,
    openHeldTransactions,
    setOpenHeldTransactions,
    openCustomizeReceipt,
    setOpenCustomizeReceipt,
    openLowStockAlert,
    setOpenLowStockAlert,
    openShortcuts,
    setOpenShortcuts,
    openCheckout,
    setOpenCheckout,
    lowStockProduct,
    setLowStockProduct,
    showOrderManagement,
    setShowOrderManagement,
    
    // System state
    offlineMode,
    setOfflineMode,
    isShiftStarted,
    setIsShiftStarted,
    pendingOfflineTransactions,
    setPendingOfflineTransactions,
    
    // Receipt customization
    receiptCustomization,
    setReceiptCustomization,
  };
};
