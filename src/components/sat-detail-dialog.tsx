"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import {
  FileText,
  MapPin,
  Phone,
  User,
  Package,
  Calendar,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ImageIcon,
  Video,
  FileAudio,
  FileIcon,
  Paperclip,
  Download,
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
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  type SAT,
  type AVT,
  type MediaAttachment,
  AVTStatus,
  AVTStatusLabels,
  SATStatusLabels,
  SATDestinoLabels,
  MediaStatus,
} from "@/types"
import {
  getViewUrl,
  uploadMedia,
  deleteMedia,
  validateFile,
  AVT_LAUDO_ACCEPT,
} from "@/lib/api/media"
import { downloadSatPdf } from "@/lib/api/sat"

// ─── Tipos do Dialog ─────────────────────────────────────────────────────────

type DialogMode = "criar" | "editar" | "visualizar"

interface SatDetailDialogProps {
  sat: SAT | null
  avt?: AVT | null
  mode: DialogMode
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (avtData: AVTFormData) => void
  onChangeStatus?: (satId: string, avtData: AVTFormData) => void
  onRedirect?: (satId: string) => void
}

/** Formata validade para exibição: "yyyy-mm-dd" ou "yyyy-mm" → "MM/AAAA" */
function formatValidade(validade: string): string {
  if (!validade) return ""
  const parts = validade.split("-")
  if (parts.length >= 2) return `${parts[1]}/${parts[0]}`
  return validade
}

export interface AVTFormData {
  averigucao_tecnica: string
  possiveis_causas: string
  lote: string
  reclamacao_procedente: boolean
  troca: boolean
  recolhimento_lote: boolean
  solucao: string
  data: string
  status: AVTStatus
}

// ─── Estado inicial do formulário ────────────────────────────────────────────

function getInitialFormData(avt?: AVT | null, sat?: SAT | null): AVTFormData {
  if (avt) {
    return {
      averigucao_tecnica: avt.averigucao_tecnica,
      possiveis_causas: avt.possiveis_causas,
      lote: avt.lote,
      reclamacao_procedente: avt.reclamacao_procedente,
      troca: avt.troca,
      recolhimento_lote: avt.recolhimento_lote,
      solucao: avt.solucao,
      data: avt.data.split("T")[0],
      status: avt.status,
    }
  }
  return {
    averigucao_tecnica: "",
    possiveis_causas: "",
    lote: sat?.lotes[0]?.lote ?? "",
    reclamacao_procedente: false,
    troca: false,
    recolhimento_lote: false,
    solucao: "",
    data: new Date().toISOString().split("T")[0],
    status: AVTStatus.EM_ANALISE,
  }
}

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
          const isAudio = ev.mimeType.startsWith("audio/")
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
              {/* Overlay de loading */}
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 rounded-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
              {/* Overlay de ação */}
              <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="h-6 w-6 text-white" />
              </div>
              <div className="w-full aspect-square rounded-md overflow-hidden bg-muted flex items-center justify-center mb-2">
                <div className="flex flex-col items-center justify-center gap-1">
                  {isImage && <ImageIcon className="h-8 w-8 text-blue-500" />}
                  {isVideo && <Video className="h-8 w-8 text-purple-500" />}
                  {isAudio && <FileAudio className="h-8 w-8 text-green-600" />}
                  {!isImage && !isVideo && !isAudio && (
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

// ─── Badge de laudo clicável ─────────────────────────────────────────────────

// ─── Card de Laudo Rico (Estilo Galeria) ─────────────────────────────────────

function LaudoCard({
  laudo,
  onRemove,
  readOnly
}: {
  laudo: MediaAttachment;
  onRemove?: () => void;
  readOnly?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false)

  const fileName = laudo.originalName ?? laudo.blobName.split("/").pop() ?? "laudo"
  const isImage = laudo.mimeType.startsWith("image/")
  const fileExt = fileName.split(".").pop()?.toUpperCase() ?? "FILE"

  async function handleOpen() {
    try {
      setIsLoading(true)
      const { viewUrl } = await getViewUrl(laudo.id)
      window.open(viewUrl, "_blank", "noopener,noreferrer")
    } catch (err) {
      console.error("Erro ao abrir laudo:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="group relative flex items-center gap-3 rounded-lg border bg-muted/30 p-3 hover:bg-muted/60 transition-colors cursor-pointer w-full max-w-md"
      onClick={handleOpen}
      title="Clique para visualizar o laudo"
    >
      {/* Ícone */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-background border shadow-sm">
        {isImage ? (
          <ImageIcon className="h-5 w-5 text-blue-500" />
        ) : (
          <FileText className="h-5 w-5 text-orange-500" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground">
          {fileName}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-[10px] h-4 px-1">
            {fileExt}
          </Badge>
          <span>{(laudo.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}

        {!readOnly && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive z-10"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}

        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Componente Principal ────────────────────────────────────────────────────

export function SatDetailDialog({
  sat,
  avt,
  mode,
  open,
  onOpenChange,
  onSave,
  onChangeStatus,
  onRedirect,
}: SatDetailDialogProps) {
  const [formData, setFormData] = useState<AVTFormData>(() =>
    getInitialFormData(avt, sat)
  )
  // Novos arquivos selecionados localmente (ainda não enviados)
  const [newLaudoFiles, setNewLaudoFiles] = useState<File[]>([])
  // IDs de laudos já salvos que foram marcados para remoção
  const [removedLaudoIds, setRemovedLaudoIds] = useState<string[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [redirectConfirmOpen, setRedirectConfirmOpen] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

  // Laudos já salvos no backend (todas as mídias da SAT com context avt_laudo)
  const savedLaudos = useMemo(
    () =>
      (sat?.evidencias ?? []).filter(
        (m) => m.status === MediaStatus.READY && m.context === "avt_laudo"
      ),
    [sat]
  )
  // Laudos salvos que ainda não foram removidos nesta edição
  const visibleSavedLaudos = useMemo(
    () => savedLaudos.filter((l) => !removedLaudoIds.includes(l.id)),
    [savedLaudos, removedLaudoIds]
  )

  // Reset form when dialog opens with different SAT/AVT
  const resetForm = useCallback(() => {
    setFormData(getInitialFormData(avt, sat))
    setNewLaudoFiles([])
    setRemovedLaudoIds([])
    setUploadError(null)
  }, [avt, sat])

  // Sync form data when avt/sat props change (component stays mounted)
  useEffect(() => {
    setFormData(getInitialFormData(avt, sat))
    setNewLaudoFiles([])
    setRemovedLaudoIds([])
    setUploadError(null)
  }, [avt, sat])

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) resetForm()
      onOpenChange(isOpen)
    },
    [onOpenChange, resetForm]
  )

  const readOnly = mode === "visualizar"
  const showAvtForm = mode === "editar" || (mode === "visualizar" && avt != null)

  const updateField = useCallback(
    <K extends keyof AVTFormData>(field: K, value: AVTFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      setUploadError(null)

      const valid: File[] = []
      for (const file of files) {
        const validationError = validateFile(file, 'avt_laudo')
        if (validationError) {
          setUploadError(validationError)
          continue
        }
        valid.push(file)
      }

      if (valid.length > 0) {
        setNewLaudoFiles((prev) => [...prev, ...valid])
      }
      // Permite re-selecionar o mesmo arquivo posteriormente
      e.target.value = ""
    },
    []
  )

  const removeSavedLaudo = useCallback((id: string) => {
    setRemovedLaudoIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  const removeNewLaudo = useCallback((index: number) => {
    setNewLaudoFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // Persiste os laudos: remove os marcados e envia os novos arquivos.
  const persistLaudos = useCallback(async (): Promise<void> => {
    if (!sat) return
    setIsUploading(true)
    try {
      for (const id of removedLaudoIds) {
        await deleteMedia(id)
      }
      for (const file of newLaudoFiles) {
        await uploadMedia(file, sat.id, 'avt_laudo')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar os laudos."
      setUploadError(msg)
      throw err
    } finally {
      setIsUploading(false)
    }
  }, [sat, removedLaudoIds, newLaudoFiles])

  const validateAvtFields = useCallback(() => {
    const errors: string[] = []
    if (!formData.averigucao_tecnica?.trim()) errors.push("Averiguação Técnica")
    if (!formData.possiveis_causas?.trim()) errors.push("Possíveis Causas")
    if (!formData.solucao?.trim()) errors.push("Solução Proposta")
    if (!formData.data?.trim()) errors.push("Data da Averiguação")

    if (errors.length > 0) {
      setUploadError(`Preencha os campos obrigatórios: ${errors.join(", ")}`)
      return false
    }
    return true
  }, [formData])

  const handleSave = useCallback(async () => {
    if (!sat) return
    setUploadError(null)

    try {
      await persistLaudos()
      onSave?.(formData)
      onOpenChange(false)
    } catch {
      // uploadError já foi setado
    }
  }, [formData, sat, onSave, onOpenChange, persistLaudos])

  const handleChangeStatus = useCallback(async () => {
    if (!sat) return
    setUploadError(null)

    try {
      await persistLaudos()
      onChangeStatus?.(sat.id, formData)
      onOpenChange(false)
    } catch {
      // uploadError já foi setado
    }
  }, [sat, formData, onChangeStatus, onOpenChange, persistLaudos])

  const handleFinalizarClick = useCallback(() => {
    // Verificar campos obrigatórios
    if (!validateAvtFields()) return

    setConfirmOpen(true)
  }, [validateAvtFields])

  const handleConfirmFinalizar = useCallback(async () => {
    setConfirmOpen(false)
    setUploadError(null)

    if (!sat) return

    try {
      await persistLaudos()
      onChangeStatus?.(sat.id, { ...formData, status: AVTStatus.CONCLUIDO })
      onOpenChange(false)
    } catch {
      // uploadError já foi setado
    }
  }, [formData, sat, onChangeStatus, onOpenChange, persistLaudos])

  const lotesOptions = useMemo(() => sat?.lotes ?? [], [sat])

  if (!sat) return null

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <DialogTitle className="text-lg">{sat.codigo}</DialogTitle>
              <Badge variant="secondary">{SATStatusLabels[sat.status]}</Badge>
              {sat.destino && <Badge variant="outline">{SATDestinoLabels[sat.destino]}</Badge>}
            </div>
            <DialogDescription>
              {sat.produtos} — {sat.cliente}
            </DialogDescription>
          </DialogHeader>

          {/* ── Dados da SAT (sempre read-only) ───────────────────────── */}
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
                  value={sat.sem_lote ? "Sem lote" : sat.lotes.map(l => `${l.lote} (${formatValidade(l.validade)})`).join(", ")}
                />
                <InfoRow icon={User} label="Contato" value={sat.contato} />
                <InfoRow icon={Phone} label="Telefone" value={sat.telefone} />
                <InfoRow
                  icon={User}
                  label="Representante"
                  value={sat.representante ? `${sat.representante.usuario} - ${sat.representante.nome || ''}` : String(sat.representante_id)}
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

              {/* Exibir Laudos da AVT se existirem (modo visualização, inclusive Representante na Finalizada) */}
              {readOnly && savedLaudos.length > 0 && (
                <div className="mt-5 border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium text-foreground">
                      Laudos Técnicos (AVT) ({savedLaudos.length})
                    </p>
                    {sat.avt && (
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {AVTStatusLabels[sat.avt.status]} ·{" "}
                        {new Date(sat.avt.data).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {savedLaudos.map((laudo) => (
                      <LaudoCard key={laudo.id} laudo={laudo} readOnly />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Formulário AVT (apenas editar e visualizar) ───────────── */}
          {showAvtForm && (
            <>
              <Separator />
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Averiguação Técnica (AVT)
                    {mode === "editar" && (
                      <Badge variant="secondary" className="text-xs ml-2">
                        Em Análise
                      </Badge>
                    )}
                    {mode === "visualizar" && (
                      <Badge variant="outline" className="text-xs ml-2">
                        {AVTStatusLabels[formData.status]}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Lotes da SAT (sempre read-only) */}
                  <div className="space-y-2">
                    <Label>Lote(s) Analisado(s)</Label>
                    {sat?.sem_lote ? (
                      <p className="text-sm text-muted-foreground">Sem lote</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {lotesOptions.map((item) => (
                          <Badge
                            key={item.id}
                            variant="secondary"
                            className="text-sm px-3 py-1"
                          >
                            {item.lote}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Averiguação técnica */}
                  <div className="space-y-2">
                    <Label htmlFor="avt-averigucao">
                      Averiguação Técnica {!readOnly && <span className="text-destructive">*</span>}
                    </Label>
                    {readOnly ? (
                      <p className="text-sm whitespace-pre-wrap">
                        {formData.averigucao_tecnica}
                      </p>
                    ) : (
                      <Textarea
                        id="avt-averigucao"
                        placeholder="Descreva a averiguação técnica realizada..."
                        rows={3}
                        value={formData.averigucao_tecnica}
                        onChange={(e) =>
                          updateField("averigucao_tecnica", e.target.value)
                        }
                      />
                    )}
                  </div>

                  {/* Possíveis causas */}
                  <div className="space-y-2">
                    <Label htmlFor="avt-causas">Possíveis Causas {!readOnly && <span className="text-destructive">*</span>}</Label>
                    {readOnly ? (
                      <p className="text-sm whitespace-pre-wrap">
                        {formData.possiveis_causas}
                      </p>
                    ) : (
                      <Textarea
                        id="avt-causas"
                        placeholder="Descreva as possíveis causas identificadas..."
                        rows={3}
                        value={formData.possiveis_causas}
                        onChange={(e) =>
                          updateField("possiveis_causas", e.target.value)
                        }
                      />
                    )}
                  </div>

                  {/* Switches: Reclamação procedente, Troca, Recolhimento */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="flex items-center justify-between rounded-lg border p-4 min-h-[56px]">
                      <Label
                        htmlFor="avt-procedente"
                        className="text-sm cursor-pointer leading-tight pr-4"
                      >
                        Reclamação Procedente
                      </Label>
                      <Switch
                        id="avt-procedente"
                        checked={formData.reclamacao_procedente}
                        onCheckedChange={(v) =>
                          updateField("reclamacao_procedente", v)
                        }
                        disabled={readOnly}
                        className="shrink-0"
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4 min-h-[56px]">
                      <Label
                        htmlFor="avt-troca"
                        className="text-sm cursor-pointer leading-tight pr-4"
                      >
                        Troca
                      </Label>
                      <Switch
                        id="avt-troca"
                        checked={formData.troca}
                        onCheckedChange={(v) => updateField("troca", v)}
                        disabled={readOnly}
                        className="shrink-0"
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4 min-h-[56px]">
                      <Label
                        htmlFor="avt-recolhimento"
                        className="text-sm cursor-pointer leading-tight pr-4"
                      >
                        Recolhimento de Lote
                      </Label>
                      <Switch
                        id="avt-recolhimento"
                        checked={formData.recolhimento_lote}
                        onCheckedChange={(v) =>
                          updateField("recolhimento_lote", v)
                        }
                        disabled={readOnly}
                        className="shrink-0"
                      />
                    </div>
                  </div>

                  {/* Solução */}
                  <div className="space-y-2">
                    <Label htmlFor="avt-solucao">Solução Proposta {!readOnly && <span className="text-destructive">*</span>}</Label>
                    {readOnly ? (
                      <p className="text-sm whitespace-pre-wrap">
                        {formData.solucao || "—"}
                      </p>
                    ) : (
                      <Textarea
                        id="avt-solucao"
                        placeholder="Descreva a solução proposta..."
                        rows={3}
                        value={formData.solucao}
                        onChange={(e) =>
                          updateField("solucao", e.target.value)
                        }
                      />
                    )}
                  </div>

                  {/* Data da averiguação */}
                  <div className="space-y-2 max-w-xs">
                    <Label htmlFor="avt-data">Data da Averiguação {!readOnly && <span className="text-destructive">*</span>}</Label>
                    {readOnly ? (
                      <p className="text-sm">
                        {new Date(formData.data).toLocaleDateString("pt-BR")}
                      </p>
                    ) : (
                      <DateInput
                        id="avt-data"
                        value={formData.data}
                        onChange={(v) => updateField("data", v)}
                      />
                    )}
                  </div>

                  {/* Status (apenas no modo visualizar) */}
                  {mode === "visualizar" && (
                    <div className="space-y-2">
                      <Label>Status da AVT</Label>
                      <p className="text-sm">
                        {AVTStatusLabels[formData.status]}
                      </p>
                    </div>
                  )}

                  {/* Upload de Laudos — apenas no modo edição.
                      Em visualização, os laudos aparecem no card "Dados da SAT". */}
                  {!readOnly && (
                    <div className="space-y-2">
                      <Label>
                        Laudos / Relatórios
                      </Label>

                      <div className="space-y-3">
                        {(visibleSavedLaudos.length > 0 || newLaudoFiles.length > 0) && (
                          <div className="flex flex-col gap-2">
                            {/* Laudos já salvos no banco */}
                            {visibleSavedLaudos.map((laudo) => (
                              <LaudoCard
                                key={laudo.id}
                                laudo={laudo}
                                onRemove={() => removeSavedLaudo(laudo.id)}
                              />
                            ))}

                            {/* Novos arquivos selecionados (preview, ainda não enviados) */}
                            {newLaudoFiles.map((file, index) => (
                              <div
                                key={`${file.name}-${index}`}
                                className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3"
                              >
                                <FileText className="h-8 w-8 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Novo arquivo · {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeNewLaudo(index)}
                                  disabled={isUploading}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Botão para adicionar mais arquivos */}
                        <div className="flex items-center gap-3">
                          <label
                            htmlFor="avt-laudo"
                            className={`flex items-center gap-2 px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors text-sm w-full justify-center ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                          >
                            <Upload className="h-4 w-4" />
                            Adicionar arquivo(s)
                          </label>
                          <Input
                            id="avt-laudo"
                            type="file"
                            multiple
                            className="hidden"
                            accept={AVT_LAUDO_ACCEPT}
                            onChange={handleFileChange}
                            disabled={isUploading}
                          />
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Anexe quantos laudos quiser. Formatos aceitos: PDF, Word (.doc, .docx), Texto (.txt) ou Imagem. Máx. 50 MB por arquivo.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Erro de upload */}
                  {uploadError && (
                    <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      {uploadError}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* ── Ações ─────────────────────────────────────────────────── */}
          {mode === "criar" && (
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              {onRedirect && (
                <Button variant="secondary" onClick={() => setRedirectConfirmOpen(true)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Redirecionar
                </Button>
              )}
              <Button onClick={handleChangeStatus}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Iniciar Análise
              </Button>
            </div>
          )}

          {mode === "editar" && (
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button variant="secondary" onClick={handleSave} disabled={isUploading}>
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Salvar
              </Button>
              <Button onClick={handleFinalizarClick} disabled={isUploading}>
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Finalizar Análise
              </Button>
            </div>
          )}

          {mode === "visualizar" && (
            <div className="flex justify-end gap-2 pt-2">
              {sat.avt && (
                <Button
                  variant="secondary"
                  disabled={isDownloadingPdf}
                  onClick={async () => {
                    try {
                      setIsDownloadingPdf(true)
                      await downloadSatPdf(sat.id, sat.codigo)
                    } catch {
                      // silently fail
                    } finally {
                      setIsDownloadingPdf(false)
                    }
                  }}
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Baixar PDF
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Alert de confirmação para Finalizar Análise ─────────────── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar Análise</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja finalizar a análise da SAT{" "}
              <strong>{sat.codigo}</strong>? O status será alterado para{" "}
              <strong>Concluído</strong> e não poderá ser revertido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmFinalizar}>
              Confirmar Finalização
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Alert de confirmação para Redirecionamento ────────────── */}
      <AlertDialog open={redirectConfirmOpen} onOpenChange={setRedirectConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redirecionar SAT</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja redirecionar a SAT{" "}
              <strong>{sat.codigo}</strong> para o outro laboratório?
              <br />
              O status será alterado para <strong>Enviado</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setRedirectConfirmOpen(false)
              if (onRedirect) onRedirect(sat.id)
              onOpenChange(false)
            }}>
              Confirmar Redirecionamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
