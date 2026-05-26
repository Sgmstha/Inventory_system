-- Create comprehensive inventory transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('usage', 'sale', 'deduction', 'restock', 'transfer', 'adjustment')),
  quantity INTEGER NOT NULL CHECK (quantity != 0), -- Can be positive or negative
  unit_cost DECIMAL(10, 2),
  total_cost DECIMAL(10, 2),
  reference_number VARCHAR(100), -- PO number, invoice, etc.
  notes TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(transaction_date);

-- Create function to update inventory quantity based on transactions
CREATE OR REPLACE FUNCTION update_inventory_quantity()
RETURNS TRIGGER AS $$
BEGIN
  -- Update inventory quantity based on transaction
  IF NEW.transaction_type IN ('restock', 'adjustment') AND NEW.quantity > 0 THEN
    UPDATE inventory_items SET quantity = quantity + NEW.quantity WHERE id = NEW.item_id;
  ELSIF NEW.transaction_type IN ('usage', 'sale', 'deduction', 'transfer') AND NEW.quantity > 0 THEN
    UPDATE inventory_items SET quantity = GREATEST(0, quantity - NEW.quantity) WHERE id = NEW.item_id;
  END IF;

  -- Update last_restocked_at for restock transactions
  IF NEW.transaction_type = 'restock' THEN
    UPDATE inventory_items SET last_restocked_at = NEW.transaction_date WHERE id = NEW.item_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update inventory quantities
DROP TRIGGER IF EXISTS trigger_update_inventory_quantity ON inventory_transactions;
CREATE TRIGGER trigger_update_inventory_quantity
  AFTER INSERT ON inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_quantity();</content>
<parameter name="filePath">d:\downloads\inventory-management-system\scripts\010-create-inventory-transactions-table.sql