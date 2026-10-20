"use client"

import { useState, useCallback } from "react"
import { Trash2, Loader2, AlertTriangle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { deleteSat } from "@/lib/api/sat"
import { type SAT, UserRole } from "@/types"

interface SatDeleteSectionProps {
  sat: SAT
  /** Chamado depois que o backend confirmou a exclusão (ex.: recarregar a lista). */
  onDeleted?: (satId: string) => void
  /** Fecha o diálogo pai depois da exclusão. */
  onClose?: () => void
}

/**
 * Zona de exclusão definitiva da SAT, exibida nos diálogos de detalhe/envio.
 * Só renderiza para ADMIN; o backend também exige ADMIN no DELETE /sat/:id.
 * Remove a SAT com lotes, evidências (inclusive arquivos no Azure) e AVT.
 */
export function SatDeleteSection({ sat, onDeleted, onClose }: SatDeleteSectionProps) {
  const { user } = useAuth()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = useCallback(async () => {
    setError(null)
    setIsDeleting(true)
    try {
      await deleteSat(sat.id)
      setConfirmOpen(false)
      onDeleted?.(sat.id)
      onClose?.()
    } catch (err) {
      setConfirmOpen(false)
      setError(err instanceof Error ? err.message : "Não foi possível excluir a SAT.")
    } finally {
      setIsDeleting(false)
    }
  }, [sat.id, onDeleted, onClose])

  if (user?.tipo !== UserRole.ADMIN) return null

  const totalArquivos = sat.evidencias?.length ?? 0

  return (
    <>
      <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 text-sm">
          <p className="font-medium text-destructive flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Excluir SAT (administrador)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Remove definitivamente a SAT, seus lotes e arquivos anexados
            {sat.avt ? " e a averiguação técnica" : ""}. Esta ação não pode ser desfeita.
          </p>
          {error && (
            <p className="text-xs text-destructive mt-2 flex items-start gap-1">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              {error}
            </p>
          )}
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Excluir SAT
        </Button>
      </div>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!isDeleting) setConfirmOpen(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir a SAT {sat.codigo}?</AlertDialogTitle>
            <AlertDialogDescription>
              A SAT <strong>{sat.codigo}</strong> ({sat.cliente}) será removida do sistema junto com{" "}
              {totalArquivos} arquivo(s) anexado(s)
              {sat.avt ? " e a averiguação técnica" : ""}. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={(e) => {
                // Mantém o alerta aberto enquanto a exclusão está em andamento
                e.preventDefault()
                void handleConfirm()
              }}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
