import { getServerAuth } from "@/lib/utils/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { NavHeader } from "@/components/nav-header"
import { RestockEngineTrigger } from "@/components/restock-engine-trigger"
import { RestockRecommendations } from "@/components/restock-recommendations"
import { RestockAlgorithmExplainer } from "@/components/restock-algorithm-explainer"

export default async function AnalyticsPage() {
  const cookieStore = await cookies()
  const { supabase, data: { user } } = await getServerAuth(cookieStore)

  if (!user) {
    redirect("/login")
  }

  let userRole = "staff"
  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()
  userRole = profile?.role || "staff"

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
          <RestockAlgorithmExplainer userRole={userRole} />

        </div>
      </main>
    </div>
  )
}
