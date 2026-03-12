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
