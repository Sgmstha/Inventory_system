import { getServerAuth } from "@/lib/utils/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { NavHeader } from "@/components/nav-header"
import { DashboardStats } from "@/components/dashboard-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UsageTrendsChart } from "@/components/usage-trends-chart"

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const { supabase, data: { user } } = await getServerAuth(cookieStore)

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader userEmail={user.email!} activePage="dashboard" />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
            <p className="text-muted-foreground">Quick overview of your inventory status and alerts</p>
          </div>

          <DashboardStats />

          <Card>
            <CardHeader>
              <CardTitle>Usage Trends (Last 30 Days)</CardTitle>
              <CardDescription>Daily consumption patterns across all categories</CardDescription>
            </CardHeader>
            <CardContent>
              <UsageTrendsChart />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
