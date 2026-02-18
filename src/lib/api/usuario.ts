import { apiGet } from "@/lib/api"
import type { User } from "@/types"

/**
 * Listar todos os representantes.
 */
export async function getRepresentantes(): Promise<User[]> {
    return apiGet<User[]>("/usuario/representantes")
}
