"use client"

import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

type DailyUsageChartProps = {
  data: Array<{ date: string; total: number }>
}

export function DailyUsageChart({ data }: DailyUsageChartProps) {
  const labels = data.map((point) => point.date)
  const values = data.map((point) => point.total)

  const chartData = {
    labels,
    datasets: [
      {
        label: "Daily Usage",
        data: values,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.2)",
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.parsed.y} units`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2 pb-4">
        <div>
          <p className="text-sm font-medium">Daily Usage Trend</p>
          <p className="text-xs text-muted-foreground">Last 30 days of item consumption</p>
        </div>
      </div>
      <Line data={chartData} options={options} />
    </div>
  )
}
