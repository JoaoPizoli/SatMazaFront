"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { UserRole } from "@/types"
import { OrquestradorDashboard } from "@/components/dashboards/orquestrador-dashboard"
import { RepresentanteDashboard } from "@/components/dashboards/representante-dashboard"
import { BaguaDashboard } from "@/components/dashboards/bagua-dashboard"
import { BsolventeDashboard } from "@/components/dashboards/bsolvente-dashboard"

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user?.tipo === UserRole.REPRE_ATENDENTE) {
      router.replace("/dashboard/admin")
    }
  }, [user, router])

  if (!user) return null

  switch (user.tipo) {
    case UserRole.ADMIN:
    case UserRole.ORQUESTRADOR:
      return <OrquestradorDashboard />
    case UserRole.REPRESENTANTE:
      return <RepresentanteDashboard />
    case UserRole.BAGUA:
      return <BaguaDashboard />
    case UserRole.BSOLVENTE:
      return <BsolventeDashboard />
    case UserRole.REPRE_ATENDENTE:
      return null // Redireciona para /dashboard/admin
    default:
      return null
  }
}
