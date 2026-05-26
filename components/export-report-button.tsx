"use client"

import { Button } from "@/components/ui/button"

type ExportReportButtonProps = {
  rows: Array<{ month: string; usage: number; cost: number }>
}

export function ExportReportButton({ rows }: ExportReportButtonProps) {
  const handleExport = () => {
    const header = ["Month", "Total Usage", "Total Cost (NPR)"]
    const csvRows = rows.map((row) => [row.month, row.usage.toString(), row.cost.toFixed(2)])
    const csvContent = [header, ...csvRows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = "monthly_reports.csv"
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleExport}>
      Export CSV
    </Button>
  )
}
