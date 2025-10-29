-- Fix RLS policies for products table and stock_quantity default
-- This migration addresses two issues:
-- 1. Cashiers unable to add products (RLS policy violation)
-- 2. Stock quantity being set to 1 instead of 0 for new products

-- First, let's check and update the default value for stock_quantity
ALTER TABLE products 
  ALTER COLUMN stock_quantity SET DEFAULT 0;

-- Drop existing RLS policies for products if they exist
DROP POLICY IF EXISTS "products_select_policy" ON products;
DROP POLICY IF EXISTS "products_insert_policy" ON products;
DROP POLICY IF EXISTS "products_update_policy" ON products;
DROP POLICY IF EXISTS "products_delete_policy" ON products;

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to SELECT products
CREATE POLICY "products_select_policy" ON products
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admin, inventory, and cashier roles to INSERT products
CREATE POLICY "products_insert_policy" ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'inventory', 'cashier')
    )
  );

-- Allow admin and inventory roles to UPDATE products
-- Cashiers should NOT be able to update products directly
CREATE POLICY "products_update_policy" ON products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'inventory')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'inventory')
    )
  );

-- Allow only admin role to DELETE products
CREATE POLICY "products_delete_policy" ON products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add a comment to document the policy
COMMENT ON TABLE products IS 'Products table with RLS policies: SELECT (all authenticated), INSERT (admin/inventory/cashier), UPDATE (admin/inventory), DELETE (admin only)';
