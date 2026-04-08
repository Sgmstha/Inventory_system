import { createClient } from "@/lib/utils/supabase/server"
import { cookies } from "next/headers"

type CookieStore = Awaited<ReturnType<typeof cookies>>

type UsagePattern = {
  itemId: string
  itemName: string
  category: string
  currentQuantity: number
  unit: string
  reorderPoint: number
  reorderQuantity: number
  avgDailyUsage: number
  usageHistory: Array<{ date: string; quantity: number }>
  daysUntilStockout: number
}

export async function analyzeInventory(cookieStore?: CookieStore) {
  const supabase = createClient(cookieStore || await cookies())

  // Get all inventory items
  const { data: items } = await supabase.from("inventory_items").select("*")

  if (!items) return []

  const patterns: UsagePattern[] = []

  // Analyze each item
  for (const item of items) {
    // Get usage history for the last 30 days
    const { data: usageHistory } = await supabase
      .from("usage_history")
      .select("date, quantity_used")
      .eq("item_id", item.id)
      .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .order("date", { ascending: true })

    if (!usageHistory || usageHistory.length === 0) {
      // No usage data, use simple threshold check
      if (item.quantity <= item.reorder_point) {
        patterns.push({
          itemId: item.id,
          itemName: item.name,
          category: item.category,
          currentQuantity: item.quantity,
          unit: item.unit,
          reorderPoint: item.reorder_point,
          reorderQuantity: item.reorder_quantity,
          avgDailyUsage: 0,
          usageHistory: [],
          daysUntilStockout: 0,
        })
      }
      continue
    }

    // Calculate average daily usage
    const totalUsage = usageHistory.reduce((sum, h) => sum + h.quantity_used, 0)
    const avgDailyUsage = totalUsage / 30

    // Calculate days until stockout
    const daysUntilStockout = avgDailyUsage > 0 ? item.quantity / avgDailyUsage : Number.POSITIVE_INFINITY

    patterns.push({
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      currentQuantity: item.quantity,
      unit: item.unit,
      reorderPoint: item.reorder_point,
      reorderQuantity: item.reorder_quantity,
      avgDailyUsage,
      usageHistory: usageHistory.map((h) => ({ date: h.date, quantity: h.quantity_used })),
      daysUntilStockout,
    })
  }

  return patterns
}

export async function generateRecommendations(cookieStore?: CookieStore) {
  const finalCookies = cookieStore || await cookies()
  const patterns = await analyzeInventory(finalCookies)
  const supabase = createClient(finalCookies)

  // Clear old pending recommendations
  await supabase.from("restock_recommendations").delete().eq("status", "pending")

  const recommendations = []

  for (const pattern of patterns) {
    let urgency: "low" | "medium" | "high" | "critical" = "low"
    let reason = ""
    let recommendedQuantity = pattern.reorderQuantity

    // Determine urgency based on days until stockout
    if (pattern.currentQuantity === 0) {
      urgency = "critical"
      reason = "Item is completely out of stock"
      recommendedQuantity = pattern.reorderQuantity * 2 // Order extra for stockout situations
    } else if (pattern.daysUntilStockout <= 3) {
      urgency = "critical"
      reason = `Estimated to run out in ${Math.floor(pattern.daysUntilStockout)} days based on usage patterns`
    } else if (pattern.daysUntilStockout <= 7) {
      urgency = "high"
      reason = `Estimated to run out in ${Math.floor(pattern.daysUntilStockout)} days. Order soon to avoid stockout`
    } else if (pattern.currentQuantity <= pattern.reorderPoint) {
      urgency = "medium"
      reason = `Current stock (${pattern.currentQuantity}) is at or below reorder point (${pattern.reorderPoint})`
    } else if (pattern.daysUntilStockout <= 14) {
      urgency = "low"
      reason = `Stock levels are adequate but consider ordering within 2 weeks`
    } else {
      continue // Skip items with sufficient stock
    }

    // Adjust recommended quantity based on usage patterns
    if (pattern.avgDailyUsage > 0) {
      // Recommend enough to last 30 days plus safety stock
      const optimalQuantity = Math.ceil(pattern.avgDailyUsage * 30 * 1.2)
      recommendedQuantity = Math.max(recommendedQuantity, optimalQuantity)
    }

    const predictedStockoutDate =
      pattern.daysUntilStockout !== Number.POSITIVE_INFINITY && pattern.daysUntilStockout > 0
        ? new Date(Date.now() + pattern.daysUntilStockout * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        : null

    recommendations.push({
      item_id: pattern.itemId,
      recommended_quantity: recommendedQuantity,
      urgency,
      predicted_stockout_date: predictedStockoutDate,
      reason,
      status: "pending",
    })
  }

  // Insert new recommendations
  if (recommendations.length > 0) {
    await supabase.from("restock_recommendations").insert(recommendations)
  }

  return recommendations
}
