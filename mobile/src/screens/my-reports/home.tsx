import { useQuery } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import { CameraIcon, ChevronRightIcon, InboxIcon } from "lucide-react-native"
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from "react-native"

import { QueryErrorState } from "@/components/common/query-error-state"
import { ReportListItem } from "@/components/common/report-list-item"
import { ScreenHeader, Sheet } from "@/components/common/screen-header"
import { SectionHeader } from "@/components/common/section-header"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { ROUTES } from "@/lib/constants"
import { ReportStatus } from "@/lib/enums/report"
import { formatNumber } from "@/lib/format"
import { getMyReports, getMyReportSummary } from "@/lib/services/my-report"
import { useSession } from "@/lib/session"
import { colors } from "@/lib/theme"

const RECENT_LIMIT = 5

export default function HomeScreen() {
  const router = useRouter()
  const { user } = useSession()

  // Key diawali "my-reports" agar ikut diperbarui setelah laporan baru dikirim
  const summaryQuery = useQuery({ queryKey: ["my-reports", "summary"], queryFn: getMyReportSummary })
  const recentQuery = useQuery({ queryKey: ["my-reports", "list", { limit: RECENT_LIMIT }], queryFn: () => getMyReports({ limit: RECENT_LIMIT }) })

  const refresh = () => Promise.all([summaryQuery.refetch(), recentQuery.refetch()])
  const firstName = user?.name.split(" ")[0] ?? ""
  const summary = summaryQuery.data?.data
  const reports = recentQuery.data?.data ?? []

  return (
    <View className="flex-1 bg-primary">
      <ScreenHeader
        title={`Halo, ${firstName}`}
        subtitle="Pantau laporanmu dan laporkan sampah baru."
      >
        <View className="flex-row rounded-xl bg-primary-deep/60 py-3">
          <SummaryStat label="Total laporan" value={summary?.total} />
          <SummaryStat label="Menunggu" value={summary?.byStatus[ReportStatus.Pending]} divided />
          <SummaryStat label="Selesai" value={summary?.byStatus[ReportStatus.Completed]} divided />
        </View>
      </ScreenHeader>

      <Sheet>
        <ScrollView
          contentContainerClassName="pb-8 pt-5"
          refreshControl={<RefreshControl refreshing={recentQuery.isRefetching} onRefresh={() => void refresh()} colors={[colors.primary]} tintColor={colors.primary} />}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => router.navigate(ROUTES.NEW_REPORT)}
            className="mx-5 flex-row items-center gap-4 rounded-xl bg-secondary p-4 active:bg-primary/15"
          >
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
              <CameraIcon size={22} color={colors.primaryForeground} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text variant="title-md" className="text-secondary-foreground">
                Buat laporan baru
              </Text>
              <Text variant="body-sm" className="text-secondary-foreground/80">
                Foto, tandai lokasi, lalu kirim.
              </Text>
            </View>
            <ChevronRightIcon size={20} color={colors.secondaryForeground} />
          </Pressable>

          <SectionHeader
            title="Laporan terbaru"
            action={
              reports.length > 0 && (
                <Button variant="text" size="sm" onPress={() => router.navigate(ROUTES.MY_REPORTS)}>
                  Lihat semua
                </Button>
              )
            }
          />
          <RecentReports
            reports={reports}
            isLoading={recentQuery.isPending}
            error={recentQuery.error}
            onRetry={() => void recentQuery.refetch()}
            isRetrying={recentQuery.isRefetching}
            onOpen={(id) => router.push(ROUTES.REPORT(id))}
          />
        </ScrollView>
      </Sheet>
    </View>
  )
}

function SummaryStat({ label, value, divided = false }: { label: string; value: number | undefined; divided?: boolean }) {
  return (
    <View className={divided ? "flex-1 items-center border-l border-white/15" : "flex-1 items-center"}>
      <Text variant="title-lg" className="text-primary-foreground" style={{ fontVariant: ["tabular-nums"] }}>
        {value === undefined ? "–" : formatNumber(value)}
      </Text>
      <Text variant="body-sm" className="text-primary-muted">
        {label}
      </Text>
    </View>
  )
}

type RecentReportsProps = {
  reports: Parameters<typeof ReportListItem>[0]["report"][]
  isLoading: boolean
  error: unknown
  onRetry: () => void
  isRetrying: boolean
  onOpen: (id: string) => void
}

function RecentReports({ reports, isLoading, error, onRetry, isRetrying, onOpen }: RecentReportsProps) {
  if (isLoading) {
    return (
      <View className="items-center py-10">
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (error) return <QueryErrorState className="py-8" error={error} onRetry={onRetry} isRetrying={isRetrying} />

  if (reports.length === 0) {
    return (
      <View className="items-center gap-3 px-8 py-10">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <InboxIcon size={26} color={colors.secondaryForeground} />
        </View>
        <View className="items-center gap-1">
          <Text variant="title-md">Belum ada laporan</Text>
          <Text variant="body-md" className="text-center text-muted-foreground">
            Laporan yang kamu kirim akan muncul di sini beserta statusnya.
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View>
      {reports.map((report, index) => (
        <View key={report.id}>
          {index > 0 && <View className="ml-[96px] h-px bg-border" />}
          <ReportListItem report={report} onPress={() => onOpen(report.id)} />
        </View>
      ))}
    </View>
  )
}
