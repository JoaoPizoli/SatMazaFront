"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { ErpProduto } from "@/types"
import { listarProdutos } from "@/lib/api/erp"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Search, X } from "lucide-react"

type ProductSearchSelectProps = {
    onSelect: (produto: ErpProduto) => void
    onClear?: () => void
    disabled?: boolean
}

export function ProductSearchSelect({ onSelect, onClear, disabled }: ProductSearchSelectProps) {
    const [query, setQuery] = useState("")
    const [produtos, setProdutos] = useState<ErpProduto[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [selected, setSelected] = useState<ErpProduto | null>(null)
    const [error, setError] = useState<string | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    const fetchProdutos = useCallback(async (busca: string, openAfterFetch = true) => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await listarProdutos(busca)
            setProdutos(data)
            if (openAfterFetch) setIsOpen(true)
        } catch {
            setError("Erro ao buscar produtos")
            setProdutos([])
        } finally {
            setIsLoading(false)
        }
    }, [])

    function handleSearch(value: string) {
        setQuery(value)
        setIsOpen(true)

        if (debounceRef.current) clearTimeout(debounceRef.current)

        debounceRef.current = setTimeout(() => {
            fetchProdutos(value)
        }, 300)
    }

    function handleSelect(p: ErpProduto) {
        setSelected(p)
        setQuery(p.DESCRICAO_ITEM)
        setIsOpen(false)
        onSelect(p)
    }

    function handleClear() {
        setSelected(null)
        setQuery("")
        setProdutos([])
        onClear?.()
        fetchProdutos("", false)
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

    // Preload produtos sem abrir o dropdown
    useEffect(() => {
        fetchProdutos("", false)
    }, [fetchProdutos])

    return (
        <div ref={containerRef} className="relative w-full">
            {selected ? (
                /* ── Estado selecionado: campo travado + botão limpar ── */
                <div className="flex items-center gap-2">
                    <Input
                        value={`${selected.DESCRICAO_ITEM} (${selected.CODIGO_ITEM})`}
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
                            placeholder="Buscar por nome ou código do produto..."
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
                            ) : produtos.length === 0 && !isLoading ? (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                    Nenhum produto encontrado
                                </div>
                            ) : (
                                <div className="max-h-60 overflow-y-auto py-1">
                                    {produtos.map((p) => (
                                        <button
                                            key={p.CODIGO_ITEM}
                                            type="button"
                                            onClick={() => handleSelect(p)}
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                                        >
                                            <div className="font-medium">{p.DESCRICAO_ITEM}</div>
                                            <div className="text-xs text-muted-foreground">
                                                Cód: {p.CODIGO_ITEM}
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
