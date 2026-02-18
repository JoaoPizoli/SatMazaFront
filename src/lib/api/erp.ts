import { apiGet } from "@/lib/api"
import type { ErpCliente, ErpRepresentante, ErpProduto } from "@/types"

/**
 * Listar clientes do ERP vinculados ao representante autenticado.
 * O backend usa o token JWT para identificar o representante.
 * @param busca - Filtro opcional por nome ou código do cliente.
 */
export async function listarClientes(busca?: string): Promise<ErpCliente[]> {
  const params = busca ? `?busca=${encodeURIComponent(busca)}` : ""
  return apiGet<ErpCliente[]>(`/erp/clientes${params}`)
}

/**
 * Buscar dados do representante autenticado (CODREP + NOMREP) no ERP.
 */
export async function buscarRepresentante(): Promise<ErpRepresentante | null> {
  return apiGet<ErpRepresentante | null>(`/erp/representante`)
}

/**
 * Listar produtos do ERP (PRODUTO ACABADO).
 * @param busca - Filtro opcional por descrição ou código do produto.
 */
export async function listarProdutos(busca?: string): Promise<ErpProduto[]> {
  const params = busca ? `?busca=${encodeURIComponent(busca)}` : ""
  return apiGet<ErpProduto[]>(`/erp/produtos${params}`)
}
