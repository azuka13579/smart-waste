import { focusManager, MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"
import { AppState } from "react-native"

import { ApiError, getSessionToken } from "@/lib/http"
import { clearSession } from "@/lib/session"

/** 401 saat sedang login berarti sesi sudah tidak berlaku: keluarkan user ke halaman login. */
function handleUnauthorized(error: unknown) {
  if (error instanceof ApiError && error.status === 401 && getSessionToken()) void clearSession(queryClient)
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleUnauthorized }),
  mutationCache: new MutationCache({ onError: handleUnauthorized }),
  defaultOptions: {
    queries: {
      // Error 4xx tidak akan berubah bila diulang; cukup ulangi gangguan jaringan atau server
      retry: (failureCount, error) => !(error instanceof ApiError && error.status < 500) && failureCount < 2,
    },
  },
})

// React Native tidak punya event "window focus"; anggap aplikasi fokus saat kembali ke foreground
AppState.addEventListener("change", (status) => focusManager.setFocused(status === "active"))
