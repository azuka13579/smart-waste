import { MapPinIcon, RotateCwIcon } from "lucide-react-native"
import { useEffect, useState } from "react"
import { ActivityIndicator, Linking, Pressable, View } from "react-native"

import { PermissionNotice } from "@/components/common/permission-notice"
import { IconButton } from "@/components/ui/icon-button"
import { Text } from "@/components/ui/text"
import { formatCoordinates, getMapsUrl } from "@/lib/format"
import { getCurrentLocation } from "@/lib/location"
import { reverseGeocode } from "@/lib/services/geocoding"
import { colors } from "@/lib/theme"
import { cn } from "@/lib/utils"

type LocationValue = { latitude: number | null; longitude: number | null }

type LocationFieldProps = {
  value: LocationValue
  onChange: (value: { latitude: number; longitude: number }) => void
  /** Alamat hasil reverse geocoding, untuk mengisi kolom alamat bila masih kosong. */
  onAddressSuggestion?: (address: string) => void
  isInvalid?: boolean
}

type State =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "found"; accuracy: number | null }
  | { status: "denied"; canAskAgain: boolean }
  | { status: "disabled" }
  | { status: "error" }

/**
 * Titik laporan dari GPS HP sebagai baris dua baris (alamat + koordinat) di atas permukaan hijau-pucat.
 * Langsung dicari saat layar dibuka; ketuk baris untuk membuka peta, tombol kanan untuk memperbarui.
 */
export function LocationField({ value, onChange, onAddressSuggestion, isInvalid = false }: LocationFieldProps) {
  const [state, setState] = useState<State>({ status: "idle" })
  const [address, setAddress] = useState<string | null>(null)
  const hasLocation = value.latitude !== null && value.longitude !== null
  const isLocating = state.status === "locating"

  const locate = async () => {
    setState({ status: "locating" })
    try {
      const result = await getCurrentLocation()
      if (result.status !== "found") return setState(result)

      const { latitude, longitude, accuracy } = result.coordinates
      onChange({ latitude, longitude })
      setState({ status: "found", accuracy })

      const suggestion = await reverseGeocode(latitude, longitude).catch(() => null)
      setAddress(suggestion)
      if (suggestion) onAddressSuggestion?.(suggestion)
    } catch {
      setState({ status: "error" })
    }
  }

  useEffect(() => {
    if (!hasLocation) void locate()
    // Hanya sekali saat layar dibuka; selanjutnya lewat tombol perbarui
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const headline = isLocating && !hasLocation ? "Mencari lokasi..." : hasLocation ? (address ?? "Lokasi saat ini") : "Lokasi belum didapatkan"
  const supporting = hasLocation
    ? [formatCoordinates(value.latitude!, value.longitude!), state.status === "found" && state.accuracy !== null ? `±${Math.round(state.accuracy)} m` : null]
        .filter(Boolean)
        .join("  ·  ")
    : "Aktifkan GPS untuk menandai titik laporan"

  return (
    <View className="gap-3">
      <View
        className={cn(
          "min-h-[76px] flex-row items-center rounded-xl bg-secondary py-3 pl-4 pr-1",
          isInvalid && !hasLocation && "border border-destructive/60",
        )}
      >
        <Pressable
          accessibilityRole={hasLocation ? "link" : undefined}
          accessibilityHint={hasLocation ? "Membuka lokasi di aplikasi peta" : undefined}
          disabled={!hasLocation}
          onPress={() => void Linking.openURL(getMapsUrl(value.latitude!, value.longitude!))}
          className="flex-1 flex-row items-center gap-4"
        >
          <View className="h-11 w-11 items-center justify-center rounded-full bg-primary">
            {isLocating ? <ActivityIndicator size="small" color={colors.primaryForeground} /> : <MapPinIcon size={20} color={colors.primaryForeground} />}
          </View>
          <View className="flex-1 gap-0.5">
            <Text variant="title-sm" numberOfLines={2} className="text-secondary-foreground">
              {headline}
            </Text>
            <Text variant="body-sm" numberOfLines={1} className="text-secondary-foreground/75" style={{ fontVariant: ["tabular-nums"] }}>
              {supporting}
            </Text>
          </View>
        </Pressable>
        <IconButton
          accessibilityLabel={hasLocation ? "Perbarui lokasi" : "Cari lokasi"}
          icon={(props) => <RotateCwIcon {...props} />}
          color={colors.secondaryForeground}
          onPress={() => void locate()}
          disabled={isLocating}
        />
      </View>

      {state.status === "denied" && <PermissionNotice message="Akses lokasi ditolak." canAskAgain={state.canAskAgain} onRetry={() => void locate()} />}
      {state.status === "disabled" && (
        <Text variant="body-sm" className="text-destructive">
          GPS mati atau sinyal belum didapat. Aktifkan lokasi lalu ketuk tombol perbarui.
        </Text>
      )}
      {state.status === "error" && (
        <Text variant="body-sm" className="text-destructive">
          Lokasi gagal didapatkan. Coba lagi.
        </Text>
      )}
    </View>
  )
}
