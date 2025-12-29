import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, AlertTriangle, TrendingDown, DollarSign } from "lucide-react"
import { formatNPRCompact } from "@/lib/utils/currency"

export async function DashboardStats() {
  const supabase = await createClient()

  const [{ count: totalItems }, { data: allItems }, { data: recommendations }] = await Promise.all([
    supabase.from("inventory_items").select("*", { count: "exact", head: true }),
    supabase.from("inventory_items").select("*"),
    supabase.from("restock_recommendations").select("*").eq("status", "pending"),
  ])

  const lowStockItems = allItems?.filter((item) => item.quantity < item.reorder_point).length || 0

  const totalValue = allItems?.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0) || 0

  const stats = [
    {
      title: "Total Items",
      value: totalItems || 0,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Low Stock Items",
      value: lowStockItems || 0,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Restock Needed",
      value: recommendations?.length || 0,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Total Inventory Value",
      value: formatNPRCompact(totalValue),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
