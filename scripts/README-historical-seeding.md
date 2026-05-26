# Historical Transaction Data Seeding

This system generates realistic 30-day historical inventory transaction data for testing the Smart Inventory Management System's stockout prediction engine.

## Overview

The seeding system creates comprehensive transaction history that includes:
- **Daily consumption patterns** based on item categories
- **Realistic variability** and weekend spikes
- **Scheduled restocks** with appropriate frequencies
- **Random events** like damages, adjustments, and transfers
- **Multiple transaction types**: usage, restock, deduction, adjustment, transfer

## Database Schema

### New Table: `inventory_transactions`

```sql
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('usage', 'sale', 'deduction', 'restock', 'transfer', 'adjustment')),
  quantity INTEGER NOT NULL CHECK (quantity != 0),
  unit_cost DECIMAL(10, 2),
  total_cost DECIMAL(10, 2),
  reference_number VARCHAR(100),
  notes TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Automatic Inventory Updates

The system includes triggers that automatically update inventory quantities based on transactions:
- **Restock/Adjustment** (positive quantities): Increase inventory
- **Usage/Sale/Deduction/Transfer** (positive quantities): Decrease inventory
- **Restock transactions**: Update `last_restocked_at` timestamp

## Transaction Patterns by Category

### Food & Beverage
- **High daily usage** (3-8 units/day)
- **Weekend spikes** (1.2-2.0x normal usage)
- **Frequent restocks** (2-5 days)
- **Examples**: Milk (8/day), Bread (6/day), Coffee (4/day)

### Housekeeping
- **Steady consumption** (8-25 units/day)
- **Moderate restocks** (3-7 days)
- **Examples**: Toilet paper (25/day), Towels (12/day), Soap (15/day)

### Office/Front Desk
- **Moderate usage** (3-5 units/day)
- **Infrequent restocks** (10-12 days)
- **Weekend reduction** (0.3-0.5x normal)
- **Examples**: Pens (5/day), Paper (5/day)

### Maintenance
- **Low usage** (1-2 units/day)
- **Rare restocks** (15-20 days)
- **High variability** (random spikes)
- **Examples**: Batteries (2/day), Light bulbs (2/day)

## Usage Instructions

### 1. Database Setup
Run the table creation script:
```bash
psql -d your_database -f scripts/010-create-inventory-transactions-table.sql
```

### 2. Generate Historical Data
1. Navigate to the Analytics page in your application
2. Find the "Seed Historical Transaction Data" section
3. Click "Generate Historical Data"
4. Confirm the operation (it will generate thousands of transactions)
5. Wait for completion message
6. Refresh the page to see updated predictions

### 3. Verify Results
After seeding, check:
- **Smart Restock Recommendations**: Should show various urgency levels
- **Predicted Stockout column**: Should display dates or "Insufficient Data"
- **Analytics dashboard**: Should show meaningful consumption patterns

## Prediction Requirements Met

The generated data ensures each item has:
- ✅ **At least 30 days of history**
- ✅ **More than 10 transactions per item**
- ✅ **Realistic consumption patterns**
- ✅ **Variety in urgency levels** (some critical, some low, some medium)

## Data Quality Features

- **Realistic randomness**: ±20-60% variation based on item type
- **Weekend patterns**: Increased consumption for food items
- **Event simulation**: 5% chance of random events (damages, transfers, adjustments)
- **Restock timing**: Category-appropriate restock frequencies
- **Cost tracking**: Automatic calculation of total costs

## Safety Features

- **Duplicate prevention**: Checks for existing data before seeding
- **Batch processing**: Inserts data in chunks to prevent timeouts
- **Error handling**: Comprehensive error reporting
- **Inventory consistency**: Automatic quantity updates via triggers

## Expected Results

After seeding, you should see:
- Items with **HIGH urgency**: Fast-moving items near stockout
- Items with **MEDIUM urgency**: Items below reorder levels
- Items with **LOW urgency**: Well-stocked items with future predictions
- **Predicted stockouts**: Realistic dates based on consumption patterns
- **Confidence levels**: Low/Medium/High based on data amount

The prediction system will now have sufficient historical data to provide accurate stockout forecasts and meaningful restock recommendations.</content>
<parameter name="filePath">d:\downloads\inventory-management-system\scripts\README-historical-seeding.md