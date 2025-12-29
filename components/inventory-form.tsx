"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

type InventoryFormProps = {
  mode: "create" | "edit"
  item?: any
}

const CATEGORIES = ["Housekeeping", "Food & Beverage", "Front Desk", "Office", "Maintenance", "Other"]
const UNITS = [
  "pieces",
  "boxes",
  "bottles",
  "rolls",
  "gallons",
  "lbs",
  "dozen",
  "bags",
  "reams",
  "cartridges",
  "filters",
  "bulbs",
  "batteries",
]

export function InventoryForm({ mode, item }: InventoryFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: item?.name || "",
    category: item?.category || "",
    quantity: item?.quantity?.toString() || "",
    unit: item?.unit || "",
    reorder_point: item?.reorder_point?.toString() || "",
    reorder_quantity: item?.reorder_quantity?.toString() || "",
    unit_cost: item?.unit_cost?.toString() || "",
    supplier: item?.supplier || "",
    location: item?.location || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validation
    if (!formData.name || !formData.category || !formData.unit) {
      setError("Please fill in all required fields")
      setLoading(false)
      return
    }

    const data = {
      name: formData.name,
      category: formData.category,
      quantity: Number.parseInt(formData.quantity) || 0,
      unit: formData.unit,
      reorder_point: Number.parseInt(formData.reorder_point) || 0,
      reorder_quantity: Number.parseInt(formData.reorder_quantity) || 0,
      unit_cost: Number.parseFloat(formData.unit_cost) || 0,
      supplier: formData.supplier || null,
      location: formData.location || null,
    }

    if (mode === "create") {
      const { error: insertError } = await supabase.from("inventory_items").insert(data)

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }
    } else {
      const { error: updateError } = await supabase.from("inventory_items").update(data).eq("id", item.id)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    router.push("/inventory")
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "New Item Details" : "Edit Item Details"}</CardTitle>
        <CardDescription>
          {mode === "create"
            ? "Enter the details for the new inventory item"
            : "Update the details for this inventory item"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Item Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Bath Towels"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Current Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">
                Unit <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_point">Reorder Point</Label>
              <Input
                id="reorder_point"
                type="number"
                min="0"
                value={formData.reorder_point}
                onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
                placeholder="e.g., 50"
              />
              <p className="text-xs text-muted-foreground">Alert when stock falls below this level</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_quantity">Reorder Quantity</Label>
              <Input
                id="reorder_quantity"
                type="number"
                min="0"
                value={formData.reorder_quantity}
                onChange={(e) => setFormData({ ...formData, reorder_quantity: e.target.value })}
                placeholder="e.g., 100"
              />
              <p className="text-xs text-muted-foreground">Suggested quantity to order</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_cost">Unit Cost (NPR)</Label>
              <Input
                id="unit_cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                placeholder="e.g., 950.00"
              />
              <p className="text-xs text-muted-foreground">Cost per unit in Nepalese Rupees</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="e.g., Hotel Linens Inc"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location">Storage Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Housekeeping Storage"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Link href="/inventory">
              <Button type="button" variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : mode === "create" ? "Add Item" : "Update Item"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
