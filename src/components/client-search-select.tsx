"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { ErpCliente } from "@/types"
import { listarClientes } from "@/lib/api/erp"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Search, X } from "lucide-react"

type ClientSearchSelectProps = {
  onSelect: (cliente: ErpCliente) => void
  onClear?: () => void
  disabled?: boolean
}

/**
 * Componente de busca e seleção de clientes do ERP.
 * Carrega clientes do representante logado, com filtro por digitação (debounce 300ms).
 * Após seleção, o campo trava e mostra o cliente selecionado com botão X para limpar.
 */
export function ClientSearchSelect({ onSelect, onClear, disabled }: ClientSearchSelectProps) {
  const [query, setQuery] = useState("")
  const [clientes, setClientes] = useState<ErpCliente[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<ErpCliente | null>(null)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchClientes = useCallback(async (busca?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await listarClientes(busca || undefined)
      setClientes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar clientes")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Carregar clientes iniciais
  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  function handleSearch(value: string) {
    setQuery(value)
    setIsOpen(true)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      fetchClientes(value)
    }, 300)
  }

  function handleSelect(cliente: ErpCliente) {
    setSelected(cliente)
    setQuery(cliente.NOMCLI)
    setIsOpen(false)
    onSelect(cliente)
  }

  function handleClear() {
    setSelected(null)
    setQuery("")
    setClientes([])
    onClear?.()
    fetchClientes()
  }

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full">
      {selected ? (
        /* ── Estado selecionado: campo travado + botão limpar ── */
        <div className="flex items-center gap-2">
          <Input
            value={`${selected.NOMCLI} (${selected.CODCLI})${selected.CIDADE ? ` — ${selected.CIDADE}` : ""}`}
            disabled
            className="bg-muted flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        /* ── Estado de busca: input editável + dropdown ── */
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome ou código do cliente..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsOpen(true)}
              disabled={disabled}
              className="pl-9"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {isOpen && !disabled && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
              {error ? (
                <div className="px-3 py-2 text-sm text-destructive">{error}</div>
              ) : clientes.length === 0 && !isLoading ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Nenhum cliente encontrado
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto py-1">
                  {clientes.map((c) => (
                    <button
                      key={c.CODCLI}
                      type="button"
                      onClick={() => handleSelect(c)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                    >
                      <div className="font-medium">{c.NOMCLI}</div>
                      <div className="text-xs text-muted-foreground">
                        Cód: {c.CODCLI} {c.CIDADE ? `— ${c.CIDADE}` : ""}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
