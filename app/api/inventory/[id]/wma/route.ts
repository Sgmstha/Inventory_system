import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"

type InventoryTransaction = {
  transaction_type: string
  quantity: number
  transaction_date: string
}

type UsageRecord = {
  date: string
  quantity_used: number
}

type DailyUsagePoint = {
  date: string
  quantity: number
}

type UsageBreakdownRow = {
  date: string
  quantity: number
  weight: number
  weightedValue: number
}

type WmaResponse = {
  itemId: string
  itemName: string
  dailyUsage: UsageBreakdownRow[]
  weightedSum: number
  totalWeight: number
  weightedAverage: number
  uniqueDaysWithUsage: number
}

function createDailyUsagePointsFromMap(dailyUsageMap: Map<string, number>, days = 30) {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - days + 1)

  const points: DailyUsagePoint[] = []
  for (let i = 0; i < days; i += 1) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const key = date.toISOString().split("T")[0]
    points.push({ date: key, quantity: dailyUsageMap.get(key) || 0 })
  }

  return points
}

function buildWmaDetails(values: number[], dates: string[]) {
  const weights = values.map((_, index) => index + 1)
  const weightedSum = values.reduce((sum, value, index) => sum + value * weights[index], 0)
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  const weightedAverage = totalWeight > 0 ? weightedSum / totalWeight : 0

  return {
    dailyUsage: values.map((quantity, index) => ({
      date: dates[index],
      quantity,
      weight: weights[index],
      weightedValue: quantity * weights[index],
    })),
    weightedSum,
    totalWeight,
    weightedAverage,
  }
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const rawId = params.id
  const itemId = rawId ? decodeURIComponent(rawId) : ""
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  if (!itemId || itemId === "undefined" || itemId === "null") {
    return NextResponse.json({ error: "Item not found" }, { status: 404 })
  }

  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(itemId)

  let item = null
  let itemError = null

  if (isUuid) {
    const result = await supabase.from("inventory_items").select("id, name").eq("id", itemId).single()
    item = result.data
    itemError = result.error
  }

  if (!item) {
    const result = await supabase
      .from("inventory_items")
      .select("id, name")
      .ilike("name", `%${itemId}%`)
      .limit(1)
      .single()
    item = result.data
    itemError = result.error
  }

  if (itemError || !item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 })
  }

  const thirtyDaysAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const dailyUsageMap = new Map<string, number>()

  const { data: transactions, error: transactionsError } = await supabase
    .from("inventory_transactions")
    .select("transaction_type, quantity, transaction_date")
    .eq("item_id", item.id)
    .in("transaction_type", ["usage", "sale", "deduction", "transfer"])
    .gte("transaction_date", thirtyDaysAgoIso)
    .order("transaction_date", { ascending: true })

  if (!transactionsError && transactions) {
    transactions.forEach((transaction: InventoryTransaction) => {
      const date = new Date(transaction.transaction_date).toISOString().split("T")[0]
      const current = dailyUsageMap.get(date) || 0
      dailyUsageMap.set(date, current + Math.abs(transaction.quantity))
    })
  } else {
    const { data: usageHistory, error: historyError } = await supabase
      .from("usage_history")
      .select("date, quantity_used")
      .eq("item_id", item.id)
      .gte("date", thirtyDaysAgoIso)
      .order("date", { ascending: true })

    if (!historyError && usageHistory) {
      usageHistory.forEach((record: UsageRecord) => {
        const current = dailyUsageMap.get(record.date) || 0
        dailyUsageMap.set(record.date, current + record.quantity_used)
      })
    }
  }

  const dailyUsagePoints = createDailyUsagePointsFromMap(dailyUsageMap)
  const dates = dailyUsagePoints.map((point) => point.date)
  const values = dailyUsagePoints.map((point) => point.quantity)
  const breakdown = buildWmaDetails(values, dates)

  return NextResponse.json({
    itemId,
    itemName: item.name,
    dailyUsage: breakdown.dailyUsage,
    weightedSum: breakdown.weightedSum,
    totalWeight: breakdown.totalWeight,
    weightedAverage: breakdown.weightedAverage,
    uniqueDaysWithUsage: Array.from(dailyUsageMap.values()).filter((qty) => qty > 0).length,
  } as WmaResponse)
}
