"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FeedbackBanner } from "@/components/feedback-banner"
import { getRelatorioPreview, mensagemDeErro, type PeriodoConsulta } from "@/lib/api/relatorio"
import type { RelatorioPreview } from "@/types"

/**
 * Mostra o e-mail exatamente como será enviado (HTML gerado pelo backend, em iframe isolado).
 * Renderize somente enquanto estiver aberto: cada abertura busca a pré-visualização do período.
 */
export function RelatorioPreviewDialog({
    onClose,
    periodo,
}: {
    onClose: () => void
    periodo: PeriodoConsulta
}) {
    const [preview, setPreview] = useState<RelatorioPreview | null>(null)
    const [erro, setErro] = useState<string | null>(null)
    const { startDate, endDate } = periodo

    useEffect(() => {
        let ativo = true
        getRelatorioPreview({ startDate, endDate })
            .then((resultado) => {
                if (ativo) setPreview(resultado)
            })
            .catch((error) => {
                if (ativo) setErro(mensagemDeErro(error))
            })
        return () => {
            ativo = false
        }
    }, [startDate, endDate])

    return (
        <Dialog open onOpenChange={(aberto) => !aberto && onClose()}>
            <DialogContent className="sm:max-w-[920px]">
                <DialogHeader>
                    <DialogTitle>Pré-visualização do e-mail</DialogTitle>
                    <DialogDescription>
                        {preview ? `Assunto: ${preview.assunto}` : "Gerando a pré-visualização..."} — o PDF completo segue em anexo.
                    </DialogDescription>
                </DialogHeader>
                {erro ? (
                    <FeedbackBanner variant="error">{erro}</FeedbackBanner>
                ) : preview ? (
                    <iframe
                        title="Pré-visualização do e-mail do relatório"
                        sandbox=""
                        srcDoc={preview.html}
                        className="h-[70vh] w-full rounded-md border bg-white"
                    />
                ) : (
                    <div className="flex h-[60vh] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
