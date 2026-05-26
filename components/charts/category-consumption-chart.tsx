"use client"

import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

type CategoryConsumptionChartProps = {
  categories: Array<{ category: string; total: number }>
}

export function CategoryConsumptionChart({ categories }: CategoryConsumptionChartProps) {
  const labels = categories.map((item) => item.category)
  const values = categories.map((item) => item.total)

  const chartData = {
    labels,
    datasets: [
      {
        label: "Category Consumption",
        data: values,
        backgroundColor: [
          "#2563eb",
          "#16a34a",
          "#ea580c",
          "#8b5cf6",
          "#ec4899",
          "#0ea5e9",
        ],
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
          <p className="text-sm font-medium">Category Consumption</p>
          <p className="text-xs text-muted-foreground">Usage volume by category</p>
        </div>
      </div>
      <Bar data={chartData} options={options} />
    </div>
  )
}
