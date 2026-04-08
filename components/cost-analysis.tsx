import { createClient } from "@/lib/utils/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign } from "lucide-react"
import { formatNPR } from "@/lib/utils"

export async function CostAnalysis() {
  const supabase = createClient(await cookies())

  // Get usage history with item costs
  const { data: usageWithCosts } = await supabase
    .from("usage_history")
    .select(
      `
      quantity_used,
      date,
      item:inventory_items(unit_cost)
    `,
    )
    .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])

  // Calculate total cost by week
  const weeklyCosts = new Map<string, number>()
  usageWithCosts?.forEach((record: any) => {
    if (record.item) {
      const date = new Date(record.date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split("T")[0]

      const cost = record.quantity_used * record.item.unit_cost
      const current = weeklyCosts.get(weekKey) || 0
      weeklyCosts.set(weekKey, current + cost)
    }
  })

  const weeks = Array.from(weeklyCosts.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  const totalCost = weeks.reduce((sum, [, cost]) => sum + cost, 0)
  const avgWeeklyCost = weeks.length > 0 ? totalCost / weeks.length : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <CardTitle>Cost Analysis</CardTitle>
        </div>
        <CardDescription>Weekly consumption costs (last 30 days)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Cost (30 days)</p>
              <p className="text-2xl font-bold">{formatNPR(totalCost)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg Weekly Cost</p>
              <p className="text-2xl font-bold">{formatNPR(avgWeeklyCost)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Weekly Breakdown</p>
            {weeks.map(([weekStart, cost]) => {
              const percentage = (cost / Math.max(...weeks.map(([, c]) => c), 1)) * 100
              const date = new Date(weekStart)
              const weekLabel = date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })

              return (
                <div key={weekStart} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Week of {weekLabel}</span>
                    <span className="text-muted-foreground">{formatNPR(cost)}</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {weeks.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">No cost data available</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
