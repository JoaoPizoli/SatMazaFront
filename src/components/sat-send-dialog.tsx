"use client"

import { useState, useCallback } from "react"
import {
  FileText,
  MapPin,
  Phone,
  User,
  Package,
  Calendar,
  AlertTriangle,
  Send,
  Paperclip,
  ImageIcon,
  Video,
  FileIcon,
  ExternalLink,
  Loader2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  type SAT,
  type MediaAttachment,
  SATDestino,
  SATDestinoLabels,
  SATStatusLabels,
  MediaStatus,
} from "@/types"
import { getViewUrl } from "@/lib/api/media"

// ─── Info row helper ─────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  )
}

// ─── Galeria de evidências com visualização Azure ────────────────────────────

function EvidenciasGallery({ evidencias }: { evidencias: SAT["evidencias"] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  if (evidencias.length === 0) return null

  // Filtrar apenas evidências do representante (excluir laudos da AVT)
  const readyEvidencias = evidencias.filter(
    (ev) => ev.status === MediaStatus.READY && ev.context !== 'avt_laudo'
  )
  if (readyEvidencias.length === 0) return null

  async function handleOpenFile(media: MediaAttachment) {
    try {
      setLoadingId(media.id)
      const { viewUrl } = await getViewUrl(media.id)
      window.open(viewUrl, "_blank", "noopener,noreferrer")
    } catch (err) {
      console.error("Erro ao abrir arquivo:", err)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-3">
        <Paperclip className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground">
          Evidências do Representante ({readyEvidencias.length})
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {readyEvidencias.map((ev) => {
          const isImage = ev.mimeType.startsWith("image/")
          const isVideo = ev.mimeType.startsWith("video/")
          const fileName =
            ev.originalName ?? ev.blobName.split("/").pop() ?? "arquivo"
          const isLoading = loadingId === ev.id

          return (
            <div
              key={ev.id}
              className="group relative flex flex-col items-center rounded-lg border bg-muted/30 p-2 hover:bg-muted/60 transition-colors cursor-pointer"
              title={`Clique para abrir: ${fileName}`}
              onClick={() => handleOpenFile(ev)}
            >
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 rounded-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
              <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="h-6 w-6 text-white" />
              </div>
              <div className="w-full aspect-square rounded-md overflow-hidden bg-muted flex items-center justify-center mb-2">
                <div className="flex flex-col items-center justify-center gap-1">
                  {isImage && <ImageIcon className="h-8 w-8 text-blue-500" />}
                  {isVideo && <Video className="h-8 w-8 text-purple-500" />}
                  {!isImage && !isVideo && (
                    <FileIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">
                    {ev.mimeType.split("/")[1]?.toUpperCase() ?? "FILE"}
                  </span>
                </div>
              </div>
              <p
                className="text-xs text-center truncate w-full px-1"
                title={fileName}
              >
                {fileName}
              </p>
              <Badge variant="secondary" className="text-[10px] mt-1">
                {(ev.sizeBytes / 1024 / 1024).toFixed(1)} MB
              </Badge>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface SatSendDialogProps {
  sat: SAT | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSend: (satId: string, laboratorio: SATDestino) => void
}

// ─── Componente Principal ────────────────────────────────────────────────────

export function SatSendDialog({
  sat,
  open,
  onOpenChange,
  onSend,
}: SatSendDialogProps) {
  const [selectedLab, setSelectedLab] = useState<SATDestino | "">("")
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setSelectedLab("")
      }
      onOpenChange(isOpen)
    },
    [onOpenChange]
  )

  const handleEnviarClick = useCallback(() => {
    if (!selectedLab) return
    setConfirmOpen(true)
  }, [selectedLab])

  const handleConfirmEnviar = useCallback(() => {
    if (!sat || !selectedLab) return
    setConfirmOpen(false)
    onSend(sat.id, selectedLab as SATDestino)
    onOpenChange(false)
  }, [sat, selectedLab, onSend, onOpenChange])

  if (!sat) return null

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <DialogTitle className="text-lg">{sat.codigo}</DialogTitle>
              <Badge variant="destructive">{SATStatusLabels[sat.status]}</Badge>
            </div>
            <DialogDescription>
              {sat.produtos} — {sat.cliente}
            </DialogDescription>
          </DialogHeader>

          {/* ── Dados da SAT (read-only) ──────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Dados da SAT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={User} label="Cliente" value={sat.cliente} />
                <InfoRow icon={MapPin} label="Cidade" value={sat.cidade} />
                <InfoRow icon={Package} label="Produto" value={sat.produtos} />
                <InfoRow
                  icon={Package}
                  label="Quantidade"
                  value={sat.quantidade}
                />
                <InfoRow
                  icon={FileText}
                  label="Lote(s)"
                  value={sat.lotes.map(l => `${l.lote} (${new Date(l.validade).toLocaleDateString("pt-BR", { timeZone: 'UTC' })})`).join(", ")}
                />
                <InfoRow icon={User} label="Contato" value={sat.contato} />
                <InfoRow icon={Phone} label="Telefone" value={sat.telefone} />
                <InfoRow
                  icon={User}
                  label="Representante"
                  value={sat.representante
                    ? `${sat.representante.usuario}${sat.representante.nome ? ` — ${sat.representante.nome}` : ''}`
                    : String(sat.representante_id)}
                />
                <InfoRow
                  icon={Calendar}
                  label="Data Criação"
                  value={new Date(sat.createdAt).toLocaleDateString("pt-BR")}
                />
              </div>
              <div className="mt-4">
                <InfoRow
                  icon={AlertTriangle}
                  label="Reclamação"
                  value={sat.reclamacao}
                />
              </div>
              <EvidenciasGallery evidencias={sat.evidencias} />
            </CardContent>
          </Card>

          {/* ── Seleção de Laboratório ─────────────────────────────────── */}
          <Card className="border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Send className="h-4 w-4" />
                Enviar para Laboratório
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lab-select">
                  Selecione o Laboratório <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedLab}
                  onValueChange={(value) => setSelectedLab(value as SATDestino)}
                >
                  <SelectTrigger id="lab-select" className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Selecione o laboratório..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SATDestino.BASE_AGUA}>
                      {SATDestinoLabels[SATDestino.BASE_AGUA]}
                    </SelectItem>
                    <SelectItem value={SATDestino.BASE_SOLVENTE}>
                      {SATDestinoLabels[SATDestino.BASE_SOLVENTE]}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {!selectedLab && (
                  <p className="text-xs text-muted-foreground">
                    É obrigatório selecionar um laboratório para enviar a SAT.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Ações ─────────────────────────────────────────────────── */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEnviarClick} disabled={!selectedLab}>
              <Send className="mr-2 h-4 w-4" />
              Enviar para Laboratório
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Alert de confirmação ──────────────────────────────────────── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Envio para Laboratório</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja enviar a SAT{" "}
              <strong>{sat.codigo}</strong> para o laboratório{" "}
              <strong>
                {selectedLab ? SATDestinoLabels[selectedLab as SATDestino] : ""}
              </strong>
              ?
              <br />
              <br />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEnviar}>
              Confirmar Envio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
