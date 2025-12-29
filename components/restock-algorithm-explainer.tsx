import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, TrendingUp, AlertCircle, Target } from "lucide-react"

export function RestockAlgorithmExplainer() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <CardTitle>Smart Restock Algorithm Explanation</CardTitle>
        </div>
        <CardDescription>Understanding the consumption-based recommendation engine</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="rounded-lg border p-4 space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Step 1: Usage Pattern Analysis
            </h4>
            <div className="text-sm text-muted-foreground space-y-2 pl-6">
              <p>
                <strong>Data Collection:</strong> The system retrieves historical usage data for the last 30 days from
                the usage_history table
              </p>
              <p>
                <strong>Average Daily Usage Calculation:</strong>
              </p>
              <code className="block bg-secondary p-2 rounded text-xs font-mono">
                Average Daily Usage = Total Usage (30 days) / 30
              </code>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Step 2: Stockout Prediction
            </h4>
            <div className="text-sm text-muted-foreground space-y-2 pl-6">
              <p>
                <strong>Days Until Stockout:</strong> Calculate how long current stock will last
              </p>
              <code className="block bg-secondary p-2 rounded text-xs font-mono">
                Days Until Stockout = Current Quantity / Average Daily Usage
              </code>
              <p>
                <strong>Predicted Stockout Date:</strong> Today + Days Until Stockout
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-red-600" />
              Step 3: Urgency Classification
            </h4>
            <div className="text-sm text-muted-foreground space-y-2 pl-6">
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong className="text-destructive">Critical:</strong> Out of stock OR ≤3 days until stockout
                </li>
                <li>
                  <strong className="text-destructive">High:</strong> 4-7 days until stockout
                </li>
                <li>
                  <strong className="text-orange-600">Medium:</strong> At or below reorder point
                </li>
                <li>
                  <strong className="text-yellow-600">Low:</strong> 8-14 days until stockout
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              Step 4: Recommended Quantity Calculation
            </h4>
            <div className="text-sm text-muted-foreground space-y-2 pl-6">
              <p>
                <strong>Optimal Order Quantity:</strong> Based on consumption patterns
              </p>
              <code className="block bg-secondary p-2 rounded text-xs font-mono">
                Recommended Qty = (Avg Daily Usage × 30 days) × 1.2
              </code>
              <p className="text-xs">
                The 1.2 multiplier adds 20% safety stock to account for unexpected demand spikes or supply delays
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">Key Benefits of This Approach:</p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Data-driven decisions based on actual consumption patterns</li>
              <li>Prevents both overstocking and stockouts</li>
              <li>Prioritizes critical items with urgency levels</li>
              <li>Adapts to seasonal variations and changing usage trends</li>
              <li>Reduces manual inventory management workload</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
