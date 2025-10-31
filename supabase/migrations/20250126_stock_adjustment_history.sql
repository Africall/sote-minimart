-- Create stock_adjustment_history table
CREATE TABLE IF NOT EXISTS stock_adjustment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  quantity_change INTEGER NOT NULL,
  adjustment_type VARCHAR(50) NOT NULL DEFAULT 'manual',
  adjusted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  adjustment_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stock_adjustment_product_id ON stock_adjustment_history(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustment_created_at ON stock_adjustment_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE stock_adjustment_history ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view history
CREATE POLICY "Users can view stock adjustment history"
  ON stock_adjustment_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for authenticated users to insert history
CREATE POLICY "Users can insert stock adjustment history"
  ON stock_adjustment_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE stock_adjustment_history IS 'Tracks all stock quantity adjustments made to products';
