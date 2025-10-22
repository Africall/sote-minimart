
import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Receipt, User, Zap, FileSpreadsheet, Trash2, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface CartActionButtonsProps {
  showCustomerPanel: boolean;
  cartItemsCount: number;
  setShowCustomerPanel: React.Dispatch<React.SetStateAction<boolean>>;
  holdTransaction: () => void;
  setCheckoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCustomizeReceiptOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CartActionButtons: React.FC<CartActionButtonsProps> = ({
  showCustomerPanel,
  cartItemsCount,
  setShowCustomerPanel,
  holdTransaction,
  setCheckoutOpen,
  setCustomizeReceiptOpen,
}) => {
  const handleSubmitToGoogleSheets = async () => {
    try {
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbxIkUlDLOUrCSoBFOF5CLcE_stq4cGCIV0Wh3bhIRUer0CddoM48Ln7mPFtec9zNX75AQ/exec?action=submitSale',
        {
          method: 'POST',
        }
      );
      
      if (response.ok) {
        toast.success('✅ Sale submitted successfully and receipt generated.');
      } else {
        toast.error('Failed to submit to Google Sheets');
      }
    } catch (error) {
      toast.error('Error submitting to Google Sheets');
      console.error('Google Sheets submission error:', error);
    }
  };

  const handleVoidSale = () => {
    toast.info('Void sale functionality to be implemented');
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 font-sans">
      {/* Action Buttons - Responsive Grid */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        {!showCustomerPanel && (
          <Button 
            variant="outline"
            onClick={() => setShowCustomerPanel(true)}
            className="h-16 text-xs font-medium border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 hover:shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-lg"
          >
            <div className="flex flex-col items-center gap-1">
              <User size={16} />
              <span>👤 Customer</span>
            </div>
          </Button>
        )}
        
        <Button 
          variant="outline"
          onClick={holdTransaction}
          disabled={cartItemsCount === 0}
          className="h-16 text-xs font-medium border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 hover:shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-lg disabled:opacity-50 disabled:hover:scale-100"
        >
          <div className="flex flex-col items-center gap-1">
            <Zap size={16} />
            <span>🔄 Hold</span>
          </div>
        </Button>
        
        <Button 
          variant="outline"
          className="h-16 text-xs font-medium border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 hover:shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-lg"
          onClick={() => setCustomizeReceiptOpen(true)}
        >
          <div className="flex flex-col items-center gap-1">
            <Receipt size={16} />
            <span>🧾 Receipt</span>
          </div>
        </Button>
        
        <Button 
          variant="outline"
          onClick={handleVoidSale}
          disabled={cartItemsCount === 0}
          className="h-16 text-xs font-medium border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 hover:text-red-700 hover:shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-lg disabled:opacity-50 disabled:hover:scale-100"
        >
          <div className="flex flex-col items-center gap-1">
            <Trash2 size={16} />
            <span>🗑 Void</span>
          </div>
        </Button>
        
        <Button 
          variant="outline" 
          disabled={cartItemsCount === 0}
          className="h-16 text-xs font-medium border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 hover:shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-lg disabled:opacity-50 disabled:hover:scale-100"
        >
          <div className="flex flex-col items-center gap-1">
            <Mail size={16} />
            <span>📩 Email</span>
          </div>
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleSubmitToGoogleSheets}
          disabled={cartItemsCount === 0}
          className="h-16 text-xs font-medium border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 hover:shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-lg disabled:opacity-50 disabled:hover:scale-100"
        >
          <div className="flex flex-col items-center gap-1">
            <FileSpreadsheet size={16} />
            <span>💾 Submit</span>
          </div>
        </Button>
      </div>
      
      {/* Large Checkout Button */}
      <Button 
        onClick={() => setCheckoutOpen(true)}
        disabled={cartItemsCount === 0}
        className="w-full h-14 text-base font-bold bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] rounded-lg disabled:opacity-50 disabled:hover:scale-100 font-sans tracking-wide mb-safe"
      >
        <CreditCard className="mr-3 h-5 w-5" />
        ✅ Checkout ({cartItemsCount} item{cartItemsCount !== 1 ? 's' : ''})
      </Button>
    </div>
  );
};
