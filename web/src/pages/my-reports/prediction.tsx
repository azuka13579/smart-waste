import type { AnyFieldApi } from "@tanstack/react-form"
import { CircleAlertIcon } from "lucide-react"

import { FilterSelect } from "@/components/common/filter-select"
import { getFieldErrors } from "@/components/common/form-fields"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { type WasteCategory, wasteCategoryLabels, wasteCategoryOptions } from "@/lib/enums/report"
import { formatPercent } from "@/lib/format"
import { ApiError } from "@/lib/http"
import type { Prediction } from "@/lib/types/report"

type PredictionResultProps = {
  isPending: boolean
  error: unknown
  prediction: Prediction | null
}

/** Hasil model untuk foto yang baru dipilih: kategori teratas, keyakinan, dan tiga kemungkinan teratas. */
export function PredictionResult({ isPending, error, prediction }: PredictionResultProps) {
  if (isPending) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-40" />
      </div>
    )
  }

  if (error) {
    const message =
      error instanceof ApiError && error.status === 503
        ? "Model sedang tidak tersedia. Pilih kategori secara manual."
        : "Foto tidak bisa diproses model. Pilih kategori secara manual."
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <CircleAlertIcon className="size-4" />
        {message}
      </p>
    )
  }

  if (!prediction) return null

  const topCategories = (Object.entries(prediction.probabilities) as [WasteCategory, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">Hasil model klasifikasi</span>
        {prediction.recognized && prediction.category ? (
          <p className="text-lg font-semibold">
            {wasteCategoryLabels[prediction.category]}
            <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">{formatPercent(prediction.confidence)}</span>
          </p>
        ) : (
          <p className="text-sm">
            <span className="font-semibold">Tidak dikenali.</span>{" "}
            <span className="text-muted-foreground">
              Keyakinan tertinggi {formatPercent(prediction.confidence)}, di bawah ambang {formatPercent(prediction.threshold)}. Pilih kategori di bawah.
            </span>
          </p>
        )}
      </div>
      <ul className="flex flex-col gap-1.5">
        {topCategories.map(([category, probability]) => (
          <li key={category} className="grid grid-cols-[80px_1fr_40px] items-center gap-3 text-xs">
            <span>{wasteCategoryLabels[category]}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-primary" style={{ width: `${probability * 100}%` }} />
            </span>
            <span className="text-right text-muted-foreground tabular-nums">{formatPercent(probability)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Kategori kosong = ikuti hasil model. Bila model tidak yakin dan dibiarkan kosong, laporan tersimpan tanpa kategori. */
export function CategoryField({ field, prediction }: { field: AnyFieldApi; prediction: Prediction | null }) {
  const errors = getFieldErrors(field)
  const modelCategory = prediction?.recognized ? prediction.category : null

  return (
    <Field data-invalid={errors.length > 0}>
      <FieldLabel>Kategori</FieldLabel>
      <FilterSelect
        value={field.state.value as WasteCategory | ""}
        onChange={(value) => field.handleChange(value)}
        options={wasteCategoryOptions}
        allLabel={modelCategory ? `Ikuti hasil model (${wasteCategoryLabels[modelCategory]})` : "Biarkan admin menentukan"}
        className="sm:w-full"
      />
      <FieldDescription>
        {modelCategory ? "Ganti hanya jika hasil model kurang tepat." : "Pilih jika kamu tahu jenis sampahnya."}
      </FieldDescription>
      <FieldError errors={errors} />
    </Field>
  )
}
