"use client"

import { useAuth } from "@/contexts/auth-context"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { UserRoleLabels } from "@/types"
import { Badge } from "@/components/ui/badge"

export function DashboardHeader() {
  const { user } = useAuth()

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex flex-1 items-center gap-2">
        <h2 className="text-sm font-medium text-muted-foreground hidden sm:block">
          SatMaza
        </h2>
        {user && (
          <Badge variant="secondary" className="hidden sm:inline-flex text-xs">
            {UserRoleLabels[user.tipo]}
          </Badge>
        )}
      </div>
    </header>
  )
}
