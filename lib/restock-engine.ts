import { createClient } from "@/lib/utils/supabase/server"
import { cookies } from "next/headers"

type CookieStore = Awaited<ReturnType<typeof cookies>>

type UsageRecord = {
  date: string
  quantity_used: number
}

type DailyUsagePoint = {
  date: string
  quantity: number
}

type PredictionConfidence = "INSUFFICIENT DATA" | "LOW" | "MEDIUM" | "HIGH"

type UsagePattern = {
  itemId: string
  itemName: string
  category: string
  currentQuantity: number
  unit: string
  reorderPoint: number
  reorderQuantity: number
  leadTimeDays: number
  avgDailyUsage: number
  safetyStock: number
  reorderLevel: number
  dynamicReorderPoint: number
  usageHistory: DailyUsagePoint[]
  daysUntilStockout: number
  predictedStockoutDate: string | null
  canPredictStockout: boolean
  predictionConfidence: PredictionConfidence
  totalTransactions: number
  uniqueDaysWithData: number
}

function hasSufficientHistory(uniqueDaysWithData: number) {
  return uniqueDaysWithData >= 14
}

function determinePredictionConfidence(uniqueDaysWithData: number): PredictionConfidence {
  if (uniqueDaysWithData >= 30) return "HIGH"
  if (uniqueDaysWithData >= 21) return "MEDIUM"
  if (uniqueDaysWithData >= 14) return "LOW"
  return "INSUFFICIENT DATA"
}

async function hasRestockRecommendationColumns(supabase: ReturnType<typeof createClient>, columns: string[]) {
  const { data, error } = await supabase
    .from("information_schema.columns")
    .select("column_name")
    .eq("table_name", "restock_recommendations")
    .eq("table_schema", "public")
    .in("column_name", columns)

  return !error && Array.isArray(data) && data.length === columns.length
}

function calculateAverageDailyUsage(dailyUsage: DailyUsagePoint[]) {
  return calculateWeightedMovingAverage(dailyUsage.map((point) => point.quantity))
}

function predictStockoutDate(quantity: number, avgDailyUsage: number) {
  if (quantity <= 0 || avgDailyUsage <= 0) {
    return { daysUntilStockout: Number.POSITIVE_INFINITY, predictedStockoutDate: null }
  }

  const rawDaysUntilStockout = quantity / avgDailyUsage
  if (!Number.isFinite(rawDaysUntilStockout) || rawDaysUntilStockout <= 0) {
    return { daysUntilStockout: Number.POSITIVE_INFINITY, predictedStockoutDate: null }
  }

  // Round up to a conservative whole-day estimate so the UI never presents
  // a near-zero prediction as if it were a precise same-day event.
  const daysUntilStockout = Math.max(1, Math.ceil(rawDaysUntilStockout))

  const predictedStockoutDate = new Date(Date.now() + daysUntilStockout * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]

  return { daysUntilStockout, predictedStockoutDate }
}

function createDailyUsagePoints(records: UsageRecord[], days = 30) {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - days + 1)

  const dailyMap = new Map<string, number>()
  records.forEach((record) => {
    const key = record.date
    dailyMap.set(key, (dailyMap.get(key) || 0) + record.quantity_used)
  })

  const points: DailyUsagePoint[] = []
  for (let i = 0; i < days; i += 1) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const key = date.toISOString().split("T")[0]
    points.push({ date: key, quantity: dailyMap.get(key) || 0 })
  }

  return points
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

function calculateWeightedMovingAverage(values: number[]) {
  if (values.length === 0) return 0

  const weights = values.map((_, index) => index + 1)
  const weightedSum = values.reduce((sum, value, index) => sum + value * weights[index], 0)
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)

  return weightedSum / Math.max(totalWeight, 1)
}

function calculateStdDev(values: number[]) {
  if (values.length === 0) return 0

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length

  return Math.sqrt(variance)
}

function calculateRecentTrend(usageHistory: DailyUsagePoint[]): number {
  if (usageHistory.length < 14) return 0

  const recent = usageHistory.slice(-14)
  const earlier = usageHistory.slice(-28, -14)

  if (earlier.length === 0) return 0

  const recentAvg = recent.reduce((sum, point) => sum + point.quantity, 0) / recent.length
  const earlierAvg = earlier.reduce((sum, point) => sum + point.quantity, 0) / earlier.length

  if (earlierAvg === 0) return recentAvg > 0 ? 1 : 0

  return (recentAvg - earlierAvg) / earlierAvg
}

function calculateSafetyStock(avgDailyUsage: number, leadTimeDays: number, stdDev: number) {
  // Safety stock based on demand variability or a minimum 20% buffer on average usage
  const variabilityStock = stdDev * Math.sqrt(Math.max(leadTimeDays, 1))
  const percentageStock = avgDailyUsage * 0.2
  return Math.max(variabilityStock, percentageStock)
}

function calculateReorderLevel(avgDailyUsage: number, leadTimeDays: number, safetyStock: number) {
  return avgDailyUsage * leadTimeDays + safetyStock
}

export async function analyzeInventory(cookieStore?: CookieStore) {
  const supabase = createClient(cookieStore || (await cookies()))

  const { data: items } = await supabase.from("inventory_items").select("*")
  if (!items) return []

  const patterns: UsagePattern[] = []

  for (const item of items) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const startDateIso = thirtyDaysAgo.toISOString().split("T")[0]

    let dailyUsageMap = new Map<string, number>()
    let totalTransactions = 0

    // Try consuming transaction data first, fallback to usage_history if that table is unavailable
    const { data: transactions, error: transactionsError } = await supabase
      .from("inventory_transactions")
      .select("transaction_type, quantity, transaction_date")
      .eq("item_id", item.id)
      .in("transaction_type", ["usage", "sale", "deduction", "transfer"])
      .gte("transaction_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("transaction_date", { ascending: true })

    if (!transactionsError && transactions) {
      transactions.forEach((transaction: { transaction_date: string; quantity: number }) => {
        const date = new Date(transaction.transaction_date).toISOString().split("T")[0]
        const currentUsage = dailyUsageMap.get(date) || 0
        dailyUsageMap.set(date, currentUsage + Math.abs(transaction.quantity))
      })
      totalTransactions = transactions.length
    } else {
      const { data: usageHistory } = await supabase
        .from("usage_history")
        .select("date, quantity_used")
        .eq("item_id", item.id)
        .gte("date", startDateIso)
        .order("date", { ascending: true })

      if (usageHistory) {
        usageHistory.forEach((record: UsageRecord) => {
          const currentUsage = dailyUsageMap.get(record.date) || 0
          dailyUsageMap.set(record.date, currentUsage + record.quantity_used)
        })
        totalTransactions = usageHistory.length
      }
    }

    const dailyUsage = createDailyUsagePointsFromMap(dailyUsageMap)
    const avgDailyUsage = calculateAverageDailyUsage(dailyUsage)
    const stdDev = calculateStdDev(dailyUsage.map((point) => point.quantity))
    const leadTimeDays = item.lead_time_days ?? 5
    const safetyStock = calculateSafetyStock(avgDailyUsage, leadTimeDays, stdDev)
    const dynamicReorderPoint = Math.ceil(avgDailyUsage * leadTimeDays + safetyStock)
    const reorderLevel = calculateReorderLevel(avgDailyUsage, leadTimeDays, safetyStock)
    const currentReorderPoint = item.reorder_point ?? dynamicReorderPoint

    const uniqueDaysWithData = dailyUsageMap.size
    const predictionConfidence = determinePredictionConfidence(uniqueDaysWithData)
    const canPredictStockout = hasSufficientHistory(uniqueDaysWithData) && avgDailyUsage > 0

    const currentQuantity = Math.max(0, item.quantity)
    const stockoutPrediction = canPredictStockout ? predictStockoutDate(currentQuantity, avgDailyUsage) : { daysUntilStockout: Number.POSITIVE_INFINITY, predictedStockoutDate: null }

    patterns.push({
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      currentQuantity,
      unit: item.unit,
      reorderPoint: currentReorderPoint,
      reorderQuantity: item.reorder_quantity,
      leadTimeDays,
      avgDailyUsage,
      safetyStock,
      reorderLevel,
      dynamicReorderPoint,
      usageHistory: dailyUsage,
      daysUntilStockout: stockoutPrediction.daysUntilStockout,
      predictedStockoutDate: stockoutPrediction.predictedStockoutDate,
      canPredictStockout,
      predictionConfidence,
      totalTransactions,
      uniqueDaysWithData,
    })
  }

  return patterns
}

export async function generateRecommendations(cookieStore?: CookieStore) {
  const finalCookies = cookieStore || (await cookies())
  const patterns = await analyzeInventory(finalCookies)
  const supabase = createClient(finalCookies)

  const deleteResult = await supabase.from("restock_recommendations").delete().eq("status", "pending")
  if (deleteResult.error) {
    throw deleteResult.error
  }

  const recommendations = []

  for (const pattern of patterns) {
    let urgency: "low" | "medium" | "high" | "critical" = "low"
    let reason = ""
    let recommendedQuantity = Math.max(pattern.reorderQuantity, 1)
    let dynamicReorderPoint = pattern.dynamicReorderPoint
    let recommendedReorderQuantity = Math.max(pattern.reorderQuantity, 1)
    const hasPrediction = pattern.canPredictStockout && pattern.predictedStockoutDate !== null
    const hasSufficientData = pattern.uniqueDaysWithData >= 14 && pattern.totalTransactions >= 10

    // Determine urgency and reason based on data availability and predictions
    if (pattern.currentQuantity <= 0) {
      urgency = "critical"
      reason = "Out of stock - immediate restocking required"
    } else if (hasPrediction && pattern.daysUntilStockout <= 3) {
      urgency = "critical"
      reason = "Stockout predicted within 3 days"
    } else if (hasPrediction && pattern.daysUntilStockout <= 7) {
      urgency = "high"
      reason = "Stockout predicted within 1 week"
    } else if (pattern.currentQuantity < pattern.reorderPoint) {
      urgency = "high"
      reason = "Below manual reorder point"
    } else if (hasPrediction && pattern.daysUntilStockout <= 14) {
      urgency = "medium"
      reason = "Stockout predicted within 2 weeks"
    } else if (hasSufficientData) {
      // Only generate recommendations for items with sufficient data
      if (hasPrediction && pattern.daysUntilStockout <= 30) {
        urgency = "low"
        reason = "Stockout predicted within 30 days"
      } else {
        continue // No recommendation needed
      }
    } else {
      // For items with insufficient data, only recommend if below manual reorder point
      if (pattern.currentQuantity < pattern.reorderPoint) {
        urgency = "medium"
        reason = "Limited historical data available - using manual reorder settings"
        recommendedQuantity = Math.max(pattern.reorderQuantity, 1)
        recommendedReorderQuantity = Math.max(pattern.reorderQuantity, 1)
        dynamicReorderPoint = pattern.reorderPoint
      } else {
        continue // Don't recommend if above reorder point and insufficient data
      }
    }

    // Dynamic reorder calculation when sufficient data exists
    if (hasSufficientData && pattern.avgDailyUsage > 0) {
      dynamicReorderPoint = Math.ceil(pattern.avgDailyUsage * pattern.leadTimeDays + pattern.safetyStock)
      const calculatedRecommendedReorderQuantity = Math.ceil(
        pattern.avgDailyUsage * (pattern.leadTimeDays + 14) + pattern.safetyStock - pattern.currentQuantity,
      )

      recommendedReorderQuantity = Math.max(calculatedRecommendedReorderQuantity, pattern.reorderQuantity, 1)

      // Cap at reasonable maximum (prevent unrealistic orders)
      const maxReorder = Math.ceil(pattern.avgDailyUsage * 60) // Max 60 days worth
      recommendedReorderQuantity = Math.min(recommendedReorderQuantity, maxReorder)
      recommendedQuantity = Math.max(recommendedReorderQuantity, pattern.reorderQuantity, 1)

      // Update reason with more context
      if (hasPrediction) {
        const recentTrend = calculateRecentTrend(pattern.usageHistory)
        if (recentTrend > 0.1) {
          reason = "Consumption trend increasing rapidly - based on 30-day analysis"
        } else if (recentTrend < -0.1) {
          reason = "Consumption trend decreasing - based on 30-day analysis"
        } else {
          reason = "Based on 30-day consumption trend"
        }
      }
    }

    // Ensure positive quantity
    recommendedQuantity = Math.max(recommendedQuantity, 1)
    recommendedReorderQuantity = Math.max(recommendedReorderQuantity, 1)

    recommendations.push({
      item_id: pattern.itemId,
      recommended_quantity: recommendedQuantity,
      recommended_reorder_quantity: recommendedReorderQuantity,
      dynamic_reorder_point: dynamicReorderPoint,
      urgency,
      predicted_stockout_date: hasPrediction ? pattern.predictedStockoutDate : null,
      reason,
      prediction_confidence: pattern.predictionConfidence, // Keep internally for potential future use
      status: "pending",
    })
  }

  const supportsDynamicColumns = await hasRestockRecommendationColumns(supabase, [
    "dynamic_reorder_point",
    "recommended_reorder_quantity",
  ])

  if (recommendations.length > 0) {
    const payload = recommendations.map((recommendation) => {
      const baseRow: Record<string, unknown> = {
        item_id: recommendation.item_id,
        recommended_quantity: recommendation.recommended_quantity,
        urgency: recommendation.urgency,
        predicted_stockout_date: recommendation.predicted_stockout_date,
        reason: recommendation.reason,
        prediction_confidence: recommendation.prediction_confidence,
        status: recommendation.status,
      }

      if (supportsDynamicColumns) {
        return {
          ...baseRow,
          dynamic_reorder_point: recommendation.dynamic_reorder_point,
          recommended_reorder_quantity: recommendation.recommended_reorder_quantity,
        }
      }

      return baseRow
    })

    const insertResult = await supabase.from("restock_recommendations").insert(payload)
    if (insertResult.error) {
      throw insertResult.error
    }
  }

  return recommendations
}
