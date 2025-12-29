"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

export function RestockEngineTrigger() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ count: number } | null>(null)
  const router = useRouter()

  const handleGenerate = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/restock/generate", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setResult({ count: data.count })
        router.refresh()
      }
    } catch (error) {
      console.error("[inventory] Error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <CardTitle>Smart Restock Engine</CardTitle>
        </div>
        <CardDescription>
          AI-powered analysis of usage patterns to generate intelligent restock recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-dashed p-4 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            The engine analyzes historical usage data, calculates average consumption rates, and predicts stockout dates
            to generate smart recommendations with urgency levels.
          </p>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Recommendations
              </>
            )}
          </Button>
        </div>
        {result && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
            <p className="text-sm font-medium text-green-800">
              Successfully generated {result.count} restock recommendation{result.count !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
