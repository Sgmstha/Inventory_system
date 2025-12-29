"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoreHorizontal, Plus, Minus, Edit, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type Item = {
  id: string
  name: string
  quantity: number
  unit: string
}

export function InventoryActions({ item, isAdmin }: { item: Item; isAdmin: boolean }) {
  const [open, setOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [action, setAction] = useState<"add" | "remove">("add")
  const [quantity, setQuantity] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async () => {
    setLoading(true)
    const qty = Number.parseInt(quantity)
    if (isNaN(qty) || qty <= 0) {
      setLoading(false)
      return
    }

    if (action === "add") {
      const { error } = await supabase.from("restock_history").insert({
        item_id: item.id,
        quantity: qty,
        restocked_at: new Date().toISOString(),
        notes: notes || null,
      })

      if (error) {
        console.error("[inventory] Restock error:", error)
      }
    } else {
      const { error } = await supabase.from("usage_history").insert({
        item_id: item.id,
        quantity_used: qty,
        date: new Date().toISOString().split("T")[0],
        notes: notes || null,
      })

      if (error) {
        console.error("[inventory] Usage error:", error)
      }
    }

    setLoading(false)
    setOpen(false)
    setQuantity("")
    setNotes("")
    router.refresh()
  }

  const handleDelete = async () => {
    setLoading(true)
    const { error } = await supabase.from("inventory_items").delete().eq("id", item.id)

    if (error) {
      console.error("[inventory] Delete error:", error)
    }

    setLoading(false)
    setDeleteOpen(false)
    router.refresh()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={() => {
                  setAction("add")
                  setOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Stock (Restock)
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={() => {
                  setAction("remove")
                  setOpen(true)
                }}
              >
                <Minus className="h-4 w-4 mr-2" />
                Record Usage
              </DropdownMenuItem>
            </DialogTrigger>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push(`/inventory/edit/${item.id}`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Item
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onSelect={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Item
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "add" ? "Add Stock (Restock)" : "Record Usage"} - {item.name}
            </DialogTitle>
            <DialogDescription>
              Current quantity: {item.quantity} {item.unit}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity ({item.unit})</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={action === "add" ? "e.g., Supplier: ABC Company" : "e.g., Used for Room 205"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{item.name}"? This action cannot be undone and will remove all associated
              usage and restock history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
