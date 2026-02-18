"use client"

import { useAuth } from "@/contexts/auth-context"
import { UserRole } from "@/types"
import { OrquestradorDashboard } from "@/components/dashboards/orquestrador-dashboard"
import { RepresentanteDashboard } from "@/components/dashboards/representante-dashboard"
import { BaguaDashboard } from "@/components/dashboards/bagua-dashboard"
import { BsolventeDashboard } from "@/components/dashboards/bsolvente-dashboard"

export default function DashboardPage() {
  const { user } = useAuth()

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
    default:
      return null
  }
}
