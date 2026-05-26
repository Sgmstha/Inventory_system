-- Add dynamic reorder metadata fields to restock_recommendations
ALTER TABLE restock_recommendations
  ADD COLUMN IF NOT EXISTS dynamic_reorder_point INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recommended_reorder_quantity INTEGER DEFAULT 0;

UPDATE restock_recommendations
SET dynamic_reorder_point = COALESCE(dynamic_reorder_point, 0),
    recommended_reorder_quantity = COALESCE(recommended_reorder_quantity, 0)
WHERE dynamic_reorder_point IS NULL OR recommended_reorder_quantity IS NULL;
