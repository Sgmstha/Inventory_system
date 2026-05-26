'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Brain, TrendingUp, AlertCircle, Target, X } from "lucide-react"

export function RestockAlgorithmExplainer({ userRole }: { userRole: string }) {
  const [visible, setVisible] = useState(true)

  if (userRole !== "staff") {
    return null
  }

  if (!visible) {
    return null
  }

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle>Smart Restock Algorithm Explanation</CardTitle>
          </div>
          <CardDescription>Understanding the consumption-based recommendation engine</CardDescription>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary/70 hover:text-foreground"
          aria-label="Close explanation"
        >
          <X className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible defaultValue="restock-algorithm">
          <AccordionItem value="restock-algorithm">
            <AccordionTrigger className="font-medium">View algorithm details</AccordionTrigger>
            <AccordionContent>
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
                      Weighted Moving Average = Sum(daily usage × day weight) / Sum(weights)
                    </code>
                    <p className="text-xs text-muted-foreground">
                      More recent usage data is given a higher weight to better reflect current demand.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    Step 2: Stockout Prediction
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-2 pl-6">
                    <p>
                      <strong>Data Requirements:</strong> Predictions require at least 14 days of history and 10 inventory transactions
                    </p>
                    <p>
                      <strong>Days Until Stockout:</strong> Calculate how long current stock will last
                    </p>
                    <code className="block bg-secondary p-2 rounded text-xs font-mono">
                      Days Until Stockout = Current Quantity / Average Daily Usage
                    </code>
                    <p>
                      <strong>Predicted Stockout Date:</strong> Today + Days Until Stockout (only if data requirements met)
                    </p>
                    <p>
                      <strong>Confidence Levels:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><strong>Low:</strong> 14-20 days of data</li>
                      <li><strong>Medium:</strong> 21-29 days of data</li>
                      <li><strong>High:</strong> 30+ days of data</li>
                    </ul>
                    <p className="text-xs text-muted-foreground">
                      If requirements aren't met, displays "Insufficient Data" instead of predictions.
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
                        <strong className="text-destructive">Critical:</strong> Out of stock OR ≤3 days until stockout (only if prediction data available)
                      </li>
                      <li>
                        <strong className="text-destructive">High:</strong> 4-7 days until stockout (only if prediction data available)
                      </li>
                      <li>
                        <strong className="text-orange-600">Medium:</strong> At or below reorder point OR insufficient prediction data
                      </li>
                      <li>
                        <strong className="text-yellow-600">Low:</strong> 8-30 days until stockout (only if prediction data available)
                      </li>
                    </ul>
                    <p className="text-xs text-muted-foreground">
                      Reorder-level warnings still work normally even without prediction data.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-600" />
                    Step 4: Reorder Level & Order Quantity
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-2 pl-6">
                    <p>
                      <strong>Reorder Level Formula:</strong>
                    </p>
                    <code className="block bg-secondary p-2 rounded text-xs font-mono">
                      Reorder Level = (Avg Daily Usage × Lead Time) + Safety Stock
                    </code>
                    <p>
                      <strong>Safety Stock:</strong> Uses demand variability or a 20% buffer, whichever is larger.
                    </p>
                    <code className="block bg-secondary p-2 rounded text-xs font-mono">
                      Safety Stock = max(Avg Daily Usage × 0.2, StdDev × sqrt(Lead Time))
                    </code>
                    <p className="text-xs">
                      Recommended quantity is based on the lead time horizon plus an additional buffer for safe replenishment.
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
