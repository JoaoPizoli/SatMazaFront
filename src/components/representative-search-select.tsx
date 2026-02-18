"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { listarRepresentantes } from "@/lib/api/erp"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Search, X } from "lucide-react"

type RepresentativeSearchSelectProps = {
    onSelect: (representante: { CODREP: string; NOMREP: string }) => void
    onClear?: () => void
    disabled?: boolean
}

export function RepresentativeSearchSelect({ onSelect, onClear, disabled }: RepresentativeSearchSelectProps) {
    const [query, setQuery] = useState("")
    const [representantes, setRepresentantes] = useState<{ CODREP: string; NOMREP: string }[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [selected, setSelected] = useState<{ CODREP: string; NOMREP: string } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    const fetchRepresentantes = useCallback(async (busca: string, openAfterFetch = true) => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await listarRepresentantes(busca)
            setRepresentantes(data)
            if (openAfterFetch) setIsOpen(true)
        } catch {
            setError("Erro ao buscar representantes")
            setRepresentantes([])
        } finally {
            setIsLoading(false)
        }
    }, [])

    function handleSearch(value: string) {
        setQuery(value)
        setIsOpen(true)

        if (debounceRef.current) clearTimeout(debounceRef.current)

        debounceRef.current = setTimeout(() => {
            fetchRepresentantes(value)
        }, 300)
    }

    function handleSelect(r: { CODREP: string; NOMREP: string }) {
        setSelected(r)
        setQuery(r.NOMREP)
        setIsOpen(false)
        onSelect(r)
    }

    function handleClear() {
        setSelected(null)
        setQuery("")
        setRepresentantes([])
        onClear?.()
        fetchRepresentantes("", false)
    }

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Preload representantes sem abrir o dropdown
    useEffect(() => {
        fetchRepresentantes("", false)
    }, [fetchRepresentantes])

    return (
        <div ref={containerRef} className="relative w-full">
            {selected ? (
                /* ── Estado selecionado: campo travado + botão limpar ── */
                <div className="flex items-center gap-2">
                    <Input
                        value={`${selected.NOMREP} (${selected.CODREP})`}
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
                            placeholder="Buscar representante por nome ou código..."
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
                            ) : representantes.length === 0 && !isLoading ? (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                    Nenhum representante encontrado
                                </div>
                            ) : (
                                <div className="max-h-60 overflow-y-auto py-1">
                                    {representantes.map((r) => (
                                        <button
                                            key={r.CODREP}
                                            type="button"
                                            onClick={() => handleSelect(r)}
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                                        >
                                            <div className="font-medium">{r.NOMREP}</div>
                                            <div className="text-xs text-muted-foreground">
                                                Cód: {r.CODREP}
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
