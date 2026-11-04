import { REQUEST_TIMEOUT_MS } from "@/lib/constants"
import type { ApiErrorBody, ApiResponse, ValidationIssue } from "@/lib/types/api"

/** Dilempar oleh `readResponse` agar TanStack Query masuk ke state `error`. */
export class ApiError extends Error {
  readonly status: number
  readonly validationErrors: ValidationIssue[]

  constructor(status: number, body: ApiErrorBody | null) {
    // Respons tanpa pesan biasanya berarti server atau proxy di depannya sedang bermasalah
    super(body?.message ?? (status >= 500 ? "Server sedang tidak bisa dihubungi. Coba lagi beberapa saat lagi." : `Permintaan gagal (${status})`))
    this.name = "ApiError"
    this.status = status
    this.validationErrors = Array.isArray(body?.error) ? body.error : []
  }
}

/** Baca envelope `{ message, data, meta }` dari backend, atau lempar `ApiError` bila status bukan 2xx. */
export async function readResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (response.status === 204) return { message: "No Content", data: null as T, meta: null }

  const body = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(response.status, body)
  return body as ApiResponse<T>
}

/** Query string tanpa nilai kosong: `{ page: 1, search: "" }` → `?page=1`. */
export function toQueryString(query: Record<string, string | number | boolean | undefined | null>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  }
  const queryString = params.toString()
  return queryString ? `?${queryString}` : ""
}

/* ── Token sesi ─────────────────────────────────────────────────
 * Mobile tidak memakai cookie seperti web. Token dari login/register disimpan di SecureStore
 * (lihat `lib/session.tsx`) dan disalin ke sini agar setiap request bisa membacanya tanpa await.
 */
let sessionToken: string | null = null

export function setSessionToken(token: string | null) {
  sessionToken = token
}

export function getSessionToken() {
  return sessionToken
}

function authHeaders(): Record<string, string> {
  return sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}
}

function timeoutSignal() {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  return controller.signal
}

/** Opsi fetch standar: token sesi selalu ikut, body dikirim sebagai JSON. */
export function jsonInit(method: string, body?: unknown): RequestInit {
  return {
    method,
    headers: { Accept: "application/json", "Content-Type": "application/json", ...authHeaders() },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: timeoutSignal(),
  }
}

/** Untuk upload foto. Jangan isi `Content-Type`: fetch mengisinya sendiri beserta `boundary`. */
export function formDataInit(method: string, body: FormData): RequestInit {
  return {
    method,
    headers: { Accept: "application/json", ...authHeaders() },
    body,
    signal: timeoutSignal(),
  }
}

/**
 * Pesan error yang aman ditampilkan ke pengguna.
 * `expo/fetch` (fetch global di Expo) melempar `Error` biasa dengan pesan "fetch failed: ...", bukan `TypeError` seperti browser.
 */
export function getErrorMessage(error: unknown, fallback = "Terjadi kesalahan, coba lagi") {
  if (error instanceof ApiError) return error.message
  if (!(error instanceof Error)) return fallback

  if (error.name === "AbortError" || /aborted/i.test(error.message)) return "Server tidak merespons. Periksa koneksi internet kamu."
  if (error instanceof TypeError || error.message.startsWith("fetch failed")) return "Tidak dapat terhubung ke server"
  return fallback
}
