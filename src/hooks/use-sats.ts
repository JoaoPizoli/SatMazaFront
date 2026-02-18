"use client"

import { useState, useEffect, useCallback } from "react"
import type { SAT, SATStatus, SATDestino } from "@/types"
import {
  getAllSats,
  getSatsByStatus,
  getSatsByLab,
  getSatsByRepresentante,
} from "@/lib/api/sat"

type UseSatsOptions = {
  status?: SATStatus
  laboratorio?: SATDestino
  representanteId?: number
}

/**
 * Hook para buscar SATs do backend com filtros opcionais.
 * Prioridade de filtro: status > laboratorio > representanteId > findAll.
 */
export function useSats(options: UseSatsOptions = {}) {
  const [sats, setSats] = useState<SAT[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { status, laboratorio, representanteId } = options

  const fetchSats = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      let data: SAT[]
      if (status) {
        data = await getSatsByStatus(status)
      } else if (laboratorio) {
        data = await getSatsByLab(laboratorio)
      } else if (representanteId) {
        data = await getSatsByRepresentante(representanteId)
      } else {
        data = await getAllSats()
      }
      setSats(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar SATs"
      setError(message)
      setSats([])
    } finally {
      setIsLoading(false)
    }
  }, [status, laboratorio, representanteId])

  useEffect(() => {
    fetchSats()
  }, [fetchSats])

  return { sats, isLoading, error, refetch: fetchSats }
}
