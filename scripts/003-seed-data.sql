-- Insert sample inventory items for a hotel
INSERT INTO inventory_items (name, category, quantity, unit, reorder_point, reorder_quantity, unit_cost, supplier, location) VALUES
-- Housekeeping supplies
('Bath Towels', 'Housekeeping', 150, 'pieces', 50, 100, 8.50, 'Hotel Linens Inc', 'Housekeeping Storage'),
('Hand Towels', 'Housekeeping', 200, 'pieces', 60, 120, 4.25, 'Hotel Linens Inc', 'Housekeeping Storage'),
('Bed Sheets (Queen)', 'Housekeeping', 120, 'pieces', 40, 80, 15.00, 'Hotel Linens Inc', 'Housekeeping Storage'),
('Pillowcases', 'Housekeeping', 180, 'pieces', 50, 100, 3.50, 'Hotel Linens Inc', 'Housekeeping Storage'),
('Toilet Paper', 'Housekeeping', 500, 'rolls', 200, 500, 0.75, 'Office Depot', 'Housekeeping Storage'),
('Facial Tissues', 'Housekeeping', 300, 'boxes', 100, 200, 1.25, 'Office Depot', 'Housekeeping Storage'),
('Shampoo Bottles (30ml)', 'Housekeeping', 400, 'bottles', 150, 300, 0.60, 'Hotel Amenities Co', 'Housekeeping Storage'),
('Conditioner Bottles (30ml)', 'Housekeeping', 380, 'bottles', 150, 300, 0.60, 'Hotel Amenities Co', 'Housekeeping Storage'),
('Body Soap Bars', 'Housekeeping', 450, 'bars', 180, 360, 0.35, 'Hotel Amenities Co', 'Housekeeping Storage'),
('Laundry Detergent', 'Housekeeping', 25, 'gallons', 10, 20, 12.00, 'Cleaning Supply Co', 'Laundry Room'),
('Bleach', 'Housekeeping', 30, 'gallons', 12, 24, 8.00, 'Cleaning Supply Co', 'Laundry Room'),
('All-Purpose Cleaner', 'Housekeeping', 40, 'bottles', 15, 30, 5.50, 'Cleaning Supply Co', 'Housekeeping Storage'),

-- Food & Beverage
('Coffee Beans', 'Food & Beverage', 50, 'lbs', 20, 40, 12.00, 'Premium Coffee Supply', 'Kitchen Pantry'),
('Tea Bags (Assorted)', 'Food & Beverage', 800, 'bags', 300, 600, 0.15, 'Tea Imports Ltd', 'Kitchen Pantry'),
('Sugar Packets', 'Food & Beverage', 2000, 'packets', 800, 1500, 0.05, 'Restaurant Supply Co', 'Kitchen Pantry'),
('Creamer Cups', 'Food & Beverage', 1500, 'cups', 600, 1200, 0.10, 'Restaurant Supply Co', 'Kitchen Pantry'),
('Orange Juice', 'Food & Beverage', 60, 'gallons', 25, 50, 8.50, 'Fresh Produce Co', 'Kitchen Refrigerator'),
('Milk', 'Food & Beverage', 40, 'gallons', 20, 40, 4.50, 'Fresh Produce Co', 'Kitchen Refrigerator'),
('Breakfast Cereal (Assorted)', 'Food & Beverage', 80, 'boxes', 30, 60, 3.75, 'Restaurant Supply Co', 'Kitchen Pantry'),
('Bread Loaves', 'Food & Beverage', 35, 'loaves', 15, 30, 2.50, 'Local Bakery', 'Kitchen Pantry'),
('Eggs', 'Food & Beverage', 150, 'dozen', 50, 100, 3.25, 'Fresh Produce Co', 'Kitchen Refrigerator'),
('Bacon', 'Food & Beverage', 40, 'lbs', 15, 30, 8.00, 'Premium Meats Inc', 'Kitchen Refrigerator'),

-- Front Desk & Office
('Key Cards', 'Front Desk', 500, 'cards', 150, 300, 0.80, 'Hotel Technology Inc', 'Front Desk'),
('Pens', 'Office', 200, 'pieces', 75, 150, 0.50, 'Office Depot', 'Front Desk'),
('Notepads', 'Office', 150, 'pads', 50, 100, 1.25, 'Office Depot', 'Front Desk'),
('Printer Paper', 'Office', 40, 'reams', 15, 30, 6.50, 'Office Depot', 'Back Office'),
('Ink Cartridges (Black)', 'Office', 12, 'cartridges', 5, 10, 35.00, 'Office Depot', 'Back Office'),
('Folders', 'Office', 100, 'folders', 30, 60, 0.75, 'Office Depot', 'Back Office'),

-- Maintenance
('Light Bulbs (LED)', 'Maintenance', 80, 'bulbs', 30, 60, 4.50, 'Hardware Store', 'Maintenance Room'),
('Batteries (AA)', 'Maintenance', 120, 'batteries', 40, 80, 0.75, 'Hardware Store', 'Maintenance Room'),
('Batteries (AAA)', 'Maintenance', 100, 'batteries', 35, 70, 0.75, 'Hardware Store', 'Maintenance Room'),
('Air Filters (HVAC)', 'Maintenance', 30, 'filters', 10, 20, 15.00, 'HVAC Supply Co', 'Maintenance Room'),
('Plumbing Tape', 'Maintenance', 25, 'rolls', 10, 20, 2.50, 'Hardware Store', 'Maintenance Room'),
('Screws (Assorted)', 'Maintenance', 50, 'boxes', 15, 30, 8.00, 'Hardware Store', 'Maintenance Room');

-- Insert sample usage history (last 30 days)
INSERT INTO usage_history (item_id, quantity_used, date, notes) 
SELECT 
  id,
  FLOOR(RANDOM() * 20 + 5)::INTEGER,
  CURRENT_DATE - (random() * 30)::INTEGER,
  'Daily usage'
FROM inventory_items
WHERE category IN ('Housekeeping', 'Food & Beverage')
LIMIT 50;
