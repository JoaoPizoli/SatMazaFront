"use client"

import { type ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const { isLoading, isAuthenticated } = useAuth()

  // Enquanto carrega, mostra skeleton
  if (isLoading) {
    return (
      <div className="flex h-svh items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    )
  }

  // Se não autenticado, não renderiza (o AuthContext redireciona para /login)
  if (!isAuthenticated) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex flex-1 flex-col overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
