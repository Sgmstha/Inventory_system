import { createClient } from "@/lib/supabase/server"
import { AuthStatus } from "@/components/auth-status"
import { Package, BarChart3, ClipboardList } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type NavHeaderProps = {
  userEmail: string
  activePage: "dashboard" | "inventory" | "analytics"
}

export async function NavHeader({ userEmail, activePage }: NavHeaderProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
            </nav>
          </div>
          <AuthStatus userEmail={userEmail} userRole={userRole} />
        </div>
      </div>
    </header>
  )
}
