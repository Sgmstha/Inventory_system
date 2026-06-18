import { getServerAuth } from "@/lib/utils/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { NavHeader } from "@/components/nav-header"
import { InventoryForm } from "@/components/inventory-form"

export default async function AddInventoryPage() {
  const cookieStore = await cookies()
  
  const { supabase, data: { user } } = await getServerAuth(cookieStore)
  if (!user) {
    redirect("/login")
  }
  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") {
    redirect("/inventory")
  }
  
  const userEmail = user.email || ""

  return (
    <div className="min-h-screen bg-background">
      <NavHeader userEmail={userEmail} activePage="inventory" userRole="admin" />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Add New Inventory Item</h2>
            <p className="text-muted-foreground">Add a new item to your Smart Inventory Management System</p>
          </div>

          <InventoryForm mode="create" />
        </div>
      </main>
    </div>
  )
}
