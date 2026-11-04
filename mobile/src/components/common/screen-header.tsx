import { useRouter } from "expo-router"
import { ArrowLeftIcon } from "lucide-react-native"
import type { ReactNode } from "react"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { IconButton } from "@/components/ui/icon-button"
import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"

type ScreenHeaderProps = {
  title: string
  subtitle?: string
  /** Tampilkan tombol kembali di kiri judul, untuk layar di luar tab (misalnya detail laporan). */
  showBack?: boolean
  /** Tombol ikon putih di kanan judul (`IconButton tone="onPrimary"`). */
  actions?: ReactNode
  /** Isi tambahan di bawah judul, misalnya ringkasan atau filter. */
  children?: ReactNode
}

/**
 * Header hijau solid di bagian atas setiap layar. Bagian bawahnya diberi ruang ekstra
 * karena `Sheet` putih naik menimpanya dengan sudut membulat.
 */
export function ScreenHeader({ title, subtitle, showBack = false, actions, children }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  return (
    <View style={{ paddingTop: insets.top }} className="bg-primary pb-10">
      <View className={cn("min-h-16 flex-row items-center gap-1 pr-2 pt-2", showBack ? "pl-1" : "pl-5")}>
        {showBack && (
          <IconButton
            tone="onPrimary"
            accessibilityLabel="Kembali"
            icon={(props) => <ArrowLeftIcon {...props} />}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            className="self-start"
          />
        )}
        <View className={cn("flex-1 gap-1 py-2", showBack && "pl-1")}>
          <Text variant="headline" accessibilityRole="header" numberOfLines={1} className="text-primary-foreground">
            {title}
          </Text>
          {subtitle && (
            <Text variant="body-md" className="text-primary-muted">
              {subtitle}
            </Text>
          )}
        </View>
        {actions && <View className="flex-row items-center self-start pt-1">{actions}</View>}
      </View>
      {children && <View className="px-5 pt-4">{children}</View>}
    </View>
  )
}

/** Lembar putih yang naik menimpa `ScreenHeader`; isi utama layar berada di dalamnya. */
export function Sheet({ children }: { children: ReactNode }) {
  return <View className="-mt-6 flex-1 overflow-hidden rounded-t-sheet bg-card">{children}</View>
}
