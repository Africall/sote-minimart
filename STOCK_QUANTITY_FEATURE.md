# Stock Quantity Editing Feature - Implementation Summary

## Overview
This feature enables users to adjust stock quantities directly when editing a product in the Inventory page, with automatic history logging.

## Changes Made

### 1. Database Migration
**File:** `supabase/migrations/20250126_stock_adjustment_history.sql`

Creates a new `stock_adjustment_history` table to track all stock quantity changes:
- `product_id` - References the product
- `previous_quantity` - Stock level before change
- `new_quantity` - Stock level after change
- `quantity_change` - Net change (+/-)
- `adjustment_type` - Type of adjustment (manual, restock, etc.)
- `adjusted_by` - User who made the change
- `adjustment_reason` - Optional reason for the change
- `created_at` - Timestamp of change

**To Apply Migration:**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20250126_stock_adjustment_history.sql`
4. Execute the SQL

### 2. Component Updates

#### EditProductDialog.tsx
- Added stock quantity editing field with +/- buttons
- Users can manually enter or use increment/decrement buttons
- Shows real-time preview of quantity changes
- Passes original quantity to save handler

#### useInventoryActions.ts
- Updated `handleEditProduct` to accept optional `originalQuantity` parameter
- Handles stock adjustments separately using `updateProductStock` RPC
- Logs all stock changes to `stock_adjustment_history` table
- Maintains data integrity by using existing RPC functions

## Features

### User Interface
1. **Editable Stock Field**: Input field with current stock quantity
2. **+/- Buttons**: Quick increment/decrement controls
3. **Live Preview**: Shows how many units will be added/removed
4. **Validation**: Prevents negative quantities

### Backend Logic
1. **Separate Handling**: Stock changes processed separately from other updates
2. **History Logging**: All adjustments automatically logged with:
   - Previous and new quantities
   - User who made the change
   - Timestamp
   - Adjustment reason
3. **Success Toast**: Custom message showing units added or removed

## Usage

1. Navigate to Inventory Dashboard
2. Click Edit on any product
3. Adjust stock quantity using:
   - +/- buttons for single unit changes
   - Manual entry for bulk changes
4. Save changes
5. View success toast: "✅ Stock quantity updated successfully. Added/Removed X units."

## Success Messages

- **Stock Increased**: "✅ Stock quantity updated successfully. Added X units."
- **Stock Decreased**: "✅ Stock quantity updated successfully. Removed X units."
- **No Stock Change**: "Product updated successfully"

## History Tracking

All stock adjustments are logged in the `stock_adjustment_history` table with:
- Full audit trail
- User attribution
- Timestamp
- Previous/new quantities
- Net change

## Testing Checklist

- [ ] Apply database migration
- [ ] Test stock increment (+)
- [ ] Test stock decrement (-)
- [ ] Test manual quantity entry
- [ ] Verify success toast messages
- [ ] Check history logging in database
- [ ] Test with different user roles (admin/inventory)
- [ ] Verify stock updates reflect in inventory list

## Notes

- Stock adjustments are processed using the existing `update_product_stock` RPC function
- History logging is non-critical - if it fails, the stock update still succeeds
- Only admin and inventory roles can edit products
- Quantity cannot go below 0
