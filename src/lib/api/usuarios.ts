import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api"
import type { User, ApiResponse } from "@/types"

export type CreateUserDto = {
    usuario: string
    email?: string
    senha?: string // Optional on update, required on create (but type here is loose)
    tipo: string
    nome?: string
}

export type UpdateUserDto = {
    usuario?: string
    email?: string | null
    senha?: string
    tipo?: string
    nome?: string | null
}

export async function getUsers(): Promise<User[]> {
    const res = await apiGet<User[]>("/usuario")
    return res
}

export async function getUser(id: number): Promise<User> {
    const res = await apiGet<User>(`/usuario/${id}`)
    return res
}

export async function createUser(data: CreateUserDto): Promise<User> {
    const res = await apiPost<User>("/usuario", data)
    return res
}

export async function updateUser(id: number, data: UpdateUserDto): Promise<User> {
    const res = await apiPatch<User>(`/usuario/${id}`, data)
    return res
}

export async function deleteUser(id: number): Promise<void> {
    await apiDelete(`/usuario/${id}`)
}

// ─── RepreAtendente ──────────────────────────────────────────────────────

export type RepreAtendente = {
    id: number
    usuarios: string[]
    nome_representante_comercial: string
    email_representante_comercial: string
    password_changed: boolean
    tipo: "REPRE_ATENDENTE" | "CHEFE_REPRE_ATENDENTE"
}

export type CreateRepreAtendenteDto = {
    nome_representante_comercial: string
    email_representante_comercial: string
    usuarios?: string[]
    tipo?: RepreAtendente["tipo"]
    senha?: string
}

export type UpdateRepreAtendenteDto = Omit<CreateRepreAtendenteDto, "senha">

export async function getRepreAtendentes(): Promise<RepreAtendente[]> {
    return await apiGet<RepreAtendente[]>("/usuario/repre-atendente")
}

export async function createRepreAtendente(data: CreateRepreAtendenteDto): Promise<RepreAtendente> {
    return await apiPost<RepreAtendente>("/usuario/repre-atendente", data)
}

export async function updateRepreAtendente(id: number, data: UpdateRepreAtendenteDto): Promise<RepreAtendente> {
    return await apiPatch<RepreAtendente>(`/usuario/repre-atendente/${id}`, data)
}

export async function deleteRepreAtendente(id: number): Promise<void> {
    await apiDelete(`/usuario/repre-atendente/${id}`)
}

export async function updateRepreAtendenteSenha(id: number, senha: string): Promise<RepreAtendente> {
    return await apiPatch<RepreAtendente>(`/usuario/repre-atendente/${id}/senha`, { senha })
}
