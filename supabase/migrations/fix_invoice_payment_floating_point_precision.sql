-- Fix floating-point precision issues in invoice payment system
-- This migration addresses the issue where invoices with tiny outstanding balances
-- (e.g., 0.0000000000006) due to floating-point arithmetic cannot be completed

-- ==============================================================================
-- STEP 1: Update existing invoices with negligible outstanding balances
-- ==============================================================================

-- Round outstanding balances < 0.01 to zero and mark as paid
UPDATE invoices
SET 
  outstanding_balance = 0,
  status = 'paid',
  updated_at = NOW()
WHERE 
  outstanding_balance > 0 
  AND outstanding_balance < 0.01
  AND status != 'paid';

-- ==============================================================================
-- STEP 2: Create or replace the record_invoice_payment function with precision handling
-- ==============================================================================

CREATE OR REPLACE FUNCTION record_invoice_payment(
  invoice_id_param TEXT,
  payment_amount NUMERIC,
  payment_method_param TEXT DEFAULT 'cash',
  payment_date_param DATE DEFAULT CURRENT_DATE,
  reference_number_param TEXT DEFAULT NULL,
  notes_param TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice RECORD;
  v_user_id UUID;
  v_user_role TEXT;
  v_new_amount_paid NUMERIC;
  v_new_outstanding NUMERIC;
  v_new_status TEXT;
  v_payment_id UUID;
  v_result JSON;
  MINIMUM_PAYMENT CONSTANT NUMERIC := 0.01;
BEGIN
  -- Get the current user
  v_user_id := auth.uid();
  
  -- Check authentication
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'User not authenticated',
      'error_code', 'NOT_AUTHENTICATED'
    );
  END IF;
  
  -- Get user role
  SELECT role INTO v_user_role FROM profiles WHERE id = v_user_id;
  
  -- Check permissions (admin, inventory, accountant can record payments)
  IF v_user_role NOT IN ('admin', 'inventory', 'accountant') THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Insufficient permissions to record payments',
      'error_code', 'INSUFFICIENT_PERMISSIONS',
      'user_role', v_user_role
    );
  END IF;
  
  -- Get the invoice
  SELECT * INTO v_invoice FROM invoices WHERE id = invoice_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Invoice not found',
      'error_code', 'INVOICE_NOT_FOUND'
    );
  END IF;
  
  -- Handle floating-point precision: if outstanding balance is negligible, mark as paid
  IF v_invoice.outstanding_balance < MINIMUM_PAYMENT AND v_invoice.outstanding_balance > 0 THEN
    UPDATE invoices
    SET 
      outstanding_balance = 0,
      status = 'paid',
      updated_at = NOW()
    WHERE id = invoice_id_param;
    
    RETURN json_build_object(
      'success', TRUE,
      'message', 'Invoice already fully paid (negligible balance rounded to zero)',
      'invoice_id', invoice_id_param,
      'previous_balance', v_invoice.outstanding_balance,
      'new_balance', 0,
      'status', 'paid'
    );
  END IF;
  
  -- Validate payment amount
  IF payment_amount < MINIMUM_PAYMENT THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Payment amount must be at least ' || MINIMUM_PAYMENT,
      'error_code', 'INVALID_AMOUNT',
      'payment_amount', payment_amount
    );
  END IF;
  
  -- Check if payment exceeds outstanding balance (with small tolerance for floating-point)
  IF payment_amount > (v_invoice.outstanding_balance + MINIMUM_PAYMENT) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Payment amount exceeds outstanding balance',
      'error_code', 'AMOUNT_EXCEEDS_BALANCE',
      'payment_amount', payment_amount,
      'outstanding_balance', v_invoice.outstanding_balance
    );
  END IF;
  
  -- Calculate new amounts
  v_new_amount_paid := v_invoice.amount_paid + payment_amount;
  v_new_outstanding := v_invoice.outstanding_balance - payment_amount;
  
  -- Handle floating-point precision in the result
  -- If the new outstanding is negligible, set it to zero
  IF v_new_outstanding < MINIMUM_PAYMENT AND v_new_outstanding >= 0 THEN
    v_new_outstanding := 0;
  END IF;
  
  -- Determine new status
  IF v_new_outstanding <= 0 THEN
    v_new_status := 'paid';
    v_new_outstanding := 0;  -- Ensure it's exactly zero
  ELSIF v_new_amount_paid > 0 THEN
    v_new_status := 'partially-paid';
  ELSE
    v_new_status := v_invoice.status;
  END IF;
  
  -- Create payment record
  INSERT INTO invoice_payments (
    invoice_id,
    amount,
    payment_method,
    payment_date,
    reference_number,
    notes,
    recorded_by
  ) VALUES (
    invoice_id_param,
    payment_amount,
    payment_method_param,
    payment_date_param,
    reference_number_param,
    notes_param,
    v_user_id
  )
  RETURNING id INTO v_payment_id;
  
  -- Update invoice
  UPDATE invoices
  SET
    amount_paid = v_new_amount_paid,
    outstanding_balance = v_new_outstanding,
    status = v_new_status,
    updated_at = NOW()
  WHERE id = invoice_id_param;
  
  -- Build success response
  v_result := json_build_object(
    'success', TRUE,
    'payment_id', v_payment_id,
    'invoice_id', invoice_id_param,
    'payment_amount', payment_amount,
    'new_amount_paid', v_new_amount_paid,
    'new_outstanding_balance', v_new_outstanding,
    'new_status', v_new_status
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', SQLERRM,
      'error_code', 'DATABASE_ERROR'
    );
END;
$$;

-- ==============================================================================
-- STEP 3: Create a trigger to automatically handle negligible balances
-- ==============================================================================

CREATE OR REPLACE FUNCTION check_invoice_balance_precision()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If outstanding balance is negligible (< 0.01 but > 0), round to zero and mark as paid
  IF NEW.outstanding_balance < 0.01 AND NEW.outstanding_balance > 0 THEN
    NEW.outstanding_balance := 0;
    NEW.status := 'paid';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trg_invoice_balance_precision ON invoices;

-- Create trigger
CREATE TRIGGER trg_invoice_balance_precision
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION check_invoice_balance_precision();

-- ==============================================================================
-- STEP 4: Add helpful comments
-- ==============================================================================

COMMENT ON FUNCTION record_invoice_payment IS 
'Records a payment for a supplier invoice with floating-point precision handling. 
Automatically rounds outstanding balances < 0.01 to zero and marks invoice as paid.';

COMMENT ON FUNCTION check_invoice_balance_precision IS 
'Trigger function that automatically handles floating-point precision issues in invoice balances.
Rounds negligible balances (< 0.01) to zero and updates status to paid.';

-- ==============================================================================
-- SUCCESS MESSAGE
-- ==============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Invoice payment floating-point precision fix completed!';
    RAISE NOTICE 'All invoices with negligible balances have been updated';
    RAISE NOTICE 'Payment function now handles floating-point precision';
    RAISE NOTICE 'Trigger created to prevent future precision issues';
END $$;
