'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function SeedHistoricalData() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSeedData = async () => {
    if (!confirm('This will generate thousands of historical transactions. Continue?')) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/seed-historical-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()

      if (result.success) {
        alert(`✅ ${result.message}\n\nRefresh the page to see updated predictions.`)
      } else {
        alert(`❌ ${result.message || 'Seeding failed'}`)
      }
    } catch (error) {
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seed Historical Transaction Data</CardTitle>
        <CardDescription>Generate 30 days of realistic transaction data for testing predictions</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleSeedData} variant="outline" disabled={isLoading}>
          {isLoading ? 'Generating Data…' : 'Generate Historical Data'}
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          This will create realistic 30-day transaction history for all inventory items to test the prediction system.
        </p>
      </CardContent>
    </Card>
  )
}
