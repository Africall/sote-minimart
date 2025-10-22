import React from 'react';
import { CheckoutDialog } from './CheckoutDialog';
import { HeldTransactionSheet } from './HeldTransactionSheet';
import { LowStockAlertDialog } from './LowStockAlertDialog';
import { CustomizeReceiptDialog } from './CustomizeReceiptDialog';
import { PriceCheckDialog } from './PriceCheckDialog';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { Database } from '@/types/database';
import { Product } from '@/types/product';
import { Sheet } from '@/components/ui/sheet';
import { Dialog } from '@/components/ui/dialog';

type HeldTransactionRow = Database['public']['Tables']['held_transactions']['Row'];

interface PosDialogManagerProps {
  // Dialog states
  openCheckout: boolean;
  setOpenCheckout: (open: boolean) => void;
  openHeldTransactions: boolean;
  setOpenHeldTransactions: (open: boolean) => void;
  openLowStockAlert: boolean;
  setOpenLowStockAlert: (open: boolean) => void;
  openCustomizeReceipt: boolean;
  setOpenCustomizeReceipt: (open: boolean) => void;
  openPriceCheck: boolean;
  setOpenPriceCheck: (open: boolean) => void;
  openShortcuts: boolean;
  setOpenShortcuts: (open: boolean) => void;
  
  // Data
  lowStockProduct: Product | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  heldTransactions: HeldTransactionRow[];
  receiptCustomization: any;
  setReceiptCustomization: (customization: any) => void;
  terminalInfo: any;
  user: any;
  isProcessingCheckout?: boolean;
  
  // Handlers
  handleCheckout: (paymentMethod: string, paymentDetails?: any) => void;
  restoreTransaction: (transaction: HeldTransactionRow) => void;
  formatCurrency: (amount: number) => string;
}

export const PosDialogManager: React.FC<PosDialogManagerProps> = ({
  openCheckout,
  setOpenCheckout,
  openHeldTransactions,
  setOpenHeldTransactions,
  openLowStockAlert,
  setOpenLowStockAlert,
  openCustomizeReceipt,
  setOpenCustomizeReceipt,
  openPriceCheck,
  setOpenPriceCheck,
  openShortcuts,
  setOpenShortcuts,
  lowStockProduct,
  subtotal,
  discount,
  tax,
  total,
  heldTransactions,
  receiptCustomization,
  setReceiptCustomization,
  terminalInfo,
  user,
  isProcessingCheckout = false,
  handleCheckout,
  restoreTransaction,
  formatCurrency
}) => {
  return (
    <>
      {/* Checkout Dialog */}
      {openCheckout && (
        <CheckoutDialog
          subtotal={subtotal}
          discount={discount}
          tax={tax}
          total={total}
          handleCheckout={handleCheckout}
          setCheckoutOpen={setOpenCheckout}
          formatCurrency={formatCurrency}
          isProcessing={isProcessingCheckout}
        />
      )}

      {/* Held Transactions Sheet */}
      <Sheet open={openHeldTransactions} onOpenChange={setOpenHeldTransactions}>
        <HeldTransactionSheet
          heldTransactions={heldTransactions}
          restoreTransaction={restoreTransaction}
          formatCurrency={formatCurrency}
        />
      </Sheet>

      {/* Low Stock Alert Dialog */}
      <Dialog open={openLowStockAlert} onOpenChange={setOpenLowStockAlert}>
        <LowStockAlertDialog
          lowStockProduct={lowStockProduct}
          setShowLowStockAlert={setOpenLowStockAlert}
        />
      </Dialog>

      {/* Customize Receipt Dialog */}
      {openCustomizeReceipt && (
        <CustomizeReceiptDialog
          receiptCustomization={receiptCustomization}
          setReceiptCustomization={setReceiptCustomization}
          setCustomizeReceiptOpen={setOpenCustomizeReceipt}
          terminalInfo={terminalInfo}
          user={user}
        />
      )}

      {/* Price Check Dialog */}
      {openPriceCheck && (
        <PriceCheckDialog
          setPriceCheckOpen={setOpenPriceCheck}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        showShortcuts={openShortcuts}
        setShowShortcuts={setOpenShortcuts}
      />
    </>
  );
};
