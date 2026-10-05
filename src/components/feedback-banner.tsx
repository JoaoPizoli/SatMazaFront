import type { ReactNode } from "react"
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

const VARIANTES = {
    error: { classe: "border-destructive/30 bg-destructive/10 text-destructive", Icone: AlertCircle },
    success: { classe: "border-green-200 bg-green-50 text-green-700", Icone: CheckCircle2 },
    warning: { classe: "border-amber-200 bg-amber-50 text-amber-800", Icone: AlertTriangle },
    info: { classe: "border-muted bg-muted/40 text-muted-foreground", Icone: Info },
}

/** Aviso inline (sucesso, erro, alerta ou informação), no mesmo estilo dos avisos da tela de login. */
export function FeedbackBanner({
    variant,
    children,
    onClose,
    className,
}: {
    variant: keyof typeof VARIANTES
    children: ReactNode
    onClose?: () => void
    className?: string
}) {
    const { classe, Icone } = VARIANTES[variant]
    return (
        <div
            role={variant === "error" ? "alert" : "status"}
            className={cn("flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm", classe, className)}
        >
            <Icone className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1 break-words">{children}</div>
            {onClose && (
                <button type="button" onClick={onClose} className="shrink-0 opacity-70 hover:opacity-100" aria-label="Fechar aviso">
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}
