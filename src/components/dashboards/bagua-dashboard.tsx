"use client"

import { useMemo } from "react"
import { Inbox, Search, CheckCircle, Droplets, Loader2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageTemplate } from "@/components/page-template"
import { useSats } from "@/hooks/use-sats"
import { SATStatus, SATStatusLabels, SATDestino } from "@/types"

export function BaguaDashboard() {
  const { sats, isLoading } = useSats({ laboratorio: SATDestino.BASE_AGUA })

  const recebidas = useMemo(
    () => sats.filter((s) => s.status === SATStatus.ENVIADO_BAGUA),
    [sats]
  )
  const emAnalise = useMemo(
    () => sats.filter((s) => s.status === SATStatus.EM_ANALISE),
    [sats]
  )
  const finalizadas = useMemo(
    () => sats.filter((s) => s.status === SATStatus.FINALIZADA),
    [sats]
  )

  if (isLoading) {
    return (
      <PageTemplate title="Dashboard — Base Água" description="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageTemplate>
    )
  }

  return (
    <PageTemplate
      title="Dashboard — Base Água"
      description="Gerencie as SATs recebidas para análise"
    >
      {/* Metric Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              SATs Recebidas
            </CardTitle>
            <Inbox className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{recebidas.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando início da análise
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
            <Search className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{emAnalise.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Análise em andamento
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
              Análises concluídas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SATs List */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Droplets className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base">SATs Base Água</CardTitle>
            <CardDescription>
              Todas as SATs direcionadas para o laboratório de Base Água
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {sats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Inbox className="h-10 w-10 mb-2" />
              <p className="text-sm">Nenhuma SAT recebida</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sats.map((sat) => (
                <div
                  key={sat.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{sat.codigo}</span>
                      <Badge
                        variant={
                          sat.status === SATStatus.FINALIZADA
                            ? "outline"
                            : sat.status === SATStatus.EM_ANALISE
                            ? "secondary"
                            : "default"
                        }
                        className="text-xs"
                      >
                        {SATStatusLabels[sat.status]}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {sat.produtos} — {sat.cliente}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {new Date(sat.updatedAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageTemplate>
  )
}
