import { getServerAuth } from "@/lib/utils/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { NavHeader } from "@/components/nav-header"
import { InventoryForm } from "@/components/inventory-form"

export default async function EditInventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  
  // RESEARCH MODE: Get supabase client but skip auth checks
  const { supabase } = await getServerAuth(cookieStore)

  // Demo mode for research
  const userEmail = "research@inventory-system.local"

  const { id } = await params

  // Fetch item data
  const { data: item } = await supabase.from("inventory_items").select("*").eq("id", id).single()

  if (!item) {
    redirect("/inventory")
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader userEmail={userEmail} activePage="inventory" isResearchMode={true} userRole="admin" />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Edit Inventory Item</h2>
            <p className="text-muted-foreground">Update item details and configuration</p>
          </div>

          <InventoryForm mode="edit" item={item} />
        </div>
      </main>
    </div>
  )
}
