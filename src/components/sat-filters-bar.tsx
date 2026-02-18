"use client"

import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SATDestino, SATDestinoLabels } from "@/types"

interface SatFiltersBarProps {
  showLabFilter?: boolean
  labFilter: SATDestino | "TODOS"
  onLabFilterChange: (value: SATDestino | "TODOS") => void
  dataInicio: string
  onDataInicioChange: (value: string) => void
  dataFim: string
  onDataFimChange: (value: string) => void
  onClear: () => void
  hasActiveFilters: boolean
  /** Info text, e.g. "Exibindo 3 de 10" */
  infoText?: React.ReactNode
}

export function SatFiltersBar({
  showLabFilter = true,
  labFilter,
  onLabFilterChange,
  dataInicio,
  onDataInicioChange,
  dataFim,
  onDataFimChange,
  onClear,
  hasActiveFilters,
  infoText,
}: SatFiltersBarProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

        {showLabFilter && (
          <Select
            value={labFilter}
            onValueChange={(v) => onLabFilterChange(v as SATDestino | "TODOS")}
          >
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="Laboratório" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os Labs</SelectItem>
              <SelectItem value={SATDestino.BASE_AGUA}>
                {SATDestinoLabels[SATDestino.BASE_AGUA]}
              </SelectItem>
              <SelectItem value={SATDestino.BASE_SOLVENTE}>
                {SATDestinoLabels[SATDestino.BASE_SOLVENTE]}
              </SelectItem>
            </SelectContent>
          </Select>
        )}

        <Input
          type="date"
          max="9999-12-31"
          value={dataInicio}
          onChange={(e) => onDataInicioChange(e.target.value)}
          className="h-8 w-[145px] text-xs"
          placeholder="De"
          title="Data início"
        />

        <span className="text-xs text-muted-foreground">até</span>

        <Input
          type="date"
          max="9999-12-31"
          value={dataFim}
          onChange={(e) => onDataFimChange(e.target.value)}
          className="h-8 w-[145px] text-xs"
          placeholder="Até"
          title="Data fim"
        />

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={onClear}
          >
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        )}

        {infoText && (
          <span className="ml-auto text-xs text-muted-foreground hidden sm:inline">
            {infoText}
          </span>
        )}
      </div>

      {/* Mobile info text */}
      {infoText && (
        <span className="text-xs text-muted-foreground sm:hidden">
          {infoText}
        </span>
      )}
    </div>
  )
}
