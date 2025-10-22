import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface CashTransaction {
  id?: string;
  type: 'float' | 'cash_in' | 'cash_out' | 'sale' | 'change';
  amount: number;
  description: string;
  shift_id?: string;
  cashier_id?: string;
  created_at?: string;
}

export interface ShiftData {
  id?: string;
  cashier_id?: string;
  start_time: string;
  end_time?: string;
  float_amount: number;
  status: 'active' | 'ended';
}

export interface CashBalance {
  float: number;
  cashIn: number;
  cashOut: number;
  realTimeBalance: number;
  totalSales: number;
  changeGiven: number;
}

export const useCashManagement = () => {
  const { user } = useAuth();
  const [currentShift, setCurrentShift] = useState<ShiftData | null>(null);
  const [cashBalance, setCashBalance] = useState<CashBalance>({
    float: 0,
    cashIn: 0,
    cashOut: 0,
    realTimeBalance: 0,
    totalSales: 0,
    changeGiven: 0
  });
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize cash management data and refresh data periodically
  useEffect(() => {
    if (user) {
      fetchCurrentShift();
      
      // Refresh every 5 seconds to catch shift changes
      const interval = setInterval(() => {
        fetchCurrentShift();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  // Fetch transactions when shift changes
  useEffect(() => {
    if (currentShift) {
      fetchTodaysTransactions();
    }
  }, [currentShift]);

  // Real-time updates for cash transactions
  useEffect(() => {
    if (!currentShift) return;

    const channel = supabase
      .channel('cash-transactions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cash_transactions',
        filter: `shift_id=eq.${currentShift.id}`
      }, () => {
        fetchTodaysTransactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentShift]);

  // Fetch active shift for current cashier
  const fetchCurrentShift = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data: shiftData, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('cashier_id', user.id)
        .is('end_time', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (shiftData && shiftData.length > 0) {
        const shift = shiftData[0];
        console.log('Found active shift:', shift);
        setCurrentShift({
          id: shift.id,
          cashier_id: shift.cashier_id,
          start_time: shift.start_time,
          end_time: shift.end_time,
          float_amount: shift.float_amount,
          status: shift.end_time ? 'ended' : 'active'
        });
        
        // Update float in cash balance
        setCashBalance(prev => ({
          ...prev,
          float: shift.float_amount
        }));
      } else {
        console.log('No active shift found for user:', user.id);
        setCurrentShift(null);
      }
    } catch (error) {
      console.error('Error fetching current shift:', error);
      setCurrentShift(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch today's transactions for cash balance calculation
  const fetchTodaysTransactions = async () => {
    if (!currentShift) return;
    
    try {
      // Fetch cash transactions for current shift
      const { data: cashTransactions, error: transError } = await supabase
        .from('cash_transactions')
        .select('*')
        .eq('shift_id', currentShift.id)
        .order('created_at', { ascending: false });

      if (transError) throw transError;

      // Fetch cash sales for current shift
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('total_amount, payment_method, created_at')
        .eq('cashier_id', user?.id)
        .gte('created_at', currentShift.start_time)
        .eq('payment_method', 'cash');

      if (salesError) throw salesError;

      setTransactions(cashTransactions || []);

      // Calculate totals
      const totalCashSales = sales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
      const totalCashOut = cashTransactions?.filter(t => t.type === 'cash_out').reduce((sum, t) => sum + t.amount, 0) || 0;
      const totalCashIn = cashTransactions?.filter(t => t.type === 'cash_in').reduce((sum, t) => sum + t.amount, 0) || 0;
      
      setCashBalance(prev => ({
        ...prev,
        cashIn: totalCashSales + totalCashIn,
        cashOut: totalCashOut,
        totalSales: totalCashSales,
        realTimeBalance: prev.float + totalCashSales + totalCashIn - totalCashOut
      }));

    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Start a new shift with float
  const startShift = async (floatAmount: number) => {
    if (!user) return false;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('shifts')
        .insert({
          cashier_id: user.id,
          float_amount: floatAmount,
          start_time: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentShift(data);
      setCashBalance(prev => ({
        ...prev,
        float: floatAmount,
        realTimeBalance: floatAmount
      }));

      toast.success(`Shift started with float of KES ${floatAmount}`);
      return true;
    } catch (error) {
      console.error('Error starting shift:', error);
      toast.error('Failed to start shift');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // End current shift
  const endShift = async () => {
    if (!currentShift) return false;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('shifts')
        .update({
          end_time: new Date().toISOString()
        })
        .eq('id', currentShift.id);

      if (error) throw error;

      setCurrentShift(null);
      setCashBalance({
        float: 0,
        cashIn: 0,
        cashOut: 0,
        realTimeBalance: 0,
        totalSales: 0,
        changeGiven: 0
      });

      toast.success('Shift ended successfully');
      return true;
    } catch (error) {
      console.error('Error ending shift:', error);
      toast.error('Failed to end shift');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Add cash out transaction
  const addCashOut = async (amount: number, description: string) => {
    try {
      setLoading(true);

      if (!currentShift) {
        toast.error('No active shift found');
        return false;
      }

      // Store in the dedicated cash_transactions table
      const { error } = await supabase
        .from('cash_transactions')
        .insert({
          type: 'cash_out',
          amount: amount,
          description: description,
          shift_id: currentShift.id,
          cashier_id: user?.id
        });

      if (error) throw error;

      setCashBalance(prev => ({
        ...prev,
        cashOut: prev.cashOut + amount,
        realTimeBalance: prev.float + prev.cashIn - (prev.cashOut + amount)
      }));

      toast.success(`Cash out recorded: KES ${amount}`);
      return true;
    } catch (error) {
      console.error('Error recording cash out:', error);
      toast.error('Failed to record cash out');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Add cash in transaction
  const addCashIn = async (amount: number, description: string) => {
    try {
      setLoading(true);

      if (!currentShift) {
        toast.error('No active shift found');
        return false;
      }

      // Store in the dedicated cash_transactions table
      const { error } = await supabase
        .from('cash_transactions')
        .insert({
          type: 'cash_in',
          amount: amount,
          description: description,
          shift_id: currentShift.id,
          cashier_id: user?.id
        });

      if (error) throw error;

      setCashBalance(prev => ({
        ...prev,
        cashIn: prev.cashIn + amount,
        realTimeBalance: prev.float + (prev.cashIn + amount) - prev.cashOut
      }));

      toast.success(`Cash in recorded: KES ${amount}`);
      return true;
    } catch (error) {
      console.error('Error recording cash in:', error);
      toast.error('Failed to record cash in');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Process cash sale
  const processCashSale = async (saleAmount: number, cashReceived: number) => {
    if (!currentShift) return 0;
    
    const change = cashReceived - saleAmount;
    
    try {
      // Record the sale transaction
      await supabase
        .from('cash_transactions')
        .insert({
          type: 'sale',
          amount: saleAmount,
          description: `Cash sale - Amount: ${saleAmount}, Received: ${cashReceived}, Change: ${change}`,
          shift_id: currentShift.id,
          cashier_id: user?.id
        });

      // Record change given if any
      if (change > 0) {
        await supabase
          .from('cash_transactions')
          .insert({
            type: 'change',
            amount: change,
            description: `Change given for cash sale`,
            shift_id: currentShift.id,
            cashier_id: user?.id
          });
      }

      // Update local state (real-time listener will also update it)
      setCashBalance(prev => ({
        ...prev,
        cashIn: prev.cashIn + saleAmount,
        cashOut: prev.cashOut + change,
        totalSales: prev.totalSales + saleAmount,
        changeGiven: prev.changeGiven + change,
        realTimeBalance: prev.float + (prev.cashIn + saleAmount) - (prev.cashOut + change)
      }));

      return change;
    } catch (error) {
      console.error('Error recording cash sale:', error);
      return change; // Still return change even if recording fails
    }
  };

  // Cash reconciliation
  const performReconciliation = async (declaredAmount: number) => {
    if (!currentShift) return false;

    try {
      setLoading(true);

      const expectedAmount = cashBalance.realTimeBalance;
      const difference = declaredAmount - expectedAmount;

      const { data: reconciliationData, error } = await supabase
        .from('cash_reconciliation')
        .insert({
          cashier_id: user?.id,
          shift_id: currentShift.id,
          expected_amount: expectedAmount,
          declared_amount: declaredAmount,
          difference: difference,
          reconciliation_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) throw error;

      // Update the real-time balance to reflect the reconciled amount
      setCashBalance(prev => ({
        ...prev,
        realTimeBalance: declaredAmount
      }));

      const status = difference === 0 ? 'balanced' : difference > 0 ? 'over' : 'short';
      
      toast.success(`Reconciliation completed - ${status.toUpperCase()}`);
      if (difference !== 0) {
        toast.warning(`Difference: KES ${Math.abs(difference)} ${difference > 0 ? 'over' : 'short'}`);
      }

      // If there's a shortfall or overage, record it as a cash transaction
      if (difference !== 0) {
        await supabase
          .from('cash_transactions')
          .insert({
            type: difference > 0 ? 'cash_in' : 'cash_out',
            amount: Math.abs(difference),
            description: `Reconciliation adjustment - ${difference > 0 ? 'Overage' : 'Shortfall'}`,
            shift_id: currentShift.id,
            cashier_id: user?.id
          });
      }

      // Refresh data to reflect the latest reconciliation
      await fetchTodaysTransactions();

      return true;
    } catch (error) {
      console.error('Error performing reconciliation:', error);
      toast.error('Failed to perform reconciliation');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    currentShift,
    cashBalance,
    transactions,
    loading,
    startShift,
    endShift,
    addCashOut,
    addCashIn,
    processCashSale,
    performReconciliation,
    refreshData: () => {
      fetchCurrentShift();
      fetchTodaysTransactions();
    }
  };
};