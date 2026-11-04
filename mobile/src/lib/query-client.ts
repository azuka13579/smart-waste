import { focusManager, MutationCache, onlineManager, QueryCache, QueryClient } from "@tanstack/react-query"
import * as Network from "expo-network"
import { AppState } from "react-native"

import { ApiError, getSessionToken } from "@/lib/http"
import { isOffline } from "@/lib/network"
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

// Saat offline query ditunda (bukan gagal), lalu otomatis diulang begitu koneksi kembali
onlineManager.setEventListener((setOnline) => {
  const subscription = Network.addNetworkStateListener((state) => setOnline(!isOffline(state)))
  return () => subscription.remove()
})
