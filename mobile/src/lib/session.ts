import { type QueryClient, useQuery, useQueryClient } from "@tanstack/react-query"

import { getSessionToken, setSessionToken } from "@/lib/http"
import { getCurrentUser } from "@/lib/services/auth"
import { tokenStorage } from "@/lib/token-storage"
import type { SignInResult } from "@/lib/types/user"

export const SESSION_QUERY_KEY = ["session"] as const

let isTokenLoaded = false

/** Token dibaca dari SecureStore sekali saat aplikasi dibuka, lalu disimpan di memori oleh `lib/http`. */
async function loadStoredToken() {
  if (isTokenLoaded) return
  setSessionToken(await tokenStorage.get())
  isTokenLoaded = true
}

async function storeToken(token: string | null) {
  setSessionToken(token)
  isTokenLoaded = true
  await tokenStorage.set(token)
}

async function fetchSession() {
  await loadStoredToken()
  const user = await getCurrentUser()
  // Token tersimpan tapi ditolak server: sudah kedaluwarsa, dicabut, atau akunnya dinonaktifkan
  if (!user && getSessionToken()) await storeToken(null)
  return user
}

/** User yang sedang login dari `GET /users/@me`, atau `null` bila belum login. */
export function useSession() {
  const query = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    staleTime: 60_000,
  })

  // `fetchSession` mengembalikan null untuk 401; error di sini berarti server tidak bisa dihubungi, bukan belum login
  return {
    user: query.data ?? null,
    isLoading: query.isPending,
    error: query.data === undefined ? query.error : null,
    isRefetching: query.isFetching,
    refetch: query.refetch,
  }
}

/** Hapus token dan semua data milik user sebelumnya. Dipakai saat logout dan saat server membalas 401. */
export async function clearSession(queryClient: QueryClient) {
  await storeToken(null)
  queryClient.setQueryData(SESSION_QUERY_KEY, null)
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== SESSION_QUERY_KEY[0] })
}

/** Dipakai setelah login/register/logout agar seluruh app langsung tahu status sesi terbaru. */
export function useSetSession() {
  const queryClient = useQueryClient()

  return async (result: SignInResult | null) => {
    if (!result) return clearSession(queryClient)

    await storeToken(result.token)
    queryClient.setQueryData(SESSION_QUERY_KEY, result.user)
  }
}
