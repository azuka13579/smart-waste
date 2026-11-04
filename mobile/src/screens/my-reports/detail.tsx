import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Image } from "expo-image"
import { useLocalSearchParams, useRouter } from "expo-router"
import { CircleCheckIcon, FileXIcon, MapPinIcon, PencilIcon, Trash2Icon } from "lucide-react-native"
import { type ReactNode, useState } from "react"
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, View } from "react-native"

import { QueryErrorState } from "@/components/common/query-error-state"
import { ScreenHeader, Sheet } from "@/components/common/screen-header"
import { SectionHeader } from "@/components/common/section-header"
import { STATUS_DOT } from "@/components/common/status-badge"
import { StatusTimeline } from "@/components/common/status-timeline"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { IconButton } from "@/components/ui/icon-button"
import { Text } from "@/components/ui/text"
import { ROUTES } from "@/lib/constants"
import { ReportStatus, reportStatusLabels, wasteCategoryLabels } from "@/lib/enums/report"
import { formatCoordinates, formatDateTime, formatPercent, getMapsUrl } from "@/lib/format"
import { ApiError, getErrorMessage } from "@/lib/http"
import { deleteMyReport, getMyReportById } from "@/lib/services/my-report"
import { showSnackbar } from "@/lib/snackbar"
import { colors } from "@/lib/theme"
import type { ReportDetail } from "@/lib/types/report"
import { cn } from "@/lib/utils"

/** Arti setiap status dari sudut pandang pelapor. */
const STATUS_MEANING: Record<ReportStatus, string> = {
  [ReportStatus.Pending]: "Menunggu ditinjau admin.",
  [ReportStatus.InProgress]: "Admin sedang menindaklanjuti laporan ini.",
  [ReportStatus.Completed]: "Sampah sudah ditangani. Terima kasih sudah melapor.",
  [ReportStatus.Rejected]: "Laporan tidak ditindaklanjuti. Lihat catatan admin di riwayat status.",
}

export default function ReportDetailScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  // `created=1` dikirim layar Lapor setelah laporan berhasil dikirim
  const { id, created } = useLocalSearchParams<{ id: string; created?: string }>()

  const reportQuery = useQuery({ queryKey: ["my-reports", "detail", id], queryFn: () => getMyReportById(id) })
  const report = reportQuery.data?.data

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: () => deleteMyReport(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["my-reports", "detail", id] })
      void queryClient.invalidateQueries({ queryKey: ["my-reports"] })
      setIsDeleteOpen(false)
      showSnackbar("Laporan dihapus")
      router.canGoBack() ? router.back() : router.replace(ROUTES.MY_REPORTS)
    },
    onError: (error) => {
      setIsDeleteOpen(false)
      showSnackbar(`Laporan gagal dihapus. ${getErrorMessage(error)}`, { tone: "error" })
    },
  })

  // Hanya laporan yang masih Pending boleh diubah atau dihapus pelapor (backend membalas 409 untuk status lain)
  const canEdit = report?.status === ReportStatus.Pending

  return (
    <View className="flex-1 bg-primary">
      <ScreenHeader
        showBack
        title={report ? (report.category ? `Sampah ${wasteCategoryLabels[report.category].toLowerCase()}` : "Detail laporan") : "Detail laporan"}
        subtitle={report ? `Dilaporkan ${formatDateTime(report.createdAt)}` : undefined}
        actions={
          canEdit && (
            <>
              <IconButton
                tone="onPrimary"
                accessibilityLabel="Edit laporan"
                icon={(props) => <PencilIcon {...props} />}
                onPress={() => router.push(ROUTES.REPORT_EDIT(id))}
              />
              <IconButton
                tone="onPrimary"
                accessibilityLabel="Hapus laporan"
                icon={(props) => <Trash2Icon {...props} />}
                onPress={() => setIsDeleteOpen(true)}
                disabled={deleteMutation.isPending}
              />
            </>
          )
        }
      />
      <Sheet>
        {reportQuery.isPending ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : reportQuery.error || !report ? (
          <ReportLoadError error={reportQuery.error} onRetry={() => void reportQuery.refetch()} isRetrying={reportQuery.isRefetching} />
        ) : (
          <ScrollView
            contentContainerClassName="pb-10 pt-6"
            refreshControl={
              <RefreshControl refreshing={reportQuery.isRefetching} onRefresh={() => void reportQuery.refetch()} colors={[colors.primary]} tintColor={colors.primary} />
            }
          >
            {created === "1" && (
              <View className="mx-5 mb-4 flex-row items-center gap-3 rounded-xl bg-primary px-4 py-3">
                <CircleCheckIcon size={22} color={colors.primaryForeground} />
                <Text variant="title-sm" className="flex-1 text-primary-foreground">
                  Laporan terkirim dan menunggu ditinjau admin.
                </Text>
              </View>
            )}

            <View className="mx-5 overflow-hidden rounded-xl bg-muted">
              <Image source={{ uri: report.photoUrl }} accessibilityLabel="Foto laporan" contentFit="cover" transition={150} style={{ width: "100%", aspectRatio: 4 / 3 }} />
            </View>

            <StatusCard report={report} />

            <SectionHeader title="Deskripsi" />
            <Text variant="body-lg" className="px-5">
              {report.description}
            </Text>

            <SectionHeader title="Informasi" />
            <View className="mx-5 rounded-xl border border-border">
              <InfoRow label="Jenis sampah">
                <Text variant="title-sm">{report.category ? wasteCategoryLabels[report.category] : "Belum dikategorikan"}</Text>
              </InfoRow>
              <InfoRow label="Hasil model klasifikasi" divided>
                <ModelResult report={report} />
              </InfoRow>
              <InfoRow label="Lokasi" divided>
                <Pressable
                  accessibilityRole="link"
                  accessibilityHint="Membuka lokasi di aplikasi peta"
                  onPress={() => void Linking.openURL(getMapsUrl(report.latitude, report.longitude))}
                  className="gap-1"
                >
                  {report.address && <Text variant="body-md">{report.address}</Text>}
                  <View className="flex-row items-center gap-1">
                    <MapPinIcon size={14} color={colors.primary} />
                    <Text variant="label-lg" className="text-primary" style={{ fontVariant: ["tabular-nums"] }}>
                      {formatCoordinates(report.latitude, report.longitude)}
                    </Text>
                  </View>
                </Pressable>
              </InfoRow>
              <InfoRow label="Terakhir diperbarui" divided>
                <Text variant="body-md">{formatDateTime(report.updatedAt)}</Text>
              </InfoRow>
            </View>

            <SectionHeader title="Riwayat status" />
            <View className="px-5">
              <StatusTimeline logs={report.statusLogs} />
            </View>
          </ScrollView>
        )}
      </Sheet>

      <ConfirmDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
        tone="destructive"
        icon={<Trash2Icon size={26} color={colors.destructive} />}
        title="Hapus laporan ini?"
        description="Laporan yang dihapus tidak bisa dikembalikan."
        confirmLabel="Hapus laporan"
      />
    </View>
  )
}

/** Status saat ini dalam kartu hijau-pucat, dengan arti status itu bagi pelapor. */
function StatusCard({ report }: { report: ReportDetail }) {
  return (
    <View className="mx-5 mt-4 flex-row items-center gap-4 rounded-xl bg-secondary px-4 py-4">
      <View className="h-11 w-11 items-center justify-center rounded-full bg-card">
        <View className={cn("h-3.5 w-3.5 rounded-full", STATUS_DOT[report.status])} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text variant="body-sm" className="text-secondary-foreground/80">
          Status laporan
        </Text>
        <Text variant="title-lg" className="text-secondary-foreground">
          {reportStatusLabels[report.status]}
        </Text>
        <Text variant="body-sm" className="text-secondary-foreground">
          {STATUS_MEANING[report.status]}
        </Text>
      </View>
    </View>
  )
}

function InfoRow({ label, divided = false, children }: { label: string; divided?: boolean; children: ReactNode }) {
  return (
    <View className={cn("gap-1 px-4 py-3", divided && "border-t border-border")}>
      <Text variant="body-sm" className="text-muted-foreground">
        {label}
      </Text>
      {children}
    </View>
  )
}

/** Hasil model saat laporan dibuat, terpisah dari jenis sampah akhir yang bisa dikoreksi admin. */
function ModelResult({ report }: { report: ReportDetail }) {
  if (report.modelConfidence === null) {
    return (
      <Text variant="body-md" className="text-muted-foreground">
        Model klasifikasi tidak dijalankan
      </Text>
    )
  }

  if (!report.modelCategory) {
    return (
      <Text variant="body-md" className="text-muted-foreground">
        Tidak dikenali (keyakinan {formatPercent(report.modelConfidence)})
      </Text>
    )
  }

  const isCorrected = report.category !== null && report.category !== report.modelCategory
  return (
    <Text variant="body-md">
      {wasteCategoryLabels[report.modelCategory]}{" "}
      <Text variant="body-md" className="text-muted-foreground" style={{ fontVariant: ["tabular-nums"] }}>
        {formatPercent(report.modelConfidence)}
        {isCorrected ? " · dikoreksi" : ""}
      </Text>
    </Text>
  )
}

/** Laporan gagal dimuat: 404 (sudah dihapus) atau error lain. */
function ReportLoadError({ error, onRetry, isRetrying }: { error: unknown; onRetry: () => void; isRetrying: boolean }) {
  const router = useRouter()

  if (error instanceof ApiError && error.status === 404) {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <FileXIcon size={26} color={colors.secondaryForeground} />
        </View>
        <View className="items-center gap-1">
          <Text variant="title-md">Laporan tidak ditemukan</Text>
          <Text variant="body-md" className="text-center text-muted-foreground">
            Laporan mungkin sudah dihapus.
          </Text>
        </View>
        <Button variant="outline" size="sm" onPress={() => router.replace(ROUTES.MY_REPORTS)}>
          Ke Laporan Saya
        </Button>
      </View>
    )
  }

  return <QueryErrorState className="flex-1" error={error} onRetry={onRetry} isRetrying={isRetrying} />
}
