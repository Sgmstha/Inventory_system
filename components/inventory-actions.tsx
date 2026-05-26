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
import { createClient } from "@/lib/utils/supabase/client"
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
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async () => {
    const supabase = createClient()
    setLoading(true)
    setError("")
    const qty = Number.parseInt(quantity)
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid quantity greater than 0")
      setLoading(false)
      return
    }

    let currentQuantity = item.quantity

    if (action === "remove") {
      const { data, error: fetchError } = await supabase
        .from("inventory_items")
        .select("quantity")
        .eq("id", item.id)
        .single()

      if (fetchError || !data) {
        setError("Unable to verify current stock. Please try again.")
        setLoading(false)
        return
      }

      currentQuantity = Math.max(0, data.quantity)
      if (currentQuantity <= 0) {
        setError("Cannot record usage because there is no stock available.")
        setLoading(false)
        return
      }

      if (qty > currentQuantity) {
        setError(
          `Cannot record usage of ${qty} ${item.unit}. Only ${currentQuantity} ${item.unit} available in stock.`
        )
        setLoading(false)
        return
      }
    }

    let dbError = null

    if (action === "add") {
      const { error } = await supabase.from("restock_history").insert({
        item_id: item.id,
        quantity: qty,
        restocked_at: new Date().toISOString(),
        notes: notes || null,
      })

      dbError = error
      if (error) {
        console.error("[inventory] Restock error:", error)
        setError("Failed to record restock. Please try again.")
      }
    } else {
      const { error } = await supabase.from("usage_history").insert({
        item_id: item.id,
        quantity_used: qty,
        date: new Date().toISOString().split("T")[0],
        notes: notes || null,
      })

      dbError = error
      if (error) {
        console.error("[inventory] Usage error:", error)
        setError("Failed to record usage. Please try again.")
      }
    }

    if (!dbError) {
      setOpen(false)
      setQuantity("")
      setNotes("")
      router.refresh()
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    setLoading(true)
    const supabase = createClient()
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
      <Dialog open={open} onOpenChange={(open) => {
        setOpen(open)
        if (!open) {
          setError("")
          setQuantity("")
          setNotes("")
        }
      }}>
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
                  setError("")
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
                  setError("")
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
              Current quantity: {Math.max(0, item.quantity)} {item.unit}
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
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {error}
              </div>
            )}
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
