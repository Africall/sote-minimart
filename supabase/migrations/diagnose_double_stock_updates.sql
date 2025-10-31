-- Diagnostic Query to Identify Potential Double Stock Updates in Supplier Invoices
-- This script helps identify invoices that might have caused duplicate stock updates

-- ==============================================================================
-- STEP 1: Check for any custom triggers on invoices table
-- ==============================================================================

SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'invoices'
ORDER BY trigger_name;

-- ==============================================================================
-- STEP 2: Check for any RPC functions that update stock and invoice status together
-- ==============================================================================

SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
    AND (
        routine_definition ILIKE '%update%stock%'
        OR routine_definition ILIKE '%invoice%status%'
    )
ORDER BY routine_name;

-- ==============================================================================
-- STEP 3: Identify invoices with suspicious payment patterns
-- This finds invoices where multiple payments might have been recorded
-- ==============================================================================

WITH invoice_payment_summary AS (
    SELECT 
        i.id AS invoice_id,
        i.supplier_name,
        i.status,
        i.total_amount,
        i.amount_paid,
        i.outstanding_balance,
        i.created_at AS invoice_created,
        COUNT(ip.id) AS payment_count,
        SUM(ip.amount) AS total_payments_recorded,
        ARRAY_AGG(
            json_build_object(
                'payment_id', ip.id,
                'amount', ip.amount,
                'payment_date', ip.payment_date,
                'payment_method', ip.payment_method,
                'recorded_at', ip.created_at
            ) ORDER BY ip.created_at
        ) AS payments
    FROM invoices i
    LEFT JOIN invoice_payments ip ON i.id = ip.invoice_id
    WHERE i.status IN ('paid', 'partially-paid')
    GROUP BY i.id, i.supplier_name, i.status, i.total_amount, i.amount_paid, i.outstanding_balance, i.created_at
)
SELECT 
    invoice_id,
    supplier_name,
    status,
    total_amount,
    amount_paid,
    outstanding_balance,
    payment_count,
    total_payments_recorded,
    invoice_created,
    payments,
    -- Flag potential issues
    CASE 
        WHEN payment_count > 1 AND status = 'paid' THEN 'MULTIPLE_PAYMENTS_TO_PAID'
        WHEN ABS(amount_paid - total_payments_recorded) > 0.01 THEN 'PAYMENT_MISMATCH'
        WHEN outstanding_balance < 0 THEN 'NEGATIVE_BALANCE'
        ELSE 'OK'
    END AS potential_issue
FROM invoice_payment_summary
WHERE payment_count > 0
ORDER BY 
    CASE 
        WHEN outstanding_balance < 0 THEN 1
        WHEN payment_count > 1 AND status = 'paid' THEN 2
        WHEN ABS(amount_paid - total_payments_recorded) > 0.01 THEN 3
        ELSE 4
    END,
    invoice_created DESC;

-- ==============================================================================
-- STEP 4: Check stock movements correlated with invoice payments
-- This requires checking if products were updated around payment times
-- ==============================================================================

WITH recent_invoice_payments AS (
    SELECT 
        ip.id AS payment_id,
        ip.invoice_id,
        ip.amount,
        ip.payment_date,
        ip.created_at AS payment_recorded_at,
        i.supplier_name,
        i.status AS invoice_status
    FROM invoice_payments ip
    JOIN invoices i ON ip.invoice_id = i.id
    WHERE ip.created_at >= NOW() - INTERVAL '90 days'  -- Last 90 days
)
SELECT 
    payment_id,
    invoice_id,
    supplier_name,
    amount,
    payment_date,
    payment_recorded_at,
    invoice_status
FROM recent_invoice_payments
ORDER BY payment_recorded_at DESC
LIMIT 50;

-- ==============================================================================
-- STEP 5: Get summary of all paid invoices with their line items
-- ==============================================================================

SELECT 
    i.id AS invoice_id,
    i.supplier_name,
    i.status,
    i.created_at AS invoice_created,
    i.total_amount,
    i.amount_paid,
    i.outstanding_balance,
    COUNT(DISTINCT il.id) AS line_item_count,
    COUNT(DISTINCT ip.id) AS payment_count,
    ARRAY_AGG(DISTINCT il.product_name) AS products,
    ARRAY_AGG(DISTINCT il.product_id) AS product_ids
FROM invoices i
LEFT JOIN invoice_line_items il ON i.id = il.invoice_id
LEFT JOIN invoice_payments ip ON i.id = ip.invoice_id
WHERE i.status = 'paid'
    AND i.created_at >= NOW() - INTERVAL '90 days'
GROUP BY i.id, i.supplier_name, i.status, i.created_at, i.total_amount, i.amount_paid, i.outstanding_balance
ORDER BY i.created_at DESC;

-- ==============================================================================
-- INSTRUCTIONS
-- ==============================================================================

-- Run each query section separately to investigate:
-- 1. Check if there are unexpected triggers on the invoices table
-- 2. Check for RPC functions that might update both stock and invoices
-- 3. Look for invoices with suspicious payment patterns
-- 4. Review recent invoice payments
-- 5. Get a summary of paid invoices and their products

-- If you find invoices marked as 'paid' with MULTIPLE_PAYMENTS_TO_PAID,
-- these might have been paid multiple times, potentially causing double stock updates
-- if there was old code that updated stock on payment.
