import { getServerAuth } from "@/lib/utils/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AuthStatus } from "@/components/auth-status"
import { Package, BarChart3, ClipboardList, Calendar } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type NavHeaderProps = {
  userEmail: string
  activePage: "dashboard" | "inventory" | "analytics" | "monthly-reports"
}

export async function NavHeader({ userEmail, activePage }: NavHeaderProps) {
  const cookieStore = await cookies()
  const { supabase, data: { user } } = await getServerAuth(cookieStore)

  if (!user) {
    redirect("/login")
  }

  let userRole = "staff"
  if (user) {
    const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()
    userRole = profile?.role || "staff"
  }

  return (
    <header className="sticky top-0 z-10 border-b bg-background shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Smart Inventory Management System</h1>
                <p className="text-xs text-muted-foreground">Smart Restock Management</p>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className={activePage === "dashboard" ? "bg-accent" : ""}>
                  Dashboard
                </Button>
              </Link>
              <Link href="/inventory">
                <Button variant="ghost" size="sm" className={activePage === "inventory" ? "bg-accent" : ""}>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Inventory
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="ghost" size="sm" className={activePage === "analytics" ? "bg-accent" : ""}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </Link>
              {userRole === "admin" ? (
                <Link href="/monthly-reports">
                  <Button variant="ghost" size="sm" className={activePage === "monthly-reports" ? "bg-accent" : ""}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Monthly Reports
                  </Button>
                </Link>
              ) : null}
            </nav>
          </div>
          <AuthStatus userEmail={userEmail} userRole={userRole} />
        </div>
      </div>
    </header>
  )
}
