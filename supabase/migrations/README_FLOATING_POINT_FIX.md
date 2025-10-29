# Floating-Point Precision Fix for Invoice Payments

## Problem Description

When completing payment for a partially paid supplier invoice with a very small outstanding balance (e.g., 0.0000000000006 due to floating-point arithmetic), the system throws an error:

```
Minimum value (0.01) must be less than the maximum value (0)
```

This occurs because:
1. The outstanding balance is effectively zero but stored as a tiny positive number
2. The HTML input validation requires `min="0.01"` and `max={outstandingAmount}`
3. This creates an impossible constraint when the outstanding amount rounds to 0

## Solution

This fix addresses the issue at both the frontend and database levels:

### Frontend Changes (`RecordPaymentDialog.tsx`)

1. **Detection**: Treats balances < 0.01 as effectively paid
2. **UI Prevention**: Disables the payment form with a message when balance is negligible
3. **Validation**: Adds tolerance for floating-point comparison when validating payment amounts

### Database Changes (`fix_invoice_payment_floating_point_precision.sql`)

1. **Cleanup**: Updates existing invoices with negligible balances to zero
2. **Function Enhancement**: Updates `record_invoice_payment` to:
   - Automatically round negligible balances to zero
   - Add tolerance in payment validation
   - Handle precision issues in calculations
3. **Prevention**: Creates a trigger to automatically round negligible balances on future updates

## How to Apply

### Step 1: Apply the Database Migration

Run the migration using Supabase CLI or directly in your database:

```bash
# Using Supabase CLI
supabase db push

# Or apply the specific migration file
psql -h <your-host> -U <your-user> -d <your-db> -f supabase/migrations/fix_invoice_payment_floating_point_precision.sql
```

### Step 2: Frontend Changes Are Already Applied

The frontend changes in `RecordPaymentDialog.tsx` are already in place and will work immediately after the database migration is applied.

### Step 3: Verify the Fix

1. Navigate to Accounting → Supplier Invoices
2. Find any invoices with very small outstanding balances
3. Try to record a payment - the form should now indicate the invoice is fully paid
4. The outstanding balance should be automatically rounded to zero

## Technical Details

### Minimum Payment Amount

Both frontend and backend now use a constant `MINIMUM_PAYMENT = 0.01` to determine:
- Whether a balance is negligible (< 0.01)
- The minimum acceptable payment amount
- Tolerance for floating-point comparisons

### Automatic Rounding

The trigger `check_invoice_balance_precision` runs on every invoice update:
- If `outstanding_balance` is between 0 and 0.01 (exclusive)
- It automatically sets `outstanding_balance = 0`
- And updates `status = 'paid'`

### Database Function Behavior

The `record_invoice_payment` function now:
1. Checks if the invoice has a negligible balance and marks it as paid immediately
2. Validates payment amounts with floating-point tolerance
3. Rounds the resulting outstanding balance if it becomes negligible
4. Ensures the balance is exactly zero when the invoice is fully paid

## Edge Cases Handled

1. **Tiny balances from multiple partial payments**: Automatically rounded to zero
2. **Payment slightly exceeds balance**: Small tolerance (0.01) added to validation
3. **Negative balances**: Should never occur due to validation, but trigger handles them
4. **Currency precision**: All amounts use 2 decimal places (KSh 0.01 minimum)

## Testing Checklist

- [ ] Existing invoices with negligible balances are now marked as paid
- [ ] Cannot record payment on an invoice with balance < 0.01
- [ ] Payment form shows appropriate message for fully paid invoices
- [ ] New payments correctly handle floating-point precision
- [ ] Invoice status updates correctly when payments are recorded
- [ ] Outstanding balance never shows tiny values like 0.0000000000006

## Rollback (if needed)

To rollback this migration:

```sql
-- Remove the trigger
DROP TRIGGER IF EXISTS trg_invoice_balance_precision ON invoices;
DROP FUNCTION IF EXISTS check_invoice_balance_precision();

-- Note: You cannot easily rollback the invoice updates or function changes
-- Manual restoration would be required from a backup
```

## Future Considerations

- All financial calculations should use `NUMERIC` type in PostgreSQL for precision
- Frontend should always format currency values to 2 decimal places
- Consider using a money type library for JavaScript calculations
- Add unit tests for floating-point edge cases
