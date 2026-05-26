-- Prevent inventory from going negative and enforce valid usage amounts

ALTER TABLE inventory_items
  ADD CONSTRAINT inventory_items_quantity_nonnegative CHECK (quantity >= 0);

ALTER TABLE usage_history
  ADD CONSTRAINT usage_history_quantity_positive CHECK (quantity_used > 0);

-- Prevent recording usage if there is not enough stock available
CREATE OR REPLACE FUNCTION public.prevent_overusage()
RETURNS TRIGGER AS $$
DECLARE
  current_quantity INTEGER;
BEGIN
  SELECT quantity INTO current_quantity
  FROM inventory_items
  WHERE id = NEW.item_id;

  IF current_quantity IS NULL THEN
    RAISE EXCEPTION 'Inventory item not found';
  ELSIF NEW.quantity_used <= 0 THEN
    RAISE EXCEPTION 'Usage quantity must be greater than 0';
  ELSIF NEW.quantity_used > current_quantity THEN
    RAISE EXCEPTION 'Cannot record usage of % because only % are in stock', NEW.quantity_used, current_quantity;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS before_usage_recorded ON usage_history;
CREATE TRIGGER before_usage_recorded
  BEFORE INSERT ON usage_history
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_overusage();
