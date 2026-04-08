import { createClient } from "@/lib/utils/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame } from "lucide-react"

export async function TopUsedItems() {
  const supabase = createClient(await cookies())

  // Get top 5 most used items in the last 30 days
  const { data: usageData } = await supabase
    .from("usage_history")
    .select(
      `
      quantity_used,
      item:inventory_items(name, category, unit)
    `,
    )
    .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])

  // Aggregate by item
  const itemTotals = new Map<string, { name: string; category: string; unit: string; total: number }>()
  usageData?.forEach((record: any) => {
    if (record.item) {
      const current = itemTotals.get(record.item.name) || { ...record.item, total: 0 }
      current.total += record.quantity_used
      itemTotals.set(record.item.name, current)
    }
  })

  const topItems = Array.from(itemTotals.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const maxTotal = topItems[0]?.total || 1

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-600" />
          <CardTitle>Most Used Items</CardTitle>
        </div>
        <CardDescription>Top 5 items by consumption (last 30 days)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topItems.map((item, index) => {
            const percentage = (item.total / maxTotal) * 100

            return (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">
                    {item.total} {item.unit}
                  </span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-600 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
          {topItems.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">No usage data available</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
