import { createClient } from "@/lib/utils/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, TrendingDown, Clock } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InventoryItemWmaDetails } from "@/components/inventory-item-wma"

export async function RestockRecommendations() {
  const supabase = createClient(await cookies())

  const { data: recommendations } = await supabase
    .from("restock_recommendations")
    .select(
      `
      *,
      item:inventory_items(id, name, category, quantity, unit, reorder_point)
    `,
    )
    .eq("status", "pending")

  const sortedRecommendations = (recommendations || []).sort((a: any, b: any) => {
    const rank: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    }

    return (rank[a.urgency] ?? 4) - (rank[b.urgency] ?? 4)
  })

  if (!sortedRecommendations || sortedRecommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-orange-600" />
            <CardTitle>Smart Restock Recommendations</CardTitle>
          </div>
          <CardDescription>AI-generated recommendations based on usage patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-sm text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recommendations available</p>
            <p className="text-xs mt-1">Click "Generate Recommendations" above to analyze inventory</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const urgencyColors = {
    critical: "destructive",
    high: "destructive",
    medium: "default",
    low: "secondary",
  } as const

  const urgencyIcons = {
    critical: "🔴",
    high: "🟠",
    medium: "🟡",
    low: "🟢",
  }

  const formatPredictedStockout = (dateString: string | null) => {
    if (!dateString) {
      return "Forecast unavailable"
    }

    const targetDate = new Date(dateString)
    const today = new Date()
    const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) {
      return "Likely stockout soon"
    }

    if (diffDays === 1) {
      return "About 1 day"
    }

    if (diffDays <= 7) {
      return `About ${diffDays} days`
    }

    const weeks = Math.ceil(diffDays / 7)
    return `About ${weeks} week${weeks === 1 ? "" : "s"}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-orange-600" />
          <CardTitle>Smart Restock Recommendations</CardTitle>
        </div>
        <CardDescription>
          AI-generated recommendations based on consumption patterns and predicted stockout dates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Reorder Point</TableHead>
                <TableHead>Recommended Reorder Quantity</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Predicted Stockout</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRecommendations.map((rec: any) => {
                const itemId = rec.item_id ?? rec.item?.id ?? rec.item?.name
                const itemName = rec.item?.name ?? rec.item_name ?? "Unknown item"
                const currentStock = Math.max(0, Number(rec.item?.quantity ?? rec.quantity) || 0)
                const reorderPoint = Math.max(0, Number(rec.dynamic_reorder_point ?? rec.item?.reorder_point ?? 0) || 0)
                const recommendedQuantity = Math.max(0, Number(rec.recommended_reorder_quantity ?? rec.recommended_quantity) || 0)
                return (
                  <TableRow key={rec.id}>
                    <TableCell className="font-medium">
                      <InventoryItemWmaDetails itemId={itemId} itemName={itemName} />
                    </TableCell>
                    <TableCell>{rec.item?.category ?? rec.category}</TableCell>
                    <TableCell>
                      {currentStock} {rec.item?.unit ?? rec.unit}
                    </TableCell>
                    <TableCell>
                      {reorderPoint} {rec.item?.unit ?? rec.unit}
                    </TableCell>
                    <TableCell className="font-medium text-blue-600">
                      {recommendedQuantity} {rec.item?.unit ?? rec.unit}
                    </TableCell>
                    <TableCell>
                      <Badge variant={urgencyColors[rec.urgency as keyof typeof urgencyColors]}>
                        {urgencyIcons[rec.urgency as keyof typeof urgencyIcons]} {rec.urgency.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {formatPredictedStockout(rec.predicted_stockout_date)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs">{rec.reason}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
