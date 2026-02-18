"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { FilePlus, FileText, CheckCircle, Loader2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageTemplate } from "@/components/page-template"
import { useAuth } from "@/contexts/auth-context"
import { useSats } from "@/hooks/use-sats"
import { SATStatus } from "@/types"

export function RepresentanteDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const { sats, isLoading } = useSats({ representanteId: user?.id })

  const abertas = useMemo(() => sats.filter((s) => s.status === SATStatus.PENDENTE), [sats])
  const finalizadas = useMemo(() => sats.filter((s) => s.status === SATStatus.FINALIZADA), [sats])

  if (isLoading) {
    return (
      <PageTemplate title="Dashboard" description="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageTemplate>
    )
  }

  return (
    <PageTemplate
      title="Dashboard"
      description="Acompanhe suas Solicitações de Assistência Técnica"
      actions={
        <Button onClick={() => router.push("/dashboard/nova-sat")}>
          <FilePlus className="mr-2 h-4 w-4" />
          Nova SAT
        </Button>
      }
    >
      {/* Metric Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SATs Abertas</CardTitle>
            <FileText className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{abertas.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando análise da Maza
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{finalizadas.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              SATs concluídas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent SATs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Minhas SATs Recentes</CardTitle>
          <CardDescription>
            Últimas solicitações criadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sats.slice(0, 5).map((sat) => (
              <div
                key={sat.id}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{sat.codigo}</span>
                    <Badge
                      variant={
                        sat.status === SATStatus.PENDENTE
                          ? "destructive"
                          : sat.status === SATStatus.FINALIZADA
                          ? "outline"
                          : "secondary"
                      }
                      className={`text-xs ${
                        sat.status === SATStatus.FINALIZADA
                          ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                          : ""
                      }`}
                    >
                      {sat.status === SATStatus.PENDENTE
                        ? "Pendente"
                        : sat.status === SATStatus.FINALIZADA
                        ? "Finalizada"
                        : "Em andamento"}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {sat.produtos}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {new Date(sat.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageTemplate>
  )
}
