import { API_ROUTES } from "@/lib/constants"
import { ApiError, jsonInit, readResponse } from "@/lib/http"
import type { LoginPayload, RegisterPayload } from "@/lib/schemas/auth"
import type { UpdateMePayload } from "@/lib/schemas/profile"
import type { CurrentUser, SignInResult } from "@/lib/types/user"

export async function login(payload: LoginPayload) {
  const response = await fetch(API_ROUTES.AUTH.LOGIN, jsonInit("POST", payload))
  return readResponse<SignInResult>(response)
}

export async function register(payload: RegisterPayload) {
  const response = await fetch(API_ROUTES.AUTH.REGISTER, jsonInit("POST", payload))
  return readResponse<SignInResult>(response)
}

export async function logout() {
  const response = await fetch(API_ROUTES.AUTH.LOGOUT, jsonInit("DELETE"))
  return readResponse<{ message: string }>(response)
}

/** Ubah nama dan/atau password sendiri. Ganti password wajib menyertakan `currentPassword`. */
export async function updateMe(payload: UpdateMePayload) {
  const response = await fetch(API_ROUTES.USERS.ME, jsonInit("PATCH", payload))
  return readResponse<CurrentUser>(response)
}

/** `null` berarti belum login (401), bukan error. */
export async function getCurrentUser() {
  const response = await fetch(API_ROUTES.USERS.ME, jsonInit("GET"))
  if (response.status === 401) return null

  const body = await readResponse<CurrentUser>(response).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  })
  return body?.data ?? null
}
