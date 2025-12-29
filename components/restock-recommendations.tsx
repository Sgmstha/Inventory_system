import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, TrendingDown, Clock } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export async function RestockRecommendations() {
  const supabase = await createClient()

  const { data: recommendations } = await supabase
    .from("restock_recommendations")
    .select(
      `
      *,
      item:inventory_items(name, category, quantity, unit, reorder_point)
    `,
    )
    .eq("status", "pending")
    .order("urgency", { ascending: false })

  if (!recommendations || recommendations.length === 0) {
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
                <TableHead>Recommended</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Predicted Stockout</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendations.map((rec: any) => (
                <TableRow key={rec.id}>
                  <TableCell className="font-medium">{rec.item.name}</TableCell>
                  <TableCell>{rec.item.category}</TableCell>
                  <TableCell>
                    {rec.item.quantity} {rec.item.unit}
                  </TableCell>
                  <TableCell className="font-medium text-blue-600">
                    {rec.recommended_quantity} {rec.item.unit}
                  </TableCell>
                  <TableCell>
                    <Badge variant={urgencyColors[rec.urgency as keyof typeof urgencyColors]}>
                      {urgencyIcons[rec.urgency as keyof typeof urgencyIcons]} {rec.urgency.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {rec.predicted_stockout_date ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {new Date(rec.predicted_stockout_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs">{rec.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
