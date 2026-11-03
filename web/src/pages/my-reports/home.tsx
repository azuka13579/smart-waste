import { useQuery } from "@tanstack/react-query"
import { CameraIcon, FileTextIcon } from "lucide-react"
import { Link } from "react-router"

import { EmptyState } from "@/components/common/empty-state"
import { Panel, PanelHeader, PanelSection } from "@/components/common/panel"
import { QueryErrorState } from "@/components/common/query-error-state"
import { ReportListItem } from "@/components/common/report-list-item"
import { Stat, StatGroup } from "@/components/common/stat-card"
import { ReportStatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ROUTES } from "@/lib/constants"
import { reportStatusOptions } from "@/lib/enums/report"
import { formatNumber, formatRelative } from "@/lib/format"
import { getMyReports, getMyReportSummary } from "@/lib/services/my-report"
import { useSession } from "@/lib/session"

export default function UserHomePage() {
  const { user } = useSession()

  const summaryQuery = useQuery({ queryKey: ["my-reports", "summary"], queryFn: getMyReportSummary })
  const recentQuery = useQuery({
    queryKey: ["my-reports", { page: 1, limit: 5 }],
    queryFn: () => getMyReports({ page: 1, limit: 5 }),
  })

  const summary = summaryQuery.data?.data
  const recentReports = recentQuery.data?.data ?? []

  const createButton = (
    <Button asChild>
      <Link to={ROUTES.MY_REPORT.CREATE}>
        <CameraIcon />
        Buat laporan
      </Link>
    </Button>
  )

  return (
    <>
      <Panel>
        <PanelHeader title="Beranda" description={user?.name} actions={createButton} />
      </Panel>

      {summaryQuery.isError ? (
        <Panel>
          <QueryErrorState
            subject="ringkasan laporan"
            error={summaryQuery.error}
            onRetry={() => summaryQuery.refetch()}
            isRetrying={summaryQuery.isFetching}
          />
        </Panel>
      ) : (
        <StatGroup className="lg:grid-cols-5">
          <Stat
            label="Total laporan"
            value={formatNumber(summary?.total ?? 0)}
            isLoading={summaryQuery.isPending}
            className="col-span-2 lg:col-span-1"
          />
          {reportStatusOptions.map((option) => (
            <Stat
              key={option.value}
              label={option.label}
              value={formatNumber(summary?.byStatus[option.value] ?? 0)}
              isLoading={summaryQuery.isPending}
            />
          ))}
        </StatGroup>
      )}

      <Panel>
        <PanelSection className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Laporan terbaru</h2>
            <p className="text-sm text-muted-foreground">Lima laporan terakhir yang kamu kirim</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to={ROUTES.MY_REPORT.INDEX}>Lihat semua</Link>
          </Button>
        </PanelSection>

        {recentQuery.isPending ? (
          <PanelSection className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </PanelSection>
        ) : recentQuery.isError ? (
          <QueryErrorState
            subject="laporan terbaru"
            error={recentQuery.error}
            onRetry={() => recentQuery.refetch()}
            isRetrying={recentQuery.isFetching}
          />
        ) : recentReports.length === 0 ? (
          <EmptyState
            icon={FileTextIcon}
            title="Belum ada laporan"
            description="Foto tumpukan sampah di sekitarmu dan kirim laporan pertama."
            action={createButton}
          />
        ) : (
          <ul className="divide-y">
            {recentReports.map((report) => (
              <ReportListItem
                key={report.id}
                report={report}
                to={ROUTES.MY_REPORT.READ(report.id)}
                trailing={
                  <>
                    <ReportStatusBadge status={report.status} className="hidden w-24 shrink-0 sm:inline-flex" />
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
