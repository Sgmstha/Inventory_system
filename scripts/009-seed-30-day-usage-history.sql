-- Seed simulated usage history for the last 30 days
-- This creates safe usage records based on current inventory levels and stops when stock runs out.
DO $$
DECLARE
  item_row RECORD;
  usage_date DATE;
  qty INTEGER;
  max_daily INTEGER;
  remaining INTEGER;
BEGIN
  FOR item_row IN
    SELECT id, quantity, category
    FROM inventory_items
    WHERE category IN ('Housekeeping', 'Food & Beverage', 'Front Desk', 'Office', 'Maintenance')
  LOOP
    remaining := item_row.quantity;
    max_daily := CASE
      WHEN item_row.category = 'Housekeeping' THEN 20
      WHEN item_row.category = 'Food & Beverage' THEN 15
      WHEN item_row.category = 'Front Desk' THEN 8
      WHEN item_row.category = 'Office' THEN 6
      WHEN item_row.category = 'Maintenance' THEN 5
      ELSE 5
    END;

    FOR usage_date IN SELECT generate_series(current_date - 29, current_date, interval '1 day')::date LOOP
      IF remaining <= 0 THEN
        EXIT;
      END IF;

      qty := LEAST((FLOOR(RANDOM() * max_daily) + 1)::INTEGER, remaining);
      INSERT INTO usage_history (item_id, quantity_used, date, notes)
      VALUES (item_row.id, qty, usage_date, 'Simulated 30-day usage');
      remaining := remaining - qty;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
