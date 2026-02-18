"use client"

import { useMemo } from "react"
import {
  Inbox,
  CheckCircle,
  TrendingUp,
  TestTubes,
  Loader2,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { PageTemplate } from "@/components/page-template"
import { useSats } from "@/hooks/use-sats"
import { SATStatusLabels, type SAT, SATStatus } from "@/types"

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: {
  title: string
  value: number
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: SATStatus }) {
  const variants: Record<SATStatus, "default" | "secondary" | "destructive" | "outline"> = {
    [SATStatus.PENDENTE]: "destructive",
    [SATStatus.ENVIADO_BAGUA]: "default",
    [SATStatus.ENVIADO_BSOLVENTE]: "default",
    [SATStatus.EM_ANALISE]: "secondary",
    [SATStatus.FINALIZADA]: "outline",
  }

  return <Badge variant={variants[status]}>{SATStatusLabels[status]}</Badge>
}

function SATTable({ sats }: { sats: SAT[] }) {
  if (sats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <CheckCircle className="h-10 w-10 mb-2" />
        <p className="text-sm">Nenhuma SAT encontrada</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-3 pr-4 font-medium text-muted-foreground">Código</th>
            <th className="pb-3 pr-4 font-medium text-muted-foreground">Produto</th>
            <th className="pb-3 pr-4 font-medium text-muted-foreground hidden md:table-cell">Cliente</th>
            <th className="pb-3 pr-4 font-medium text-muted-foreground">Status</th>
            <th className="pb-3 font-medium text-muted-foreground hidden sm:table-cell">Data</th>
          </tr>
        </thead>
        <tbody>
          {sats.map((sat) => (
            <tr key={sat.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
              <td className="py-3 pr-4 font-medium">{sat.codigo}</td>
              <td className="py-3 pr-4">{sat.produtos}</td>
              <td className="py-3 pr-4 max-w-[200px] truncate hidden md:table-cell text-muted-foreground">
                {sat.cliente}
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={sat.status} />
              </td>
              <td className="py-3 hidden sm:table-cell text-muted-foreground">
                {new Date(sat.createdAt).toLocaleDateString("pt-BR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function OrquestradorDashboard() {
  const { sats, isLoading } = useSats()

  const pendentes = useMemo(() => sats.filter((s) => s.status === SATStatus.PENDENTE), [sats])
  const emLaboratorio = useMemo(
    () =>
      sats.filter(
        (s) =>
          s.status === SATStatus.ENVIADO_BAGUA ||
          s.status === SATStatus.ENVIADO_BSOLVENTE ||
          s.status === SATStatus.EM_ANALISE
      ),
    [sats]
  )
  const finalizadas = useMemo(() => sats.filter((s) => s.status === SATStatus.FINALIZADA), [sats])
  const recentes = useMemo(
    () =>
      [...sats]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5),
    [sats]
  )

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
      description="Visão geral do sistema de Solicitações de Assistência Técnica"
    >
      {/* Metric Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="SATs Pendentes"
          value={pendentes.length}
          description="Aguardando envio para laboratório"
          icon={Inbox}
          color="text-amber-500"
        />
        <MetricCard
          title="Em Laboratório"
          value={emLaboratorio.length}
          description="Enviadas e em análise nos laboratórios"
          icon={TestTubes}
          color="text-blue-500"
        />
        <MetricCard
          title="Finalizadas"
          value={finalizadas.length}
          description="SATs concluídas com sucesso"
          icon={CheckCircle}
          color="text-emerald-500"
        />
        <MetricCard
          title="Total"
          value={sats.length}
          description="Total de SATs registradas"
          icon={TrendingUp}
          color="text-primary"
        />
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base">Resumo Geral</CardTitle>
            <CardDescription>
              Total de {sats.length} SATs registradas no sistema
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs with SAT tables */}
      <Tabs defaultValue="recentes" className="w-full">
        <TabsList>
          <TabsTrigger value="recentes">Recentes</TabsTrigger>
          <TabsTrigger value="pendentes">
            Pendentes ({pendentes.length})
          </TabsTrigger>
          <TabsTrigger value="laboratorio">
            Em Laboratório ({emLaboratorio.length})
          </TabsTrigger>
          <TabsTrigger value="finalizadas">
            Finalizadas ({finalizadas.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="recentes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Últimas Atualizações</CardTitle>
              <CardDescription>
                As 5 SATs mais recentemente atualizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SATTable sats={recentes} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pendentes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SATs Pendentes</CardTitle>
              <CardDescription>
                SATs abertas que ainda não foram enviadas para laboratório
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SATTable sats={pendentes} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="laboratorio" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SATs em Laboratório</CardTitle>
              <CardDescription>
                SATs enviadas para laboratório aguardando finalização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SATTable sats={emLaboratorio} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="finalizadas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SATs Finalizadas</CardTitle>
              <CardDescription>
                SATs concluídas com análise finalizada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SATTable sats={finalizadas} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageTemplate>
  )
}
