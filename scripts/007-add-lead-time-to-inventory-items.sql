-- Add lead time field to inventory items so reorder formulas can use a configurable supplier lead time
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS lead_time_days INTEGER NOT NULL DEFAULT 7;

-- Set default lead time for existing records if any rows are missing a value
UPDATE inventory_items
SET lead_time_days = 7
WHERE lead_time_days IS NULL;
