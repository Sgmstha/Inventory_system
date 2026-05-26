"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

type UsageBreakdownRow = {
  date: string
  quantity: number
  weight: number
  weightedValue: number
}

type WmaDetails = {
  itemId: string
  itemName: string
  dailyUsage: UsageBreakdownRow[]
  weightedSum: number
  totalWeight: number
  weightedAverage: number
  uniqueDaysWithUsage: number
}

export function InventoryItemWmaDetails({ itemId, itemName }: { itemId: string; itemName: string }) {
  const safeItemId = itemId ? String(itemId) : ""
  const [open, setOpen] = useState(false)
  const [details, setDetails] = useState<WmaDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDetails = useCallback(async () => {
    if (!safeItemId) {
      setError("Item ID is invalid")
      return
    }

    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`/api/inventory/wma?itemId=${encodeURIComponent(safeItemId)}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || response.statusText || "Unable to load calculation details")
      }

      const payload = (await response.json()) as WmaDetails
      setDetails(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load calculation details")
    } finally {
      setLoading(false)
    }
  }, [itemId])

  if (!safeItemId) {
    return <span>{itemName}</span>
  }

  return (
    <Dialog open={open} onOpenChange={(value) => {
      setOpen(value)
      if (value && !details && !loading) {
        loadDetails()
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="p-0 text-left">
          {itemName}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Weighted Moving Average for {itemName}</DialogTitle>
          <DialogDescription>
            Exact calculation for the last 30 days of usage, with increasing weights for the most recent days.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[68vh] gap-4 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted/60 scrollbar-track-transparent">
          {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>Loading calculation details…</span>
          </div>
        ) : error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : details ? (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted p-4 text-sm text-muted-foreground">
              <p>
                Weighted moving average = weighted sum ÷ total weight.
              </p>
              <p className="mt-2">
                <strong>Weighted sum:</strong> {details.weightedSum.toFixed(2)}
              </p>
              <p>
                <strong>Total weight:</strong> {details.totalWeight}
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                <strong>Exact WMA:</strong> {details.weightedAverage.toFixed(4)}
              </p>
              <p className="text-xs text-muted-foreground">
                Based on {details.uniqueDaysWithUsage} days with usage over the last 30 days.
              </p>
            </div>

            <div className="overflow-hidden rounded-md border">
              <div className="max-h-[45vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-right">Usage</th>
                      <th className="px-3 py-2 text-right">Weight</th>
                      <th className="px-3 py-2 text-right">Weighted Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {details.dailyUsage.map((row) => (
                      <tr key={row.date}>
                        <td className="px-3 py-2 font-medium">{row.date}</td>
                        <td className="px-3 py-2 text-right">{row.quantity}</td>
                        <td className="px-3 py-2 text-right">{row.weight}</td>
                        <td className="px-3 py-2 text-right">{row.weightedValue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-secondary/20 bg-secondary/5 p-4 text-sm text-muted-foreground">
            No calculation details are available for this item yet.
          </div>
        )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
