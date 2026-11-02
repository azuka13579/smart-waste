import { API_ROUTES } from "@/lib/constants"
import { jsonInit, readResponse, toQueryString } from "@/lib/http"
import type { CreateUserPayload, UpdateUserPayload } from "@/lib/schemas/user"
import type { User, UserListQuery } from "@/lib/types/user"

/* ── Manajemen pengguna (admin): /users ────────────────────────── */

export async function getUsers(query: UserListQuery = {}) {
  const response = await fetch(`${API_ROUTES.USERS.INDEX}${toQueryString(query)}`, jsonInit("GET"))
  return readResponse<User[]>(response)
}

export async function createUser(payload: CreateUserPayload) {
  const response = await fetch(API_ROUTES.USERS.INDEX, jsonInit("POST", payload))
  return readResponse<User>(response)
}

/** Menonaktifkan akun atau mengganti password membuat user tersebut otomatis keluar dari semua sesi. */
export async function updateUser(id: string, payload: UpdateUserPayload) {
  const response = await fetch(API_ROUTES.USERS.READ(id), jsonInit("PATCH", payload))
  return readResponse<User>(response)
}

/** Backend tidak pernah menghapus user permanen agar laporannya tetap punya pemilik. */
export async function deactivateUser(id: string) {
  const response = await fetch(API_ROUTES.USERS.READ(id), jsonInit("DELETE"))
  return readResponse<User>(response)
}
