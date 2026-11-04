import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Image } from "expo-image"
import { useLocalSearchParams, useRouter } from "expo-router"
import { LockIcon } from "lucide-react-native"
import { type ComponentRef, useRef } from "react"
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, View } from "react-native"

import { FormErrorAlert } from "@/components/common/form-error-alert"
import { TextareaField, TextField } from "@/components/common/form-fields"
import { QueryErrorState } from "@/components/common/query-error-state"
import { ScreenHeader, Sheet } from "@/components/common/screen-header"
import { SectionHeader } from "@/components/common/section-header"
import { Button } from "@/components/ui/button"
import { ChoiceChip } from "@/components/ui/choice-chip"
import { Text } from "@/components/ui/text"
import { ReportStatus, reportStatusLabels, type WasteCategory, wasteCategoryOptions } from "@/lib/enums/report"
import { formatCoordinates } from "@/lib/format"
import { ApiError } from "@/lib/http"
import { type EditReportFormValues, editReportFormSchema, type UpdateReportPayload } from "@/lib/schemas/report"
import { getMyReportById, updateMyReport } from "@/lib/services/my-report"
import { showSnackbar } from "@/lib/snackbar"
import { colors } from "@/lib/theme"
import type { ReportDetail } from "@/lib/types/report"

/** Hanya kirim field yang berubah; backend menolak body kosong. */
function getChanges(report: ReportDetail, values: EditReportFormValues): UpdateReportPayload {
  const changes: UpdateReportPayload = {}
  if (values.description.trim() !== report.description) changes.description = values.description.trim()
  if ((values.address.trim() || null) !== report.address) changes.address = values.address.trim() || null
  if ((values.category || null) !== report.category) changes.category = values.category || null
  return changes
}

export default function EditReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  // Data biasanya sudah ada di cache dari layar detail
  const reportQuery = useQuery({ queryKey: ["my-reports", "detail", id], queryFn: () => getMyReportById(id) })
  const report = reportQuery.data?.data

  return (
    <View className="flex-1 bg-primary">
      <ScreenHeader showBack title="Edit laporan" subtitle="Foto dan lokasi tidak bisa diganti." />
      <Sheet>
        {reportQuery.isPending ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : reportQuery.error || !report ? (
          <QueryErrorState className="flex-1" error={reportQuery.error} onRetry={() => void reportQuery.refetch()} isRetrying={reportQuery.isRefetching} />
        ) : report.status !== ReportStatus.Pending ? (
          <NotEditable status={report.status} />
        ) : (
          <EditReportForm report={report} />
        )}
      </Sheet>
    </View>
  )
}

function EditReportForm({ report }: { report: ReportDetail }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null)

  const mutation = useMutation({
    mutationFn: (values: EditReportFormValues) => updateMyReport(report.id, getChanges(report, values)),
    onSuccess: (response) => {
      queryClient.setQueryData(["my-reports", "detail", report.id], response)
      void queryClient.invalidateQueries({ queryKey: ["my-reports"] })
      showSnackbar("Laporan diperbarui")
      router.back()
    },
    onError: () => scrollRef.current?.scrollTo({ y: 0, animated: true }),
  })

  const form = useForm({
    defaultValues: {
      description: report.description,
      address: report.address ?? "",
      category: report.category ?? "",
    } as EditReportFormValues,
    validators: { onChange: editReportFormSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value).catch(() => undefined)
    },
    onSubmitInvalid: () => scrollRef.current?.scrollTo({ y: 0, animated: true }),
  })

  const error = mutation.error
  const errorMessage = error instanceof ApiError && error.status === 409 ? "Laporan sudah mulai ditangani sehingga tidak bisa diubah lagi." : undefined

  return (
    <KeyboardAvoidingView className="flex-1" behavior="padding">
      <ScrollView ref={scrollRef} contentContainerClassName="pb-8 pt-6" keyboardShouldPersistTaps="handled">
        <FormErrorAlert error={error} message={errorMessage} className="mx-5 mb-5" />

        {/* Ringkasan bagian yang terkunci: foto dan titik lokasi */}
        <View className="mx-5 flex-row items-center gap-4 rounded-xl bg-muted p-3">
          <Image source={{ uri: report.thumbnailUrl || report.photoUrl }} contentFit="cover" style={{ width: 64, height: 64, borderRadius: 12 }} />
          <View className="flex-1 gap-0.5">
            <View className="flex-row items-center gap-1.5">
              <LockIcon size={14} color={colors.mutedForeground} />
              <Text variant="label-md" className="text-muted-foreground">
                Foto dan lokasi
              </Text>
            </View>
            <Text variant="body-sm" numberOfLines={2} style={{ fontVariant: ["tabular-nums"] }}>
              {formatCoordinates(report.latitude, report.longitude)}
            </Text>
          </View>
        </View>

        <SectionHeader title="Jenis sampah" />
        <form.Field
          name="category"
          children={(field) => (
            <View accessibilityRole="radiogroup" accessibilityLabel="Jenis sampah" className="flex-row flex-wrap gap-2 px-5">
              <ChoiceChip label="Belum dikategorikan" selected={field.state.value === ""} onPress={() => field.handleChange("")} />
              {wasteCategoryOptions.map((option) => (
                <ChoiceChip
                  key={option.value}
                  label={option.label}
                  selected={field.state.value === option.value}
                  onPress={() => field.handleChange(option.value as WasteCategory)}
                />
              ))}
            </View>
          )}
        />

        <SectionHeader title="Lokasi" />
        <View className="px-5">
          <form.Field
            name="address"
            children={(field) => <TextField field={field} label="Alamat atau patokan (opsional)" autoCapitalize="sentences" returnKeyType="done" />}
          />
        </View>

        <SectionHeader title="Keterangan" />
        <View className="px-5">
          <form.Field name="description" children={(field) => <TextareaField field={field} label="Deskripsi" maxLength={2000} autoCapitalize="sentences" />} />
        </View>
      </ScrollView>

      <View className="border-t border-border bg-card px-5 py-3">
        <form.Subscribe
          selector={(state) => ({ isSubmitting: state.isSubmitting, hasChanges: Object.keys(getChanges(report, state.values)).length > 0 })}
          children={({ isSubmitting, hasChanges }) => (
            <Button onPress={() => void form.handleSubmit()} isLoading={isSubmitting} disabled={!hasChanges}>
              {isSubmitting ? "Menyimpan..." : "Simpan perubahan"}
            </Button>
          )}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

/** Status sudah berubah sejak layar detail dibuka (admin mulai menangani laporan). */
function NotEditable({ status }: { status: ReportStatus }) {
  const router = useRouter()

  return (
    <View className="flex-1 items-center justify-center gap-4 px-8">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-secondary">
        <LockIcon size={26} color={colors.secondaryForeground} />
      </View>
      <View className="items-center gap-1">
        <Text variant="title-md">Laporan tidak bisa diubah</Text>
        <Text variant="body-md" className="text-center text-muted-foreground">
          Statusnya sudah {reportStatusLabels[status]}. Laporan hanya bisa diubah selama masih Pending.
        </Text>
      </View>
      <Button variant="outline" size="sm" onPress={() => router.back()}>
        Kembali
      </Button>
    </View>
  )
}
