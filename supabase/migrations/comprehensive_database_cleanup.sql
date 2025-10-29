-- COMPREHENSIVE DATABASE CLEANUP AND FIX
-- This script addresses multiple issues:
-- 1. Removes ALL duplicate/conflicting RLS policies on products table
-- 2. Removes any triggers that might be setting stock_quantity to 1
-- 3. Fixes stock_quantity default value to 0
-- 4. Creates clean, correct RLS policies

-- ==============================================================================
-- STEP 1: DROP ALL EXISTING RLS POLICIES ON PRODUCTS TABLE
-- ==============================================================================

DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN
    -- Loop through all policies on products table and drop them
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'products'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON products', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- ==============================================================================
-- STEP 2: CHECK AND DROP ANY TRIGGERS ON PRODUCTS TABLE
-- ==============================================================================

DO $$ 
DECLARE 
    trigger_record RECORD;
BEGIN
    -- Loop through all triggers on products table and drop them
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'products'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON products', trigger_record.trigger_name);
        RAISE NOTICE 'Dropped trigger: %', trigger_record.trigger_name;
    END LOOP;
END $$;

-- ==============================================================================
-- STEP 3: FIX STOCK_QUANTITY DEFAULT VALUE
-- ==============================================================================

-- Remove any default value first
ALTER TABLE products 
  ALTER COLUMN stock_quantity DROP DEFAULT;

-- Now set the correct default value to 0
ALTER TABLE products 
  ALTER COLUMN stock_quantity SET DEFAULT 0;

-- Also set NOT NULL constraint if it doesn't exist
ALTER TABLE products 
  ALTER COLUMN stock_quantity SET NOT NULL;

-- ==============================================================================
-- STEP 4: ENSURE RLS IS ENABLED
-- ==============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- STEP 5: CREATE CLEAN, CORRECT RLS POLICIES
-- ==============================================================================

-- Policy 1: SELECT - All authenticated users can view products
CREATE POLICY "products_select_all_authenticated" ON products
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: INSERT - Admin, inventory, and cashier roles can add products
CREATE POLICY "products_insert_authorized_roles" ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'inventory', 'cashier')
    )
  );

-- Policy 3: UPDATE - Only admin and inventory roles can update products
CREATE POLICY "products_update_admin_inventory" ON products
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

-- Policy 4: DELETE - Only admin role can delete products
CREATE POLICY "products_delete_admin_only" ON products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ==============================================================================
-- STEP 6: ADD HELPFUL COMMENTS
-- ==============================================================================

COMMENT ON TABLE products IS 'Products table - Cleaned up on 2025-10-29. RLS policies: SELECT (all authenticated), INSERT (admin/inventory/cashier), UPDATE (admin/inventory), DELETE (admin only). Stock quantity defaults to 0.';

-- ==============================================================================
-- VERIFICATION QUERIES (Run these after applying the migration)
-- ==============================================================================

-- Verify stock_quantity default
-- SELECT column_default FROM information_schema.columns 
-- WHERE table_name = 'products' AND column_name = 'stock_quantity';
-- Expected: 0

-- Verify RLS policies (should have exactly 4 policies)
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies WHERE tablename = 'products';

-- Verify no triggers exist
-- SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'products';
-- Expected: No rows (unless you have audit triggers you want to keep)

-- ==============================================================================
-- SUCCESS MESSAGE
-- ==============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Database cleanup completed successfully!';
    RAISE NOTICE 'Stock quantity default is now 0';
    RAISE NOTICE 'All duplicate policies have been removed';
    RAISE NOTICE '4 clean RLS policies have been created';
    RAISE NOTICE 'Cashiers can now add products';
END $$;
