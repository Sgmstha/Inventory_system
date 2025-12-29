-- Enable Row Level Security on all tables
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE restock_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (hotel staff)
-- All authenticated users can read all data
CREATE POLICY "Allow authenticated read access on inventory_items"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access on usage_history"
  ON usage_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access on restock_recommendations"
  ON restock_recommendations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access on purchase_orders"
  ON purchase_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access on purchase_order_items"
  ON purchase_order_items FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can insert/update/delete
CREATE POLICY "Allow authenticated insert on inventory_items"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on inventory_items"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete on inventory_items"
  ON inventory_items FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on usage_history"
  ON usage_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on usage_history"
  ON usage_history FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete on usage_history"
  ON usage_history FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on restock_recommendations"
  ON restock_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on restock_recommendations"
  ON restock_recommendations FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete on restock_recommendations"
  ON restock_recommendations FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on purchase_orders"
  ON purchase_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on purchase_orders"
  ON purchase_orders FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete on purchase_orders"
  ON purchase_orders FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on purchase_order_items"
  ON purchase_order_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on purchase_order_items"
  ON purchase_order_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete on purchase_order_items"
  ON purchase_order_items FOR DELETE
  TO authenticated
  USING (true);
