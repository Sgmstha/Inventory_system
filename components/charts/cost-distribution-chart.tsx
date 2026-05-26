"use client"

import { Pie } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"

ChartJS.register(ArcElement, Tooltip, Legend)

type CostDistributionChartProps = {
  costs: Array<{ label: string; value: number }>
}

export function CostDistributionChart({ costs }: CostDistributionChartProps) {
  const labels = costs.map((item) => item.label)
  const values = costs.map((item) => item.value)

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          "#1d4ed8",
          "#059669",
          "#ea580c",
          "#8b5cf6",
          "#ec4899",
          "#14b8a6",
        ],
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.label}: Rs. ${context.parsed.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        },
      },
    },
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2 pb-4">
        <div>
          <p className="text-sm font-medium">Cost Distribution</p>
          <p className="text-xs text-muted-foreground">How inventory cost is distributed across top items</p>
        </div>
      </div>
      <Pie data={chartData} options={options} />
    </div>
  )
}
