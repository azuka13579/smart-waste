import "@/global.css"

// Import per ketebalan: import dari indeks paket ikut membundel 16 varian (±1,5 MB) ke APK
import { PlusJakartaSans_400Regular } from "@expo-google-fonts/plus-jakarta-sans/400Regular"
import { PlusJakartaSans_500Medium } from "@expo-google-fonts/plus-jakarta-sans/500Medium"
import { PlusJakartaSans_600SemiBold } from "@expo-google-fonts/plus-jakarta-sans/600SemiBold"
import { PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans/700Bold"
import { QueryClientProvider } from "@tanstack/react-query"
import { useFonts } from "expo-font"
import { Stack } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import { SafeAreaView } from "react-native-safe-area-context"

import { OfflineModal } from "@/components/common/offline-modal"
import { QueryErrorState } from "@/components/common/query-error-state"
import { SnackbarHost } from "@/components/ui/snackbar-host"
import { queryClient } from "@/lib/query-client"
import { useSession } from "@/lib/session"
import { colors } from "@/lib/theme"

// Splash tetap tampil sampai font dan status login siap, agar layar tidak sempat berkedip
void SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  })

  return (
    <QueryClientProvider client={queryClient}>
      {/* Setiap layar diawali header hijau, jadi ikon status bar selalu putih */}
      <StatusBar style="light" />
      {/* Font gagal dimuat tidak boleh mengunci aplikasi; teks jatuh ke font sistem */}
      {(fontsLoaded || fontError) && <RootNavigator />}
      <SnackbarHost />
      <OfflineModal />
    </QueryClientProvider>
  )
}

function RootNavigator() {
  const { user, isLoading, error, refetch, isRefetching } = useSession()

  useEffect(() => {
    if (!isLoading) void SplashScreen.hideAsync()
  }, [isLoading])

  if (isLoading) return null

  // Token tersimpan tapi server tidak bisa dihubungi: belum tahu sudah login atau belum
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-card">
        <StatusBar style="dark" />
        <QueryErrorState
          className="flex-1"
          title="Tidak dapat terhubung ke server"
          error={error}
          onRetry={() => void refetch()}
          isRetrying={isRefetching}
        />
      </SafeAreaView>
    )
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.primary },
        // Layar bertumpuk (detail, edit) masuk dari kanan dengan parallax dan bayangan, dianimasikan native
        animation: "ios_from_right",
        gestureEnabled: true,
      }}
    >
      <Stack.Protected guard={!!user}>
        {/* Masuk/keluar akun berganti seluruh layar: cross-fade, bukan geser */}
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
        <Stack.Screen name="reports/[id]/index" />
        <Stack.Screen name="reports/[id]/edit" />
      </Stack.Protected>
      {/* Didaftarkan langsung (bukan grup) agar pengalihan saat belum masuk selalu jatuh ke layar masuk */}
      <Stack.Protected guard={!user}>
        {/* Masuk dan daftar berbagi panel hijau yang sama, jadi cross-fade membuatnya tampak satu layar */}
        <Stack.Screen name="login" options={{ animation: "fade" }} />
        <Stack.Screen name="register" options={{ animation: "fade" }} />
      </Stack.Protected>
    </Stack>
  )
}
