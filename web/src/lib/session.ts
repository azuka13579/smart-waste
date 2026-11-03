import { useQuery, useQueryClient } from "@tanstack/react-query"

import { getCurrentUser } from "@/lib/services/auth"
import type { CurrentUser } from "@/lib/types/user"

export const SESSION_QUERY_KEY = ["session"] as const

/** User yang sedang login dari `GET /users/@me`. Cookie sesi httpOnly dikelola backend. */
export function useSession() {
  const query = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: getCurrentUser,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  })

  // `getCurrentUser` mengembalikan null untuk 401; error di sini berarti server tidak bisa dihubungi, bukan belum login
  return {
    user: query.data ?? null,
    isLoading: query.isPending,
    error: query.data === undefined ? query.error : null,
    isRefetching: query.isFetching,
    refetch: query.refetch,
  }
}

/** Dipakai setelah login/register/logout agar seluruh app langsung tahu status sesi terbaru. */
export function useSetSession() {
  const queryClient = useQueryClient()

  return (user: CurrentUser | null) => {
    if (user) {
      queryClient.setQueryData(SESSION_QUERY_KEY, user)
      return
    }
    queryClient.setQueryData(SESSION_QUERY_KEY, null)
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== SESSION_QUERY_KEY[0] })
  }
}
