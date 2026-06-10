import { getServerAuth } from "@/lib/utils/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { NavHeader } from "@/components/nav-header"
import { InventoryTable } from "@/components/inventory-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function InventoryPage() {
  const cookieStore = await cookies()
  
  // RESEARCH MODE: Direct access without login (commented out auth check)
  // const { supabase, data: { user } } = await getServerAuth(cookieStore)
  // if (!user) {
  //   redirect("/login")
  // }
  // const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()
  // const isAdmin = profile?.role === "admin"
  
  // Demo mode for research
  const userEmail = "research@inventory-system.local"
  const isAdmin = true // Allow admin access in research mode

  return (
    <div className="min-h-screen bg-background">
      <NavHeader userEmail={userEmail} activePage="inventory" isResearchMode={true} userRole="admin" />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
              <p className="text-muted-foreground">Manage all inventory items, record usage, and track stock levels</p>
            </div>
            {isAdmin && (
              <Link href="/inventory/add">
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Item
                </Button>
              </Link>
            )}
          </div>

          <InventoryTable isAdmin={isAdmin} />
        </div>
      </main>
    </div>
  )
}
