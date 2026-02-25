"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { PageTemplate } from "@/components/page-template"
import { ClientSearchSelect } from "@/components/client-search-select"
import { ProductSearchSelect } from "@/components/product-search-select"
import { createSat } from "@/lib/api/sat"
import { uploadMedia, validateFile, SAT_EVIDENCE_ACCEPT, MAX_FILE_SIZE } from "@/lib/api/media"
import { buscarRepresentante } from "@/lib/api/erp"
import { ApiError } from "@/lib/api"
import type { ErpCliente, ErpRepresentante, ErpProduto } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Loader2,
  Plus,
  Trash2,
  FileText,
  ImageIcon,
  Video,
  Upload,
  X,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export default function NovaSatPage() {
  const { user } = useAuth()
  const router = useRouter()

  // Representante info
  const [repInfo, setRepInfo] = useState<ErpRepresentante | null>(null)
  const [repLoading, setRepLoading] = useState(true)

  // Form fields
  const [cliente, setCliente] = useState("")
  const [cidade, setCidade] = useState("")
  const [produtos, setProdutos] = useState("")
  const [quantidade, setQuantidade] = useState<number>(1)

  // Refatorado para array de objetos { lote: string, validade: string }
  const [lotes, setLotes] = useState<{ lote: string; validade: string }[]>([{ lote: "", validade: "" }])

  const [contato, setContato] = useState("")
  const [telefone, setTelefone] = useState("")
  const [reclamacao, setReclamacao] = useState("")

  // Evidências (arquivos selecionados antes do upload)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<string[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(3)

  // Buscar dados do representante no ERP ao montar
  useEffect(() => {
    async function loadRepresentante() {
      try {
        const data = await buscarRepresentante()
        setRepInfo(data)
      } catch {
        // Falha silenciosa — campo mostrará apenas o código
      } finally {
        setRepLoading(false)
      }
    }
    loadRepresentante()
  }, [])

  // Gerar previews para os arquivos selecionados
  useEffect(() => {
    const urls: string[] = []
    selectedFiles.forEach((file) => {
      if (file.type.startsWith("image/")) {
        urls.push(URL.createObjectURL(file))
      } else {
        urls.push("") // vídeo ou outro — sem preview de imagem
      }
    })
    setFilePreviews(urls)
    return () => urls.forEach((u) => { if (u) URL.revokeObjectURL(u) })
  }, [selectedFiles])

  function handleClienteSelect(c: ErpCliente) {
    setCliente(c.NOMCLI)
    const cidadeFormatada = c.UF ? `${c.CIDADE} - ${c.UF}` : c.CIDADE;
    setCidade(cidadeFormatada || "")
  }

  function handleProdutoSelect(p: ErpProduto) {
    setProdutos(p.DESCRICAO_ITEM)
  }

  function handleAddLote() {
    setLotes([...lotes, { lote: "", validade: "" }])
  }

  function handleRemoveLote(index: number) {
    setLotes(lotes.filter((_, i) => i !== index))
  }

  function handleLoteChange(index: number, field: 'lote' | 'validade', value: string) {
    const updated = [...lotes]
    if (field === 'lote') {
      const digits = value.replace(/\D/g, "").slice(0, 9)
      let formatted = digits
      if (digits.length > 6) {
        formatted = `${digits.slice(0, 6)}-${digits.slice(6)}`
      }
      updated[index].lote = formatted
    } else {
      updated[index].validade = value
    }
    setLotes(updated)
  }

  function handleTelefoneChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    let formatted = digits
    if (digits.length > 7) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    } else if (digits.length > 2) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    } else if (digits.length > 0) {
      formatted = `(${digits}`
    }
    setTelefone(formatted)
  }

  function validateLoteFormat(lote: string): boolean {
    return /^\d{6}-\d{3}$/.test(lote)
  }

  // ── Manipulação de arquivos de evidência ──────────────────────────────────

  const handleFilesSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setError(null)

    for (const file of files) {
      const validationError = validateFile(file, 'sat_evidencia')
      if (validationError) {
        setError(validationError)
        return
      }
    }

    setSelectedFiles((prev) => [...prev, ...files])
    // Reset input para permitir re-selecionar o mesmo arquivo
    e.target.value = ""
  }, [])

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setError(null)

    if (!produtos.trim()) {
      setError("Selecione um produto")
      return
    }

    const validLotes = lotes.filter((l) => l.lote.trim() !== "")
    if (validLotes.length === 0) {
      setError("Informe pelo menos um lote")
      return
    }

    const invalidLotes = validLotes.filter((l) => !validateLoteFormat(l.lote))
    if (invalidLotes.length > 0) {
      setError(`Lotes com formato inválido (use 000000-000): ${invalidLotes.map(l => l.lote).join(", ")}`)
      return
    }

    // Validar se todos têm validade
    const missingValidade = validLotes.filter(l => !l.validade);
    if (missingValidade.length > 0) {
      setError(`Informe a data de validade para todos os lotes.`)
      return
    }

    // Validação obrigatória de evidência
    if (selectedFiles.length === 0) {
      setError("Anexe pelo menos uma imagem ou vídeo como evidência.")
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Criar a SAT
      setUploadProgress("Criando SAT...")
      const sat = await createSat({
        cliente,
        cidade: cidade || "A definir",
        produtos,
        quantidade,
        lotes: validLotes, // Agora passa os objetos {lote, validade}
        // validade removida
        contato,
        representante_id: user.id,
        telefone,
        reclamacao,
      })

      // 2. Upload das evidências
      for (let i = 0; i < selectedFiles.length; i++) {
        setUploadProgress(`Enviando evidência ${i + 1} de ${selectedFiles.length}...`)
        await uploadMedia(selectedFiles[i], sat.id, 'sat_evidencia')
      }

      setUploadProgress("")
      setSuccess(true)
      let count = 3
      setCountdown(3)
      const interval = setInterval(() => {
        count -= 1
        setCountdown(count)
        if (count === 0) {
          clearInterval(interval)
          router.push("/dashboard/minhas-sats")
        }
      }, 1000)
    } catch (err) {
      setUploadProgress("")
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Erro ao criar SAT. Tente novamente.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  const representanteDisplay = repLoading
    ? "Carregando..."
    : repInfo
      ? `${repInfo.CODREP} — ${repInfo.NOMREP}`
      : user.usuario

  return (
    <PageTemplate
      title="Nova SAT"
      description="Criar uma nova Solicitação de Assistência Técnica"
    >
      <form onSubmit={handleSubmit}>
        {/* Mensagens */}
        {error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive mb-4 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Card único com todo o formulário ────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Solicitação de Assistência Técnica (SAT)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Representante (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="representante">Representante</Label>
              <Input
                id="representante"
                value={representanteDisplay}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Preenchido automaticamente com seus dados.
              </p>
            </div>

            <Separator />

            {/* Cliente */}
            <div className="space-y-2">
              <Label>Cliente</Label>
              <ClientSearchSelect
                onSelect={handleClienteSelect}
                onClear={() => { setCliente(""); setCidade(""); }}
                disabled={isSubmitting}
              />
              {cliente && (
                <p className="text-xs text-muted-foreground">
                  Selecionado: <strong>{cliente}</strong>
                </p>
              )}
            </div>

            {/* Cidade (auto-preenchida) */}
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={cidade}
                disabled
                placeholder="Preenchido automaticamente ao selecionar o cliente"
                className="bg-muted"
              />
            </div>

            <Separator />

            {/* Produto */}
            <div className="space-y-2">
              <Label>Produto</Label>
              <ProductSearchSelect
                onSelect={handleProdutoSelect}
                onClear={() => setProdutos("")}
                disabled={isSubmitting}
              />
              {produtos && (
                <p className="text-xs text-muted-foreground">
                  Selecionado: <strong>{produtos}</strong>
                </p>
              )}
            </div>

            {/* Quantidade */}
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Lotes e Validades dinâmicos */}
            <div className="space-y-2">
              <Label>Lotes e Validades (Lote: 000000-000)</Label>
              <div className="space-y-3">
                {lotes.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        value={item.lote}
                        onChange={(e) => handleLoteChange(index, 'lote', e.target.value)}
                        placeholder="Lote (000000-000)"
                        maxLength={10}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="w-44">
                      <DateInput
                        value={item.validade}
                        onChange={(v) => handleLoteChange(index, 'validade', v)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    {lotes.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveLote(index)}
                        disabled={isSubmitting}
                        className="mt-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Badges de validação visual */}
              {lotes.filter((l) => l.lote.trim() !== "").length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {lotes
                    .filter((l) => l.lote.trim() !== "")
                    .map((item, i) => (
                      <Badge
                        key={i}
                        variant={validateLoteFormat(item.lote) ? "secondary" : "destructive"}
                        className="text-sm px-3 py-1"
                      >
                        {item.lote} {item.validade ? `(${new Date(item.validade).toLocaleDateString('pt-BR', { timeZone: 'UTC' })})` : ''}
                      </Badge>
                    ))}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLote}
                disabled={isSubmitting}
                className="mt-2"
              >
                <Plus className="mr-1 h-4 w-4" />
                Adicionar Lote
              </Button>
            </div>

            <Separator />

            {/* Contato e Telefone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contato">Nome do Contato</Label>
                <Input
                  id="contato"
                  value={contato}
                  onChange={(e) => setContato(e.target.value)}
                  placeholder="Ex: João Silva"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => handleTelefoneChange(e.target.value)}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <Separator />

            {/* Reclamação */}
            <div className="space-y-2">
              <Label htmlFor="reclamacao">Descrição da Reclamação</Label>
              <Textarea
                id="reclamacao"
                value={reclamacao}
                onChange={(e) => setReclamacao(e.target.value)}
                placeholder="Descreva detalhadamente o problema relatado pelo cliente..."
                rows={5}
                required
                disabled={isSubmitting}
              />
            </div>

            <Separator />

            {/* ── Evidências (Upload obrigatório) ──────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>
                  Evidências <span className="text-destructive">*</span>
                </Label>
                <span className="text-xs text-muted-foreground">
                  Imagens e/ou vídeos (máx. 50 MB cada)
                </span>
              </div>

              {/* Grid de previews */}
              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {selectedFiles.map((file, idx) => {
                    const isImage = file.type.startsWith("image/")
                    const isVideo = file.type.startsWith("video/")
                    return (
                      <div
                        key={`${file.name}-${idx}`}
                        className="group relative flex flex-col items-center rounded-lg border bg-muted/30 p-2"
                      >
                        {/* Botão remover */}
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="absolute -top-2 -right-2 z-10 rounded-full bg-destructive text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isSubmitting}
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="w-full aspect-square rounded-md overflow-hidden bg-muted flex items-center justify-center mb-2">
                          {isImage && filePreviews[idx] ? (
                            <img
                              src={filePreviews[idx]}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-1">
                              {isVideo ? (
                                <Video className="h-8 w-8 text-purple-500" />
                              ) : (
                                <ImageIcon className="h-8 w-8 text-blue-500" />
                              )}
                              <span className="text-[10px] text-muted-foreground uppercase font-medium">
                                {file.type.split("/")[1]?.toUpperCase() ?? "FILE"}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-center truncate w-full px-1" title={file.name}>
                          {file.name}
                        </p>
                        <Badge variant="secondary" className="text-[10px] mt-1">
                          {formatFileSize(file.size)}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Botão de seleção */}
              <div className="flex items-center gap-3">
                <label
                  htmlFor="evidencias-input"
                  className={`flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors text-sm ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Upload className="h-4 w-4" />
                  Adicionar Evidências
                </label>
                <input
                  id="evidencias-input"
                  type="file"
                  className="hidden"
                  accept={SAT_EVIDENCE_ACCEPT}
                  multiple
                  onChange={handleFilesSelected}
                  disabled={isSubmitting}
                />
                {selectedFiles.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Obrigatório: anexe pelo menos uma imagem ou vídeo.
                  </p>
                )}
                {selectedFiles.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedFiles.length} arquivo(s) selecionado(s)
                  </p>
                )}
              </div>
            </div>

          </CardContent>
        </Card>

        {/* ── Ações ───────────────────────────────────────────────────── */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !cliente || !produtos || selectedFiles.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploadProgress || "Criando SAT..."}
              </>
            ) : (
              "Criar SAT"
            )}
          </Button>
        </div>
      </form>

      {/* Dialog de sucesso com contagem regressiva */}
      <Dialog open={success}>
        <DialogContent
          className="sm:max-w-sm text-center"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="items-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-2 mx-auto" />
            <DialogTitle>SAT criada com sucesso!</DialogTitle>
            <DialogDescription>
              Você será redirecionado para suas SATs em...
            </DialogDescription>
          </DialogHeader>
          <div className="text-6xl font-bold text-primary py-4">{countdown}</div>
        </DialogContent>
      </Dialog>
    </PageTemplate>
  )
}
