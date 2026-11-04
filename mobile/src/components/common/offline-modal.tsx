import * as Network from "expo-network"
import { WifiOffIcon } from "lucide-react-native"
import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, Modal, View } from "react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { isOffline } from "@/lib/network"
import { showSnackbar } from "@/lib/snackbar"
import { colors } from "@/lib/theme"

/** Tunggu sebentar sebelum menampilkan modal, agar sinyal yang putus sesaat tidak membuat layar berkedip. */
const SHOW_DELAY_MS = 1500

/**
 * Modal "menyambungkan ulang" saat HP kehilangan internet. Tertutup sendiri begitu koneksi kembali;
 * query yang tertunda diulang otomatis oleh TanStack Query (lihat `lib/query-client.ts`).
 */
export function OfflineModal() {
  const network = Network.useNetworkState()
  const offline = isOffline(network)
  const [isVisible, setIsVisible] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const wasVisible = useRef(false)

  useEffect(() => {
    if (!offline) {
      setIsVisible(false)
      return
    }
    const timer = setTimeout(() => setIsVisible(true), SHOW_DELAY_MS)
    return () => clearTimeout(timer)
  }, [offline])

  // Beri tahu user saat koneksi pulih, hanya bila modal sempat tampil
  useEffect(() => {
    if (isVisible) wasVisible.current = true
    else if (wasVisible.current) {
      wasVisible.current = false
      showSnackbar("Koneksi tersambung kembali")
    }
  }, [isVisible])

  // Cek ulang manual; listener jaringan tetap yang menutup modal bila koneksi sudah pulih
  const checkNow = async () => {
    setIsChecking(true)
    const state = await Network.getNetworkStateAsync().catch(() => null)
    if (state && !isOffline(state)) setIsVisible(false)
    setIsChecking(false)
  }

  return (
    // Tidak bisa ditutup manual: aplikasi tidak berguna tanpa internet, modal hilang sendiri saat tersambung
    <Modal visible={isVisible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={() => undefined}>
      <View className="flex-1 items-center justify-center bg-black/45 px-8">
        <View accessibilityViewIsModal accessibilityLiveRegion="polite" className="w-full max-w-[360px] items-center rounded-sheet bg-card px-6 pb-5 pt-7">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <WifiOffIcon size={26} color={colors.secondaryForeground} />
          </View>
          <Text variant="title-lg" accessibilityRole="header" className="text-center">
            Tidak ada koneksi internet
          </Text>
          <Text variant="body-md" className="mt-2 text-center text-muted-foreground">
            Periksa WiFi atau data seluler. Data akan dimuat ulang otomatis begitu tersambung.
          </Text>

          <View className="mt-5 flex-row items-center gap-2.5 rounded-full bg-secondary px-4 py-2">
            <ActivityIndicator size="small" color={colors.primary} />
            <Text variant="label-lg" className="text-secondary-foreground">
              Menyambungkan ulang...
            </Text>
          </View>

          <Button variant="text" onPress={() => void checkNow()} isLoading={isChecking} className="mt-3 self-stretch">
            Coba sekarang
          </Button>
        </View>
      </View>
    </Modal>
  )
}
