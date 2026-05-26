import { createClient } from "@/lib/utils/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { InventoryActions } from "@/components/inventory-actions"
import { formatNPR } from "@/lib/utils/currency"

export async function InventoryTable({ isAdmin }: { isAdmin: boolean }) {
  const supabase = createClient(await cookies())

  const { data: items } = await supabase.from("inventory_items").select("*").order("category").order("name")

  const getStockStatus = (quantity: number, reorderPoint: number) => {
    const percentage = (quantity / reorderPoint) * 100
    if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const }
    if (percentage <= 50) return { label: "Critical", variant: "destructive" as const }
    if (percentage <= 100) return { label: "Low", variant: "default" as const }
    return { label: "In Stock", variant: "secondary" as const }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Items</CardTitle>
        <CardDescription>Complete list of all items in stock</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reorder Point</TableHead>
                <TableHead>Unit Cost (NPR)</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((item: any) => {
                const safeQuantity = Math.max(0, item.quantity)
                const status = getStockStatus(safeQuantity, item.reorder_point)
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      {safeQuantity} {item.unit}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.reorder_point} {item.unit}
                    </TableCell>
                    <TableCell>{formatNPR(item.unit_cost)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.location}</TableCell>
                    <TableCell className="text-right">
                      <InventoryActions item={item} isAdmin={isAdmin} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
