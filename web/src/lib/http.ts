import type { ApiErrorBody, ApiResponse, ValidationIssue } from "@/lib/types/api"

/** Dilempar oleh `readResponse` agar TanStack Query masuk ke state `error`. */
export class ApiError extends Error {
  readonly status: number
  readonly validationErrors: ValidationIssue[]

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.message ?? `Request failed (${status})`)
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
  return params.size ? `?${params.toString()}` : ""
}

const JSON_HEADERS = { "Content-Type": "application/json" }

/** Opsi fetch standar: cookie sesi selalu ikut, body dikirim sebagai JSON. */
export function jsonInit(method: string, body?: unknown): RequestInit {
  return {
    method,
    credentials: "include",
    headers: JSON_HEADERS,
    body: body === undefined ? undefined : JSON.stringify(body),
  }
}

/** Pesan error yang aman ditampilkan ke pengguna. */
export function getErrorMessage(error: unknown, fallback = "Terjadi kesalahan, coba lagi") {
  if (error instanceof ApiError) return error.message
  if (error instanceof TypeError) return "Tidak dapat terhubung ke server"
  return fallback
}
