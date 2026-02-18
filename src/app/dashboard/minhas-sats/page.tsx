"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { PageTemplate } from "@/components/page-template"
import { SatListTable } from "@/components/sat-list-table"
import { SatDetailDialog } from "@/components/sat-detail-dialog"
import { useAuth } from "@/contexts/auth-context"
import { useSats } from "@/hooks/use-sats"
import { type SAT } from "@/types"
import { Button } from "@/components/ui/button"
import { FilePlus, Loader2 } from "lucide-react"

export default function MinhasSatsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { sats, isLoading } = useSats({ representanteId: user?.id })
  const [selectedSat, setSelectedSat] = useState<SAT | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleSelectSat = useCallback((sat: SAT) => {
    setSelectedSat(sat)
    setDialogOpen(true)
  }, [])

  if (isLoading) {
    return (
      <PageTemplate title="Minhas SATs" description="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageTemplate>
    )
  }

  return (
    <PageTemplate
      title="Minhas SATs"
      description="Suas Solicitações de Assistência Técnica"
      actions={
        <Button onClick={() => router.push("/dashboard/nova-sat")}>
          <FilePlus className="mr-2 h-4 w-4" />
          Nova SAT
        </Button>
      }
    >
      <SatListTable
        sats={sats}
        onSelectSat={handleSelectSat}
        emptyMessage="Você ainda não criou nenhuma SAT"
      />

      <SatDetailDialog
        sat={selectedSat}
        avt={selectedSat?.avt ?? null}
        mode="visualizar"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </PageTemplate>
  )
}
