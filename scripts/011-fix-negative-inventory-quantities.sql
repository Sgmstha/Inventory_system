-- Fix existing inventory items that have invalid negative quantity values.
-- This script brings any negative stock levels back to zero.

UPDATE inventory_items
SET quantity = 0
WHERE quantity < 0;
