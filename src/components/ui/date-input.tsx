"use client"

import * as React from "react"
import { CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

// ─── Conversão ISO ↔ display ─────────────────────────────────────────────────

/** "2025-02-25" → "25/02/2025" */
function isoToDisplay(iso: string): string {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  if (!y || !m || !d) return ""
  return `${d}/${m}/${y}`
}

/** "25/02/2025" → "2025-02-25"  |  retorna "" se data inválida */
function displayToIso(display: string): string {
  const clean = display.replace(/\D/g, "")
  if (clean.length !== 8) return ""

  const d = parseInt(clean.slice(0, 2), 10)
  const m = parseInt(clean.slice(2, 4), 10)
  const y = parseInt(clean.slice(4, 8), 10)

  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 9999) return ""

  // Validar com Date real (ex: 31/02 → inválido)
  const date = new Date(y, m - 1, d)
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  )
    return ""

  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

// ─── Máscara dd/mm/aaaa ─────────────────────────────────────────────────────

function applyMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

// ─── Componente ──────────────────────────────────────────────────────────────

interface DateInputProps
  extends Omit<
    React.ComponentProps<"input">,
    "type" | "value" | "onChange" | "maxLength" | "inputMode" | "placeholder"
  > {
  /** Valor em formato ISO YYYY-MM-DD */
  value: string
  /** Callback com valor em formato ISO YYYY-MM-DD (ou "" quando vazio) */
  onChange: (isoValue: string) => void
  placeholder?: string
}

function DateInput({
  value,
  onChange,
  className,
  placeholder = "dd/mm/aaaa",
  ...props
}: DateInputProps) {
  const [display, setDisplay] = React.useState(() => isoToDisplay(value))
  const internalChange = React.useRef(false)

  // Sincronizar com mudanças externas na prop `value`
  React.useEffect(() => {
    if (internalChange.current) {
      internalChange.current = false
      return
    }
    setDisplay(isoToDisplay(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(e.target.value)
    setDisplay(masked)

    const digits = masked.replace(/\D/g, "")

    if (digits.length === 0) {
      internalChange.current = true
      onChange("")
    } else if (digits.length === 8) {
      const iso = displayToIso(masked)
      if (iso) {
        internalChange.current = true
        onChange(iso)
      }
      // se inválida, não chama onChange — borda vermelha aparece via aria-invalid
    }
  }

  // Data completa mas inválida → feedback visual
  const digits = display.replace(/\D/g, "")
  const isComplete = digits.length === 8
  const isInvalid = isComplete && !displayToIso(display)

  return (
    <div className={cn("relative", className)}>
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        maxLength={10}
        value={display}
        onChange={handleChange}
        aria-invalid={isInvalid || undefined}
        className="pr-9"
      />
      <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export { DateInput }
