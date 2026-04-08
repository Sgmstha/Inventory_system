import { createClient } from "@/lib/utils/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart } from "lucide-react"
import { formatNPR } from "@/lib/utils"

export async function CategoryBreakdown() {
  const supabase = createClient(await cookies())

  const { data: items } = await supabase.from("inventory_items").select("category, quantity, unit_cost")

  // Calculate value by category
  const categoryValues = new Map<string, number>()
  items?.forEach((item) => {
    const value = item.quantity * item.unit_cost
    const current = categoryValues.get(item.category) || 0
    categoryValues.set(item.category, current + value)
  })

  const categories = Array.from(categoryValues.entries()).sort((a, b) => b[1] - a[1])
  const totalValue = categories.reduce((sum, [, value]) => sum + value, 0)

  const colors = ["bg-blue-600", "bg-green-600", "bg-orange-600", "bg-purple-600", "bg-pink-600", "bg-cyan-600"]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-green-600" />
          <CardTitle>Category Breakdown</CardTitle>
        </div>
        <CardDescription>Inventory value by category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map(([category, value], index) => {
            const percentage = (value / totalValue) * 100

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{category}</span>
                  <span className="text-muted-foreground">{formatNPR(value)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[index % colors.length]} rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">{percentage.toFixed(1)}%</span>
                </div>
              </div>
            )
          })}
          {categories.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">No category data available</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
