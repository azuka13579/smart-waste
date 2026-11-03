import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { InboxIcon } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"

import { BreakdownList } from "@/components/common/breakdown-list"
import { DailyTrendChart } from "@/components/common/daily-trend-chart"
import { EmptyState } from "@/components/common/empty-state"
import { FilterSelect } from "@/components/common/filter-select"
import { Panel, PanelHeader, PanelSection } from "@/components/common/panel"
import { QueryErrorState } from "@/components/common/query-error-state"
import { ReportListItem } from "@/components/common/report-list-item"
import { Stat, StatGroup } from "@/components/common/stat-card"
import { getStatusDotClass } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ROUTES } from "@/lib/constants"
import { ReportStatus, reportStatusLabels, reportStatusOptions, wasteCategoryOptions } from "@/lib/enums/report"
import { formatNumber, formatPercent, formatRelative } from "@/lib/format"
import { getReports } from "@/lib/services/report"
import { getStatistics } from "@/lib/services/statistics"
import { useSession } from "@/lib/session"

const RANGE_OPTIONS = [
  { value: "7", label: "7 hari terakhir" },
  { value: "30", label: "30 hari terakhir" },
  { value: "90", label: "90 hari terakhir" },
]

const reportsWith = (params: Record<string, string>) => `${ROUTES.REPORT.INDEX}?${new URLSearchParams(params).toString()}`

export default function DashboardPage() {
  const { user } = useSession()
  const [days, setDays] = useState("30")
  const [trendStatus, setTrendStatus] = useState<ReportStatus | "">("")

  // Angka total dan rincian tidak dipengaruhi filter grafik, jadi dimuat terpisah agar tidak ikut berkedip
  const statisticsQuery = useQuery({ queryKey: ["statistics", { days: 1 }], queryFn: () => getStatistics({ days: 1 }) })
  const trendQuery = useQuery({
    queryKey: ["statistics", { days: Number(days), status: trendStatus }],
    queryFn: () => getStatistics({ days: Number(days), status: trendStatus || undefined }),
    placeholderData: keepPreviousData,
  })
  const pendingQuery = useQuery({
    queryKey: ["reports", { status: ReportStatus.Pending, page: 1, limit: 5 }],
    queryFn: () => getReports({ status: ReportStatus.Pending, page: 1, limit: 5 }),
  })

  const stats = statisticsQuery.data?.data
  const isLoading = statisticsQuery.isPending
  const daily = trendQuery.data?.data.daily ?? []
  const trendTotal = daily.reduce((sum, day) => sum + day.count, 0)
  const pendingReports = pendingQuery.data?.data ?? []

  const statusItems = reportStatusOptions.map((option) => ({
    key: option.value,
    label: option.label,
    value: stats?.byStatus[option.value] ?? 0,
    marker: getStatusDotClass(option.value),
    href: reportsWith({ status: option.value }),
  }))

  const categoryItems = [
    ...wasteCategoryOptions.map((option) => ({
      key: option.value,
      label: option.label,
      value: stats?.byCategory[option.value] ?? 0,
      href: reportsWith({ category: option.value }),
    })),
    { key: "uncategorized", label: "Belum dikategorikan", value: stats?.byCategory.uncategorized ?? 0 },
  ].sort((a, b) => b.value - a.value)

  return (
    <>
      <Panel>
        <PanelHeader title="Dashboard" description={user ? `Ringkasan laporan sampah · ${user.name}` : "Ringkasan laporan sampah"} />
      </Panel>

      {/* KPI, status, jenis sampah, dan kinerja model berasal dari satu request; saat gagal, tampilkan satu error, bukan angka 0 */}
      {statisticsQuery.isError ? (
        <Panel>
          <QueryErrorState
            subject="statistik"
            error={statisticsQuery.error}
            onRetry={() => statisticsQuery.refetch()}
            isRetrying={statisticsQuery.isFetching}
          />
        </Panel>
      ) : (
        <StatGroup>
          <Stat label="Total laporan" value={formatNumber(stats?.totals.reports ?? 0)} isLoading={isLoading} />
          <Stat label="Laporan hari ini" value={formatNumber(stats?.totals.reportsToday ?? 0)} isLoading={isLoading} />
          <Stat label="Menunggu penanganan" value={formatNumber(stats?.byStatus.pending ?? 0)} isLoading={isLoading} />
          <Stat label="User terdaftar" value={formatNumber(stats?.totals.users ?? 0)} isLoading={isLoading} />
        </StatGroup>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelSection className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold">Laporan masuk per hari</h2>
              <p className="text-sm text-muted-foreground">
                {trendQuery.isPending
                  ? "Memuat..."
                  : trendQuery.isError
                    ? "Data tren tidak tersedia"
                    : `${formatNumber(trendTotal)} laporan${trendStatus ? ` berstatus ${reportStatusLabels[trendStatus]}` : ""} dalam ${days} hari terakhir`}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <FilterSelect
                value={trendStatus}
                onChange={setTrendStatus}
                options={reportStatusOptions}
                allLabel="Semua status"
                label="Filter status grafik"
              />
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger className="w-full sm:w-44" aria-label="Rentang waktu">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </PanelSection>
          <PanelSection className="py-4">
            {trendQuery.isError && !trendQuery.data ? (
              <QueryErrorState
                subject="data tren"
                error={trendQuery.error}
                onRetry={() => trendQuery.refetch()}
                isRetrying={trendQuery.isFetching}
              />
            ) : (
              <DailyTrendChart data={daily} isLoading={trendQuery.isPending} />
            )}
          </PanelSection>
        </Panel>

        {!statisticsQuery.isError && (
          <Panel>
            <PanelSection>
              <h2 className="font-semibold">Status laporan</h2>
              <p className="text-sm text-muted-foreground">Seluruh laporan</p>
            </PanelSection>
            <PanelSection className="py-4">
              <BreakdownList items={statusItems} isLoading={isLoading} />
            </PanelSection>
          </Panel>
        )}
      </div>

      {!statisticsQuery.isError && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelSection>
              <h2 className="font-semibold">Jenis sampah</h2>
              <p className="text-sm text-muted-foreground">Kategori akhir setiap laporan</p>
            </PanelSection>
            <PanelSection className="py-4">
              <BreakdownList items={categoryItems} isLoading={isLoading} />
            </PanelSection>
          </Panel>

          <Panel>
            <PanelSection>
              <h2 className="font-semibold">Kinerja model klasifikasi</h2>
              <p className="text-sm text-muted-foreground">Seberapa sering kategori dari model tidak dikoreksi</p>
            </PanelSection>
            <PanelSection className="py-4">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
                  <ModelFigure
                    label="Tingkat kesesuaian"
                    value={stats?.model.agreementRate != null ? formatPercent(stats.model.agreementRate) : "–"}
                  />
                  <ModelFigure label="Terdeteksi model" value={formatNumber(stats?.model.predicted ?? 0)} />
                  <ModelFigure label="Sesuai" value={formatNumber(stats?.model.agreed ?? 0)} />
                  <ModelFigure label="Tidak dikenali" value={formatNumber(stats?.model.notRecognized ?? 0)} />
                </dl>
              )}
            </PanelSection>
          </Panel>
        </div>
      )}

      <Panel>
        <PanelSection className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Laporan terbaru</h2>
            <p className="text-sm text-muted-foreground">Laporan yang belum ditangani</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to={reportsWith({ status: ReportStatus.Pending })}>
              Lihat semua
            </Link>
          </Button>
        </PanelSection>
        {pendingQuery.isPending ? (
          <PanelSection className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </PanelSection>
        ) : pendingQuery.isError ? (
          <QueryErrorState
            subject="laporan pending"
            error={pendingQuery.error}
            onRetry={() => pendingQuery.refetch()}
            isRetrying={pendingQuery.isFetching}
          />
        ) : pendingReports.length === 0 ? (
          <EmptyState icon={InboxIcon} title="Tidak ada laporan pending" description="Semua laporan sudah ditindaklanjuti." />
        ) : (
          <ul className="divide-y">
            {pendingReports.map((report) => (
              <ReportListItem
                key={report.id}
                report={report}
                to={ROUTES.REPORT.READ(report.id)}
                trailing={
                  <>
                    <span className="hidden shrink-0 text-sm text-muted-foreground sm:block">{report.user.name}</span>
                    <span className="w-28 shrink-0 text-right text-xs text-muted-foreground">{formatRelative(report.createdAt)}</span>
                  </>
                }
              />
            ))}
          </ul>
        )}
      </Panel>
    </>
  )
}

function ModelFigure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-semibold tracking-tight tabular-nums">{value}</dd>
    </div>
  )
}
