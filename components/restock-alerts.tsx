import { createClient } from "@/lib/utils/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"

export async function RestockAlerts() {
  const supabase = createClient(await cookies())

  const { data: recommendations } = await supabase
    .from("restock_recommendations")
    .select(
      `
      *,
      item:inventory_items(name, category, quantity, unit)
    `,
    )
    .eq("status", "pending")
    .order("urgency", { ascending: false })
    .limit(5)

  if (!recommendations || recommendations.length === 0) {
    return null
  }

  const urgencyColors = {
    critical: "destructive",
    high: "destructive",
    medium: "default",
    low: "secondary",
  } as const

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <CardTitle>Restock Alerts</CardTitle>
        </div>
        <CardDescription>Items that need immediate attention</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec: any) => (
            <div key={rec.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{rec.item.name}</p>
                  <Badge variant={urgencyColors[rec.urgency as keyof typeof urgencyColors]}>{rec.urgency}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Current: {rec.item.quantity} {rec.item.unit} • Recommended: {rec.recommended_quantity} {rec.item.unit}
                </p>
                {rec.reason && <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
