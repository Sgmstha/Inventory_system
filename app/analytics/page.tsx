import { createClient } from "@/lib/utils/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { NavHeader } from "@/components/nav-header"
import { CategoryBreakdown } from "@/components/category-breakdown"
import { TopUsedItems } from "@/components/top-used-items"
import { CostAnalysis } from "@/components/cost-analysis"
import { RestockEngineTrigger } from "@/components/restock-engine-trigger"
import { RestockRecommendations } from "@/components/restock-recommendations"
import { RestockAlgorithmExplainer } from "@/components/restock-algorithm-explainer"

export default async function AnalyticsPage() {
  const supabase = createClient(await cookies())

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader userEmail={user.email!} activePage="analytics" />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Analytics & Smart Recommendations</h2>
            <p className="text-muted-foreground">AI-powered insights and consumption-based restock recommendations</p>
          </div>

          <RestockEngineTrigger />
          <RestockRecommendations />
          <RestockAlgorithmExplainer />

          <div className="grid gap-6 md:grid-cols-2">
            <CategoryBreakdown />
            <CostAnalysis />
          </div>

          <TopUsedItems />
        </div>
      </main>
    </div>
  )
}
