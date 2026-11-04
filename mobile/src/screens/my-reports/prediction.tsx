import type { AnyFieldApi } from "@tanstack/react-form"
import { CheckIcon, CircleAlertIcon, ScanSearchIcon } from "lucide-react-native"
import { ActivityIndicator, Pressable, View } from "react-native"

import { getFieldErrors } from "@/components/common/form-fields"
import { FieldDescription, FieldError } from "@/components/ui/field"
import { Text } from "@/components/ui/text"
import { type WasteCategory, wasteCategoryLabels, wasteCategoryOptions } from "@/lib/enums/report"
import { formatPercent } from "@/lib/format"
import { ApiError } from "@/lib/http"
import { colors } from "@/lib/theme"
import type { Prediction } from "@/lib/types/report"
import { cn } from "@/lib/utils"

type PredictionResultProps = {
  isPending: boolean
  error: unknown
  prediction: Prediction | null
  /** Jumlah kemungkinan yang ditampilkan; 6 = semua kategori (layar Cek Sampah). */
  limit?: number
}

/** Hasil model klasifikasi untuk foto yang baru dipilih, tepat di bawah foto. */
export function PredictionResult({ isPending, error, prediction, limit = 3 }: PredictionResultProps) {
  if (isPending) {
    return (
      <View className="h-16 flex-row items-center gap-3 rounded-xl bg-secondary px-4">
        <ActivityIndicator size="small" color={colors.primary} />
        <Text variant="body-md" className="text-secondary-foreground">
          Model klasifikasi sedang mengenali foto...
        </Text>
      </View>
    )
  }

  if (error) {
    const message =
      error instanceof ApiError && error.status === 503
        ? "Model klasifikasi sedang tidak tersedia. Pilih jenis sampah di bawah."
        : "Foto tidak bisa dikenali model klasifikasi. Pilih jenis sampah di bawah."
    return (
      <View className="flex-row items-center gap-3 rounded-xl bg-muted px-4 py-3">
        <CircleAlertIcon size={20} color={colors.mutedForeground} />
        <Text variant="body-md" className="flex-1 text-muted-foreground">
          {message}
        </Text>
      </View>
    )
  }

  if (!prediction) return null

  const topCategories = (Object.entries(prediction.probabilities) as [WasteCategory, number][]).sort(([, a], [, b]) => b - a).slice(0, limit)

  if (!prediction.recognized || !prediction.category) {
    return (
      <View className="gap-1 rounded-xl bg-secondary p-4">
        <Text variant="title-sm" className="text-secondary-foreground">
          Model klasifikasi belum yakin
        </Text>
        <Text variant="body-sm" className="text-secondary-foreground/80">
          Keyakinan tertinggi {formatPercent(prediction.confidence)}, di bawah ambang {formatPercent(prediction.threshold)}. Pilih jenis
          sampah di bawah, atau biarkan admin yang menentukan.
        </Text>
      </View>
    )
  }

  return (
    <View className="gap-4 rounded-xl bg-primary p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white/15">
          <ScanSearchIcon size={22} color={colors.primaryForeground} />
        </View>
        <View className="flex-1">
          <Text variant="body-sm" className="text-primary-muted">
            Hasil model klasifikasi
          </Text>
          <Text variant="title-lg" className="text-primary-foreground">
            {wasteCategoryLabels[prediction.category]}
          </Text>
        </View>
        <View className="rounded-full bg-card px-3 py-1">
          <Text variant="label-lg" className="text-primary" style={{ fontVariant: ["tabular-nums"] }}>
            {formatPercent(prediction.confidence)}
          </Text>
        </View>
      </View>

      <View className="gap-2 rounded-lg bg-primary-deep/50 px-3 py-3">
        {topCategories.map(([category, probability]) => (
          <View key={category} className="flex-row items-center gap-3">
            <Text variant="body-sm" className="w-16 text-primary-foreground">
              {wasteCategoryLabels[category]}
            </Text>
            <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
              <View className="h-full rounded-full bg-card" style={{ width: `${probability * 100}%` }} />
            </View>
            <Text variant="body-sm" className="w-9 text-right text-primary-muted" style={{ fontVariant: ["tabular-nums"] }}>
              {formatPercent(probability)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

/**
 * Chip pilihan jenis sampah. Chip pertama = ikuti hasil model klasifikasi (nilai kosong).
 * Bila model tidak yakin dan dibiarkan kosong, laporan tersimpan tanpa kategori dan admin yang menentukan.
 */
export function CategoryField({ field, prediction }: { field: AnyFieldApi; prediction: Prediction | null }) {
  const errors = getFieldErrors(field)
  const modelCategory = prediction?.recognized ? prediction.category : null
  const value = field.state.value as WasteCategory | ""

  const options: { value: WasteCategory | ""; label: string }[] = [
    { value: "", label: modelCategory ? `${wasteCategoryLabels[modelCategory]} (hasil model)` : "Biar admin yang menentukan" },
    ...wasteCategoryOptions.filter((option) => option.value !== modelCategory),
  ]

  return (
    <View className="gap-3">
      <View accessibilityRole="radiogroup" accessibilityLabel="Jenis sampah" className="flex-row flex-wrap gap-2 px-5">
        {options.map((option) => {
          const isSelected = option.value === value
          return (
            <Pressable
              key={option.value || "model"}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              onPress={() => field.handleChange(option.value)}
              hitSlop={{ top: 6, bottom: 6 }}
              className={cn(
                "h-9 flex-row items-center gap-1.5 rounded-full",
                isSelected ? "bg-primary pl-3 pr-4" : "bg-muted px-4 active:bg-secondary",
              )}
            >
              {isSelected && <CheckIcon size={16} color={colors.primaryForeground} />}
              <Text variant="label-lg" className={isSelected ? "text-primary-foreground" : "text-foreground"}>
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
      <View className="px-5">
        <FieldDescription>
          {modelCategory ? "Ganti hanya jika hasil model klasifikasi kurang tepat." : "Pilih jika kamu tahu jenis sampahnya."}
        </FieldDescription>
        <FieldError errors={errors} />
      </View>
    </View>
  )
}
