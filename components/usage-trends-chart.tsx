import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

export async function UsageTrendsChart() {
  const supabase = await createClient()

  // Get usage data for the last 7 days
  const { data: usageData } = await supabase
    .from("usage_history")
    .select("date, quantity_used")
    .gte("date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
    .order("date", { ascending: true })

  // Aggregate by date
  const dailyTotals = new Map<string, number>()
  usageData?.forEach((record) => {
    const current = dailyTotals.get(record.date) || 0
    dailyTotals.set(record.date, current + record.quantity_used)
  })

  const dates = Array.from(dailyTotals.keys()).sort()
  const values = dates.map((date) => dailyTotals.get(date) || 0)
  const maxValue = Math.max(...values, 1)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <CardTitle>Usage Trends</CardTitle>
        </div>
        <CardDescription>Daily consumption over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dates.map((date, index) => {
            const value = values[index]
            const percentage = (value / maxValue) * 100
            const formattedDate = new Date(date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })

            return (
              <div key={date} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{formattedDate}</span>
                  <span className="text-muted-foreground">{value} items used</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            )
          })}
          {dates.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">No usage data available</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
