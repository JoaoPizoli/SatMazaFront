"use client"

import * as React from "react"
import { CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

// ─── Conversão ISO ↔ display ─────────────────────────────────────────────────

/** "2026-12" → "12/2026" */
function isoToDisplay(iso: string): string {
  if (!iso) return ""
  const [y, m] = iso.split("-")
  if (!y || !m) return ""
  return `${m}/${y}`
}

/** "12/2026" → "2026-12"  |  retorna "" se inválido */
function displayToIso(display: string): string {
  const clean = display.replace(/\D/g, "")
  if (clean.length !== 6) return ""

  const m = parseInt(clean.slice(0, 2), 10)
  const y = parseInt(clean.slice(2, 6), 10)

  if (m < 1 || m > 12 || y < 1900 || y > 9999) return ""

  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}`
}

// ─── Máscara MM/AAAA ────────────────────────────────────────────────────────

function applyMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 6)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

// ─── Componente ──────────────────────────────────────────────────────────────

interface MonthYearInputProps
  extends Omit<
    React.ComponentProps<"input">,
    "type" | "value" | "onChange" | "maxLength" | "inputMode" | "placeholder"
  > {
  /** Valor em formato ISO YYYY-MM */
  value: string
  /** Callback com valor em formato ISO YYYY-MM (ou "" quando vazio) */
  onChange: (isoValue: string) => void
  placeholder?: string
}

function MonthYearInput({
  value,
  onChange,
  className,
  placeholder = "mm/aaaa",
  ...props
}: MonthYearInputProps) {
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
    } else if (digits.length === 6) {
      const iso = displayToIso(masked)
      if (iso) {
        internalChange.current = true
        onChange(iso)
      }
    }
  }

  // Data completa mas inválida → feedback visual
  const digits = display.replace(/\D/g, "")
  const isComplete = digits.length === 6
  const isInvalid = isComplete && !displayToIso(display)

  return (
    <div className={cn("relative", className)}>
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        maxLength={7}
        value={display}
        onChange={handleChange}
        aria-invalid={isInvalid || undefined}
        className="pr-9"
      />
      <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export { MonthYearInput }
