import { Image } from "expo-image"
import { CameraIcon, ImagesIcon, RefreshCwIcon } from "lucide-react-native"
import { useState } from "react"
import { ActivityIndicator, Alert, Pressable, View } from "react-native"

import { PermissionNotice } from "@/components/common/permission-notice"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { type PhotoSource, pickPhoto } from "@/lib/photo"
import type { LocalPhoto } from "@/lib/schemas/report"
import { colors } from "@/lib/theme"
import { cn } from "@/lib/utils"

type PhotoPickerProps = {
  value: LocalPhoto | null
  onChange: (photo: LocalPhoto) => void
  isInvalid?: boolean
}

const PERMISSION_MESSAGES: Record<PhotoSource, string> = {
  camera: "Akses kamera ditolak.",
  library: "Akses galeri ditolak.",
}

/**
 * Tile foto selebar lembar. Kosong: ketuk untuk membuka kamera (cara paling umum melapor dari lokasi),
 * dengan galeri sebagai pilihan kedua. Terisi: tombol "Ganti foto" di atas foto.
 */
export function PhotoPicker({ value, onChange, isInvalid = false }: PhotoPickerProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [denied, setDenied] = useState<{ source: PhotoSource; canAskAgain: boolean } | null>(null)
  const [error, setError] = useState(false)

  const handlePick = async (source: PhotoSource) => {
    setDenied(null)
    setError(false)
    setIsProcessing(true)
    try {
      const result = await pickPhoto(source)
      if (result.status === "picked") onChange(result.photo)
      if (result.status === "denied") setDenied({ source, canAskAgain: result.canAskAgain })
    } catch {
      setError(true)
    } finally {
      setIsProcessing(false)
    }
  }

  const chooseReplacement = () =>
    Alert.alert("Ganti foto", undefined, [
      { text: "Batal", style: "cancel" },
      { text: "Pilih dari galeri", onPress: () => void handlePick("library") },
      { text: "Ambil foto", onPress: () => void handlePick("camera") },
    ])

  return (
    <View className="gap-3">
      {value ? (
        <View className="overflow-hidden rounded-xl bg-muted">
          <Image
            source={{ uri: value.uri }}
            accessibilityLabel="Foto sampah yang akan dilaporkan"
            contentFit="cover"
            transition={150}
            style={{ width: "100%", aspectRatio: 4 / 3 }}
          />
          {isProcessing ? (
            <View className="absolute inset-0 items-center justify-center bg-black/40">
              <ActivityIndicator color={colors.primaryForeground} />
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ganti foto"
              onPress={chooseReplacement}
              className="absolute bottom-3 right-3 h-10 flex-row items-center gap-2 rounded-full bg-card px-4 active:bg-secondary"
            >
              <RefreshCwIcon size={16} color={colors.primary} />
              <Text variant="label-lg" className="text-primary">
                Ganti foto
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ambil foto sampah dengan kamera"
            onPress={() => void handlePick("camera")}
            disabled={isProcessing}
            style={{ aspectRatio: 4 / 3 }}
            className={cn(
              "w-full items-center justify-center gap-4 rounded-xl border-2 border-dashed border-primary/30 bg-secondary active:bg-primary/10",
              isInvalid && "border-destructive/60",
            )}
          >
            {isProcessing ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <View className="h-16 w-16 items-center justify-center rounded-full bg-primary">
                  <CameraIcon size={28} color={colors.primaryForeground} />
                </View>
                <View className="items-center gap-1 px-8">
                  <Text variant="title-md" className="text-secondary-foreground">
                    Ambil foto sampah
                  </Text>
                  <Text variant="body-sm" className="text-center text-secondary-foreground/80">
                    Potret dari dekat dengan cahaya cukup.
                  </Text>
                </View>
              </>
            )}
          </Pressable>
          <Button variant="outline" onPress={() => void handlePick("library")} disabled={isProcessing} icon={(props) => <ImagesIcon {...props} />}>
            Pilih dari galeri
          </Button>
        </>
      )}

      {denied && (
        <PermissionNotice message={PERMISSION_MESSAGES[denied.source]} canAskAgain={denied.canAskAgain} onRetry={() => void handlePick(denied.source)} />
      )}
      {error && (
        <Text variant="body-sm" className="text-destructive">
          Foto gagal diproses. Coba ambil ulang.
        </Text>
      )}
    </View>
  )
}
