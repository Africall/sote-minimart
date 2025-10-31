# Supplier Invoice Payment - Stock Update Analysis

## Summary
After thorough investigation of the codebase, **there is NO duplicate stock update occurring when paying for supplier invoices**. The current implementation is correct.

## Investigation Results

### 1. Invoice Creation (Correct Behavior ✅)
**File:** `src/components/accounting/CreateSupplierInvoiceDialog.tsx` (Lines 196-238)

When creating a new supplier invoice:
- Stock IS updated for products with a `product_id`
- Uses `supabase.rpc('update_product_stock')` to increase inventory
- This happens ONLY on invoice creation, NOT on edits
- This is **correct behavior** - receiving goods from supplier increases stock

```javascript
if (!invoice?.id) {  // Only for NEW invoices
  const stockUpdatePromises = lineItems
    .filter(item => !!item.product_id)
    .map(async (item) => {
      await supabase.rpc('update_product_stock', {
        product_id_param: item.product_id!,
        quantity_change: item.quantity
      });
    });
}
```

### 2. Payment Recording (Correct - No Stock Update ✅)
**File:** `src/components/accounting/RecordPaymentDialog.tsx`

When recording a payment:
- Calls `supabase.rpc('record_invoice_payment')` 
- This function ONLY updates:
  - Payment amounts
  - Invoice status
  - Outstanding balance
- **Does NOT touch stock quantities at all**

### 3. Database Function Analysis ✅
**File:** `supabase/migrations/fix_invoice_payment_floating_point_precision.sql`

The `record_invoice_payment` function:
- Updates invoice payment records
- Handles floating-point precision
- **Contains NO stock update logic**

### 4. Database Triggers Analysis ✅
Only one trigger exists on the `invoices` table:
- `trg_invoice_balance_precision` - handles floating-point precision
- **Does NOT update stock**

## Possible Explanations for Perceived Issue

If you're seeing double stock updates, consider these scenarios:

### Scenario 1: Manual Stock Adjustments
- Someone manually adjusted stock after creating an invoice
- This would appear as a "double update" but was actually two separate actions

### Scenario 2: Testing/Development
- Invoice was created multiple times during testing
- Each creation legitimately adds stock

### Scenario 3: Old Code or Manual Database Changes
- Previous version of the code might have had this issue
- Direct database updates bypassing the application

### Scenario 4: Confusion with Edit vs. Create
- The edit function explicitly skips stock updates (correct)
- If you edited an invoice, re-saved it as new, that would add stock again

## Diagnostic Tools Provided

### File: `supabase/migrations/diagnose_double_stock_updates.sql`

Run this diagnostic script in your Supabase SQL editor to:

1. **Check for unexpected triggers** on the invoices table
2. **Find RPC functions** that might update both stock and invoices
3. **Identify invoices with suspicious payment patterns**:
   - Multiple payments recorded for paid invoices
   - Payment amount mismatches
   - Negative balances
4. **Review recent invoice payments** (last 90 days)
5. **Get summary of paid invoices** with their products

### How to Use the Diagnostic:
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Paste and run each query section from `diagnose_double_stock_updates.sql`
4. Look for rows with `potential_issue` flag:
   - `MULTIPLE_PAYMENTS_TO_PAID` - Invoice marked as paid but received multiple payments
   - `PAYMENT_MISMATCH` - Total payments don't match amount_paid
   - `NEGATIVE_BALANCE` - Outstanding balance is negative

## Recommendations

### 1. Run the Diagnostic
Execute the diagnostic queries to identify any historical issues in your database.

### 2. Review Stock Audit Trail
If you have a stock movements/audit table, review it for:
```sql
SELECT 
    p.name AS product_name,
    sm.quantity_change,
    sm.movement_type,
    sm.reference_id,
    sm.created_at,
    u.email AS performed_by
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
LEFT JOIN auth.users u ON sm.user_id = u.id
WHERE sm.reference_id LIKE 'SINV-%'  -- Supplier invoice IDs
ORDER BY sm.created_at DESC;
```

### 3. Check for Duplicate Invoice IDs
If invoice IDs were reused or invoices were created multiple times:
```sql
SELECT 
    i.id,
    COUNT(*) as creation_count,
    STRING_AGG(DISTINCT i.created_at::text, ', ') as created_times
FROM invoices i
GROUP BY i.id
HAVING COUNT(*) > 1;
```

### 4. Implement Stock Movement Logging (Future Enhancement)
Consider adding a `stock_movements` table to track all inventory changes with:
- Movement type (purchase, sale, adjustment, return)
- Reference ID (invoice ID, sale ID, etc.)
- User who made the change
- Timestamp
- Reason/notes

### 5. Add Stock Update Safeguards
Consider adding validation in `CreateSupplierInvoiceDialog.tsx`:
```typescript
// Before updating stock, check if this invoice already updated stock
const { data: existingMovements } = await supabase
  .from('stock_movements')
  .select('id')
  .eq('reference_id', invoiceId)
  .eq('movement_type', 'supplier_invoice');

if (existingMovements && existingMovements.length > 0) {
  console.warn('Stock already updated for this invoice');
  return;
}
```

## Conclusion

**The current code is working correctly.** There is no bug causing duplicate stock updates when payments are recorded. 

If you're experiencing stock discrepancies:
1. Run the diagnostic queries to find affected invoices
2. Review your stock audit trail
3. Check for user error or manual adjustments
4. Consider implementing stock movement logging for better traceability

## Files Reviewed
- ✅ `src/components/accounting/RecordPaymentDialog.tsx`
- ✅ `src/components/accounting/CreateSupplierInvoiceDialog.tsx`
- ✅ `src/components/accounting/SupplierInvoicesModule.tsx`
- ✅ `supabase/migrations/fix_invoice_payment_floating_point_precision.sql`
- ✅ `supabase/migrations/comprehensive_database_cleanup.sql`

## Support
If you find specific invoices that have doubled stock, please:
1. Note the invoice ID
2. Run the diagnostic queries
3. Check the invoice's payment history
4. Review when the invoice was created vs. when payments were recorded
5. Look for any stock adjustments made around those times
