import { useMutation } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import { SendIcon } from "lucide-react-native"
import { useState } from "react"
import { ScrollView, View } from "react-native"

import { PhotoPicker } from "@/components/common/photo-picker"
import { ScreenHeader, Sheet } from "@/components/common/screen-header"
import { SectionHeader } from "@/components/common/section-header"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { ROUTES } from "@/lib/constants"
import { wasteCategoryOptions } from "@/lib/enums/report"
import type { LocalPhoto } from "@/lib/schemas/report"
import { predictWaste } from "@/lib/services/my-report"

import { PredictionResult } from "./my-reports/prediction"

/** Cek jenis sampah dari foto dengan model klasifikasi. Tidak menyimpan apa pun dan tidak membuat laporan. */
export default function CheckWasteScreen() {
  const router = useRouter()
  const [photo, setPhoto] = useState<LocalPhoto | null>(null)
  const predictMutation = useMutation({ mutationFn: predictWaste })

  const handlePhotoChange = (next: LocalPhoto) => {
    setPhoto(next)
    predictMutation.reset()
    predictMutation.mutate(next)
  }

  // Foto yang sama dibawa ke tab Lapor agar user tidak perlu memotret ulang
  const reportThisPhoto = () => {
    if (!photo) return
    router.navigate({
      pathname: ROUTES.NEW_REPORT,
      params: { photoUri: photo.uri, photoWidth: String(photo.width), photoHeight: String(photo.height) },
    })
  }

  return (
    <View className="flex-1 bg-primary">
      <ScreenHeader title="Cek sampah" subtitle="Kenali jenis sampah dari foto. Hasilnya tidak dikirim sebagai laporan." />
      <Sheet>
        <ScrollView contentContainerClassName="pb-10 pt-6">
          <View className="gap-3 px-5">
            <PhotoPicker value={photo} onChange={handlePhotoChange} />
            <PredictionResult
              isPending={predictMutation.isPending}
              error={predictMutation.error}
              prediction={predictMutation.data?.data ?? null}
              limit={wasteCategoryOptions.length}
            />
            {predictMutation.isSuccess && (
              <Button variant="tonal" onPress={reportThisPhoto} icon={(props) => <SendIcon {...props} />}>
                Laporkan sampah ini
              </Button>
            )}
          </View>

          {!photo && (
            <>
              <SectionHeader title="Jenis yang dikenali" description="Model klasifikasi membedakan enam jenis sampah." />
              <View className="flex-row flex-wrap gap-2 px-5">
                {wasteCategoryOptions.map((option) => (
                  <View key={option.value} className="h-9 justify-center rounded-full bg-secondary px-4">
                    <Text variant="label-lg" className="text-secondary-foreground">
                      {option.label}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </Sheet>
    </View>
  )
}
