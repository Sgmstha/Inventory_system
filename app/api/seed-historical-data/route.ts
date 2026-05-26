import { createClient } from '@/lib/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(await cookies())

    // Get all inventory items
    const { data: items, error: itemsError } = await supabase
      .from('inventory_items')
      .select('*')

    if (itemsError || !items) {
      return NextResponse.json({
        success: false,
        error: 'Error fetching inventory items',
        details: itemsError
      }, { status: 500 })
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    const startDateIso = thirtyDaysAgo.toISOString().split('T')[0]

    const { data: existingUsage, error: existingUsageError } = await supabase
      .from('usage_history')
      .select('item_id, date')
      .gte('date', startDateIso)

    if (existingUsageError) {
      return NextResponse.json({
        success: false,
        error: 'Error checking existing usage history',
        details: existingUsageError
      }, { status: 500 })
    }

    const itemDateMap = new Map<string, Set<string>>()
    existingUsage?.forEach((record: { item_id: string; date: string }) => {
      const set = itemDateMap.get(record.item_id) || new Set<string>()
      set.add(record.date)
      itemDateMap.set(record.item_id, set)
    })

    const usageHistoryRecords: Array<{
      item_id: string
      quantity_used: number
      date: string
      notes: string
    }> = []
    const today = new Date()

    for (const item of items as InventoryItem[]) {
      const existingDates = itemDateMap.get(item.id) || new Set<string>()
      const pattern = getTransactionPattern(item.category, item.name)

      for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
        const recordDate = new Date(today)
        recordDate.setDate(today.getDate() - dayOffset)
        const isoDate = recordDate.toISOString().split('T')[0]

        if (existingDates.has(isoDate)) {
          continue
        }

        const dayOfWeek = recordDate.getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        const usage = generateRandomUsage(pattern.baseDailyUsage, pattern.variability, isWeekend, pattern.weekendMultiplier)
        const noteParts = ['Daily consumption']

        if (isWeekend && pattern.weekendMultiplier > 1) {
          noteParts.push('weekend spike')
        }
        if (Math.random() < 0.08) {
          noteParts.push('random high demand')
        }

        usageHistoryRecords.push({
          item_id: item.id,
          quantity_used: usage,
          date: isoDate,
          notes: noteParts.join(' | ')
        })
      }
    }

    if (usageHistoryRecords.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'All items already have sufficient last-30-day usage history. No seeding performed.'
      })
    }

    const batchSize = 1000
    let insertedCount = 0

    for (let i = 0; i < usageHistoryRecords.length; i += batchSize) {
      const batch = usageHistoryRecords.slice(i, i + batchSize)
      const { error: insertError } = await supabase
        .from('usage_history')
        .insert(batch)

      if (insertError) {
        return NextResponse.json({
          success: false,
          error: `Error inserting batch ${i / batchSize + 1}`,
          details: insertError
        }, { status: 500 })
      }

      insertedCount += batch.length
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${insertedCount} missing usage_history records for ${items.length} items over 30 days`,
      itemsProcessed: items.length,
      recordsInserted: insertedCount
    })

  } catch (error) {
    console.error('Seeding error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error during seeding',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}