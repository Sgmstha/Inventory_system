"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, User, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Role = "admin" | "staff"

export function RoleSelectorCard() {
  const [selectedRole, setSelectedRole] = useState<Role>("staff")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load role from localStorage on mount
    setMounted(true)
    const savedRole = (localStorage.getItem("research_role") as Role) || "staff"
    setSelectedRole(savedRole)
  }, [])

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role)
    localStorage.setItem("research_role", role)
    // Refresh the page to update the NavHeader with new role
    setTimeout(() => {
      window.location.reload()
    }, 300)
  }

  if (!mounted) {
    return (
      <Card className="border-dashed border-amber-200 bg-amber-50 animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            Research Mode: Select User Role
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription>
          <strong>Research Mode Enabled:</strong> Login system is bypassed for testing purposes. The real login system is still available and can be re-enabled.
        </AlertDescription>
      </Alert>
      
      <Card className="border-dashed border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            Research Mode: Select User Role
          </CardTitle>
          <CardDescription>
            Switch between admin and staff roles to test different functionalities. The page will refresh with your new role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap items-center">
            <Button
              variant={selectedRole === "admin" ? "default" : "outline"}
              onClick={() => handleRoleChange("admin")}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Admin Role
            </Button>
            <Button
              variant={selectedRole === "staff" ? "default" : "outline"}
              onClick={() => handleRoleChange("staff")}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Staff Role
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Current role:</span>
              <Badge variant={selectedRole === "admin" ? "default" : "secondary"} className="capitalize">
                {selectedRole === "admin" ? <Shield className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                {selectedRole}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
