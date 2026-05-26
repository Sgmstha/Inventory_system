import { getServerAuth } from "@/lib/utils/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { NavHeader } from "@/components/nav-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CostAnalysis } from "@/components/cost-analysis"
import { CostDistributionChart } from "@/components/charts/cost-distribution-chart"
import { CategoryBreakdown } from "@/components/category-breakdown"
import { TopUsedItems } from "@/components/top-used-items"
import { DailyUsageChart } from "@/components/charts/daily-usage-chart"
import { CategoryConsumptionChart } from "@/components/charts/category-consumption-chart"
import { ExportReportButton } from "@/components/export-report-button"
import { formatNPR } from "@/lib/utils"

export default async function MonthlyReportsPage() {
  const cookieStore = await cookies()
  const { supabase, data: { user } } = await getServerAuth(cookieStore)

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()
  const userRole = profile?.role || "staff"

  if (userRole !== "admin") {
    redirect("/dashboard")
  }

  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const startDateString = startDate.toISOString().split("T")[0]

  // Get usage history with item costs and categories for all time
  const { data: usageWithCosts } = await supabase
    .from("usage_history")
    .select(
      `
      quantity_used,
      date,
      item:inventory_items(unit_cost, name, category)
    `,
    )
    .order("date", { ascending: true })

  // Aggregate by month
  const monthlyData = new Map<string, { usage: number; cost: number }>()
  const dailyUsageMap = new Map<string, number>()
  const categoryUsageMap = new Map<string, number>()

  usageWithCosts?.forEach((record: any) => {
    if (!record.item) return

    const date = new Date(record.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    const cost = record.quantity_used * record.item.unit_cost
    const current = monthlyData.get(monthKey) || { usage: 0, cost: 0 }
    monthlyData.set(monthKey, {
      usage: current.usage + record.quantity_used,
      cost: current.cost + cost,
    })

    if (record.date >= startDateString) {
      dailyUsageMap.set(record.date, (dailyUsageMap.get(record.date) || 0) + record.quantity_used)
      categoryUsageMap.set(record.item.category, (categoryUsageMap.get(record.item.category) || 0) + record.quantity_used)
    }
  })

  const itemCostMap = new Map<string, number>()

  usageWithCosts?.forEach((record: any) => {
    if (record.item) {
      const cost = record.quantity_used * record.item.unit_cost
      itemCostMap.set(record.item.name, (itemCostMap.get(record.item.name) || 0) + cost)
    }
  })

  const topCosts = Array.from(itemCostMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }))

  const dailyUsage = [] as Array<{ date: string; total: number }>
  for (let i = 0; i < 30; i += 1) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dateKey = date.toISOString().split("T")[0]
    dailyUsage.push({ date: dateKey, total: dailyUsageMap.get(dateKey) || 0 })
  }

  const categoryConsumption = Array.from(categoryUsageMap.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)

  const monthlyReports = Array.from(monthlyData.entries())
    .sort((a, b) => b[0].localeCompare(a[0])) // Most recent first
    .map(([month, data]) => ({
      month,
      usage: data.usage,
      cost: data.cost,
    }))

  return (
    <div className="min-h-screen bg-background">
      <NavHeader userEmail={user.email!} activePage="monthly-reports" />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Monthly Reports</h2>
            <p className="text-muted-foreground">Historical usage and cost data by month</p>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Monthly Usage & Costs</CardTitle>
                <CardDescription>
                  Breakdown of item usage and associated costs for each month
                </CardDescription>
              </div>
              <ExportReportButton rows={monthlyReports} />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Total Usage (items)</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyReports.map((report) => (
                    <TableRow key={report.month}>
                      <TableCell className="font-medium">
                        {new Date(report.month + '-01').toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                        })}
                      </TableCell>
                      <TableCell className="text-right">{report.usage}</TableCell>
                      <TableCell className="text-right">{formatNPR(report.cost)}</TableCell>
                    </TableRow>
                  ))}
                  {monthlyReports.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No usage data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <DailyUsageChart data={dailyUsage} />
            <CategoryConsumptionChart categories={categoryConsumption} />
          </div>

          <CategoryBreakdown />
          <TopUsedItems />

          <div className="grid gap-6 xl:grid-cols-2">
            <CostAnalysis />
            <CostDistributionChart costs={topCosts} />
          </div>
        </div>
      </main>
    </div>
  )
}