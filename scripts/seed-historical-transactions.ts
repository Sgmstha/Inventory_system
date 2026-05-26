import { createClient } from '../lib/utils/supabase/server'
import { cookies } from 'next/headers'

interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  reorder_point: number
  reorder_quantity: number
  unit_cost: number
}

interface TransactionPattern {
  baseDailyUsage: number
  weekendMultiplier: number
  restockFrequency: number // days between restocks
  restockQuantity: number
  variability: number // 0-1, how much random variation
  transactionTypes: string[]
}

function getTransactionPattern(category: string, itemName: string): TransactionPattern {
  // Food & Beverage items - high usage, weekend spikes
  if (category === 'Food & Beverage') {
    if (itemName.toLowerCase().includes('milk') || itemName.toLowerCase().includes('juice')) {
      return {
        baseDailyUsage: 8,
        weekendMultiplier: 1.5,
        restockFrequency: 3,
        restockQuantity: 20,
        variability: 0.4,
        transactionTypes: ['usage', 'restock']
      }
    }
    if (itemName.toLowerCase().includes('bread') || itemName.toLowerCase().includes('eggs')) {
      return {
        baseDailyUsage: 6,
        weekendMultiplier: 2.0,
        restockFrequency: 2,
        restockQuantity: 15,
        variability: 0.5,
        transactionTypes: ['usage', 'restock']
      }
    }
    if (itemName.toLowerCase().includes('coffee') || itemName.toLowerCase().includes('tea')) {
      return {
        baseDailyUsage: 4,
        weekendMultiplier: 1.2,
        restockFrequency: 5,
        restockQuantity: 25,
        variability: 0.3,
        transactionTypes: ['usage', 'restock']
      }
    }
    return {
      baseDailyUsage: 3,
      weekendMultiplier: 1.3,
      restockFrequency: 4,
      restockQuantity: 30,
      variability: 0.35,
      transactionTypes: ['usage', 'restock']
    }
  }

  // Housekeeping items - steady usage, periodic restocks
  if (category === 'Housekeeping') {
    if (itemName.toLowerCase().includes('towel') || itemName.toLowerCase().includes('sheet')) {
      return {
        baseDailyUsage: 12,
        weekendMultiplier: 1.1,
        restockFrequency: 7,
        restockQuantity: 50,
        variability: 0.2,
        transactionTypes: ['usage', 'restock']
      }
    }
    if (itemName.toLowerCase().includes('soap') || itemName.toLowerCase().includes('shampoo') || itemName.toLowerCase().includes('conditioner')) {
      return {
        baseDailyUsage: 15,
        weekendMultiplier: 1.0,
        restockFrequency: 5,
        restockQuantity: 100,
        variability: 0.25,
        transactionTypes: ['usage', 'restock']
      }
    }
    if (itemName.toLowerCase().includes('toilet paper') || itemName.toLowerCase().includes('tissue')) {
      return {
        baseDailyUsage: 25,
        weekendMultiplier: 1.0,
        restockFrequency: 3,
        restockQuantity: 200,
        variability: 0.3,
        transactionTypes: ['usage', 'restock']
      }
    }
    return {
      baseDailyUsage: 8,
      weekendMultiplier: 1.0,
      restockFrequency: 6,
      restockQuantity: 40,
      variability: 0.25,
      transactionTypes: ['usage', 'restock']
    }
  }

  // Office/Front Desk items - moderate usage
  if (category === 'Office' || category === 'Front Desk') {
    if (itemName.toLowerCase().includes('paper') || itemName.toLowerCase().includes('pens')) {
      return {
        baseDailyUsage: 5,
        weekendMultiplier: 0.3,
        restockFrequency: 10,
        restockQuantity: 50,
        variability: 0.4,
        transactionTypes: ['usage', 'restock']
      }
    }
    return {
      baseDailyUsage: 3,
      weekendMultiplier: 0.5,
        restockFrequency: 12,
      restockQuantity: 30,
      variability: 0.3,
      transactionTypes: ['usage', 'restock']
    }
  }

  // Maintenance items - low usage, occasional
  if (category === 'Maintenance') {
    if (itemName.toLowerCase().includes('batteries') || itemName.toLowerCase().includes('bulbs')) {
      return {
        baseDailyUsage: 2,
        weekendMultiplier: 0.8,
        restockFrequency: 15,
        restockQuantity: 20,
        variability: 0.6,
        transactionTypes: ['usage', 'restock']
      }
    }
    return {
      baseDailyUsage: 1,
      weekendMultiplier: 0.7,
      restockFrequency: 20,
      restockQuantity: 10,
      variability: 0.5,
      transactionTypes: ['usage', 'restock']
    }
  }

  // Default pattern
  return {
    baseDailyUsage: 3,
    weekendMultiplier: 1.0,
    restockFrequency: 7,
    restockQuantity: 25,
    variability: 0.3,
    transactionTypes: ['usage', 'restock']
  }
}

function generateRandomUsage(baseUsage: number, variability: number, isWeekend: boolean, weekendMultiplier: number): number {
  const variation = (Math.random() - 0.5) * 2 * variability
  const weekendFactor = isWeekend ? weekendMultiplier : 1.0
  const usage = Math.max(1, Math.round(baseUsage * weekendFactor * (1 + variation)))
  return usage
}

function shouldRestock(dayCount: number, restockFrequency: number): boolean {
  return dayCount % restockFrequency === 0
}

async function seedHistoricalTransactions() {
  const supabase = createClient(await cookies())

  console.log('Starting historical transaction seeding...')

  // Check if data already exists
  const { data: existingTransactions } = await supabase
    .from('inventory_transactions')
    .select('id')
    .limit(1)

  if (existingTransactions && existingTransactions.length > 0) {
    console.log('Historical transaction data already exists. Skipping seeding.')
    return
  }

  // Get all inventory items
  const { data: items, error: itemsError } = await supabase
    .from('inventory_items')
    .select('*')

  if (itemsError || !items) {
    console.error('Error fetching inventory items:', itemsError)
    return
  }

  console.log(`Found ${items.length} inventory items`)

  const transactions = []
  const today = new Date()

  // Generate 30 days of transactions
  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const transactionDate = new Date(today)
    transactionDate.setDate(today.getDate() - dayOffset)
    const dayOfWeek = transactionDate.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // Sunday = 0, Saturday = 6

    for (const item of items as InventoryItem[]) {
      const pattern = getTransactionPattern(item.category, item.name)

      // Generate usage transaction
      const usage = generateRandomUsage(pattern.baseDailyUsage, pattern.variability, isWeekend, pattern.weekendMultiplier)

      transactions.push({
        item_id: item.id,
        transaction_type: 'usage',
        quantity: usage,
        unit_cost: item.unit_cost,
        total_cost: usage * item.unit_cost,
        notes: `Daily consumption - ${transactionDate.toLocaleDateString()}`,
        transaction_date: transactionDate.toISOString()
      })

      // Generate restock transaction if needed
      if (shouldRestock(30 - dayOffset, pattern.restockFrequency)) {
        const restockQuantity = Math.round(pattern.restockQuantity * (0.8 + Math.random() * 0.4)) // ±20% variation

        transactions.push({
          item_id: item.id,
          transaction_type: 'restock',
          quantity: restockQuantity,
          unit_cost: item.unit_cost,
          total_cost: restockQuantity * item.unit_cost,
          reference_number: `RESTOCK-${transactionDate.toISOString().split('T')[0]}-${item.id.slice(0, 8)}`,
          notes: `Scheduled restock - ${transactionDate.toLocaleDateString()}`,
          transaction_date: transactionDate.toISOString()
        })
      }

      // Occasional random events (5% chance per day per item)
      if (Math.random() < 0.05) {
        const eventTypes = ['deduction', 'adjustment', 'transfer']
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
        const eventQuantity = Math.max(1, Math.round(usage * 0.1 * (Math.random() + 0.5)))

        let quantity = eventQuantity
        let notes = ''

        switch (eventType) {
          case 'deduction':
            quantity = -eventQuantity // Negative for deductions
            notes = `Damaged/spoiled items - ${transactionDate.toLocaleDateString()}`
            break
          case 'adjustment':
            quantity = Math.random() > 0.5 ? eventQuantity : -eventQuantity
            notes = `Inventory adjustment - ${transactionDate.toLocaleDateString()}`
            break
          case 'transfer':
            quantity = -eventQuantity // Negative for transfers out
            notes = `Transferred to another location - ${transactionDate.toLocaleDateString()}`
            break
        }

        transactions.push({
          item_id: item.id,
          transaction_type: eventType,
          quantity: quantity,
          unit_cost: item.unit_cost,
          total_cost: Math.abs(quantity) * item.unit_cost,
          notes: notes,
          transaction_date: transactionDate.toISOString()
        })
      }
    }
  }

  console.log(`Generated ${transactions.length} transactions`)

  // Insert transactions in batches to avoid timeout
  const batchSize = 1000
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize)
    const { error: insertError } = await supabase
      .from('inventory_transactions')
      .insert(batch)

    if (insertError) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError)
      return
    }

    console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(transactions.length / batchSize)}`)
  }

  console.log('Historical transaction seeding completed successfully!')
}

// Run the seeding function
seedHistoricalTransactions().catch(console.error)</content>
<parameter name="filePath">d:\downloads\inventory-management-system\scripts\seed-historical-transactions.ts