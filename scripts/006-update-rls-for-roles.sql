-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated insert on inventory_items" ON inventory_items;
DROP POLICY IF EXISTS "Allow authenticated update on inventory_items" ON inventory_items;
DROP POLICY IF EXISTS "Allow authenticated delete on inventory_items" ON inventory_items;

-- Create role-based policies for inventory_items
-- All authenticated users can read
CREATE POLICY "All users can read inventory_items"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert new items
CREATE POLICY "Only admins can insert inventory_items"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update item details (name, category, unit_cost, etc.)
CREATE POLICY "Only admins can update inventory_items"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete items
CREATE POLICY "Only admins can delete inventory_items"
  ON inventory_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Staff can record usage and restock
-- All users can insert usage history
CREATE POLICY "All users can insert usage_history"
  ON usage_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- All users can read usage history
CREATE POLICY "All users can read usage_history"
  ON usage_history FOR SELECT
  TO authenticated
  USING (true);

-- Create function to update inventory quantity when usage is recorded
CREATE OR REPLACE FUNCTION public.update_inventory_on_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Reduce inventory quantity
  UPDATE inventory_items
  SET quantity = GREATEST(0, quantity - NEW.quantity_used)
  WHERE id = NEW.item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for usage history
DROP TRIGGER IF EXISTS on_usage_recorded ON usage_history;
CREATE TRIGGER on_usage_recorded
  AFTER INSERT ON usage_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_on_usage();

-- Create function to update inventory quantity on restock
CREATE OR REPLACE FUNCTION public.update_inventory_on_restock()
RETURNS TRIGGER AS $$
BEGIN
  -- Increase inventory quantity
  UPDATE inventory_items
  SET 
    quantity = quantity + NEW.quantity,
    last_restocked_at = NEW.restocked_at
  WHERE id = NEW.item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create restock_history table
CREATE TABLE IF NOT EXISTS restock_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  restocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  restocked_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on restock_history
ALTER TABLE restock_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can read restock_history"
  ON restock_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All users can insert restock_history"
  ON restock_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create trigger for restock history
DROP TRIGGER IF EXISTS on_restock_recorded ON restock_history;
CREATE TRIGGER on_restock_recorded
  AFTER INSERT ON restock_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_on_restock();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_usage_history_item_date ON usage_history(item_id, date);
CREATE INDEX IF NOT EXISTS idx_restock_history_item ON restock_history(item_id);
CREATE INDEX IF NOT EXISTS idx_restock_history_date ON restock_history(restocked_at);
