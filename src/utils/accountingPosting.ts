import { supabase } from '@/integrations/supabase/client';

/**
 * Post a completed sale to the accounting journals
 * Creates double-entry bookkeeping records
 */
export const postSaleToAccounting = async (saleId: string) => {
  try {
    const { data, error } = await supabase.rpc('post_sale_journal', {
      p_sale_id: saleId,
    });

    if (error) throw error;
    
    console.log('Sale posted to accounting:', { saleId, journalId: data });
    return { success: true, journalId: data };
  } catch (error: any) {
    console.error('Error posting sale to accounting:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Post an expense to the accounting journals
 * Creates double-entry bookkeeping records
 */
export const postExpenseToAccounting = async (expenseId: string) => {
  try {
    const { data, error } = await supabase.rpc('post_expense_journal', {
      p_expense_id: expenseId,
    });

    if (error) throw error;
    
    console.log('Expense posted to accounting:', { expenseId, journalId: data });
    return { success: true, journalId: data };
  } catch (error: any) {
    console.error('Error posting expense to accounting:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Close a shift and post over/short to accounting journals
 * Creates double-entry bookkeeping records for cash variance
 */
export const closeShiftToAccounting = async (
  shiftId: string,
  countedCash: number
) => {
  try {
    const { data, error } = await supabase.rpc('close_shift_journal', {
      p_shift_id: shiftId,
      p_counted_cash: countedCash,
    });

    if (error) throw error;
    
    console.log('Shift closed to accounting:', { shiftId, journalId: data });
    return { success: true, journalId: data };
  } catch (error: any) {
    console.error('Error closing shift to accounting:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Auto-post sales to accounting (can be called after each completed sale)
 */
export const autoPostSale = async (saleId: string) => {
  // Add a small delay to ensure sale is fully committed
  setTimeout(async () => {
    const result = await postSaleToAccounting(saleId);
    if (!result.success) {
      console.warn('Auto-posting sale failed:', result.error);
    }
  }, 1000);
};

/**
 * Auto-post expenses to accounting (can be called after creating expense)
 */
export const autoPostExpense = async (expenseId: string) => {
  setTimeout(async () => {
    const result = await postExpenseToAccounting(expenseId);
    if (!result.success) {
      console.warn('Auto-posting expense failed:', result.error);
    }
  }, 1000);
};