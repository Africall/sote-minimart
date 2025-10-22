import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StockAuditEntry {
  id: string;
  product_id: string;
  old_quantity: number;
  new_quantity: number;
  change_amount: number;
  change_type: string;
  performed_by: string;
  performed_at: string;
  notes?: string;
}

export const useStockAudit = () => {
  const [auditLoading, setAuditLoading] = useState(false);

  const logStockChange = async (
    productId: string,
    oldQuantity: number,
    newQuantity: number,
    changeType: 'restock' | 'sale' | 'expired' | 'adjustment' | 'order_complete',
    notes?: string
  ) => {
    try {
      const changeAmount = newQuantity - oldQuantity;
      
      const { error } = await supabase
        .from('stock_audit')
        .insert({
          product_id: productId,
          old_quantity: oldQuantity,
          new_quantity: newQuantity,
          change_amount: changeAmount,
          change_type: changeType,
          performed_by: (await supabase.auth.getUser()).data.user?.id || null,
          notes
        });

      if (error) {
        console.error('Failed to log stock change:', error);
        // Don't throw error for audit logging failures
      } else {
        console.log('Stock change logged successfully:', {
          productId,
          changeType,
          changeAmount,
          notes
        });
      }
    } catch (error) {
      console.error('Error logging stock change:', error);
      // Audit logging failures should not prevent the main operation
    }
  };

  const getStockAudit = async (productId?: string, limit = 100) => {
    try {
      setAuditLoading(true);
      
      let query = supabase
        .from('stock_audit')
        .select('*')
        .order('performed_at', { ascending: false })
        .limit(limit);

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;

      if (error) {
        toast.error('Failed to fetch stock audit');
        return [];
      }

      return data as StockAuditEntry[];
    } catch (error) {
      console.error('Error fetching stock audit:', error);
      toast.error('Failed to fetch stock audit');
      return [];
    } finally {
      setAuditLoading(false);
    }
  };

  return {
    logStockChange,
    getStockAudit,
    auditLoading
  };
};