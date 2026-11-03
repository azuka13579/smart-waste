import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { ClipboardListIcon, SearchXIcon } from "lucide-react"
import { useNavigate } from "react-router"

import { FilterSelect } from "@/components/common/filter-select"
import { Panel, PanelHeader, PanelSection } from "@/components/common/panel"
import { SearchInput } from "@/components/common/search-input"
import { EmptyState } from "@/components/common/empty-state"
import { DataTable } from "@/components/common/table/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useQueryParams } from "@/hooks/use-query-params"
import { ROUTES } from "@/lib/constants"
import { type ReportStatus, reportStatusOptions, type WasteCategory, wasteCategoryOptions } from "@/lib/enums/report"
import { getErrorMessage } from "@/lib/http"
import { formatNumber } from "@/lib/format"
import { getReports } from "@/lib/services/report"

import { reportColumns } from "./columns"

const PAGE_SIZE = 20
const FILTER_KEYS = ["search", "status", "category", "from", "to"] as const

export default function ReportsPage() {
  const navigate = useNavigate()
  const { values, page, setParams, resetParams, hasActiveFilters } = useQueryParams(FILTER_KEYS)

  const reportsQuery = useQuery({
    queryKey: ["reports", { ...values, page }],
    queryFn: () =>
      getReports({
        search: values.search || undefined,
        status: (values.status || undefined) as ReportStatus | undefined,
        category: (values.category || undefined) as WasteCategory | undefined,
        from: values.from || undefined,
        to: values.to || undefined,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  })

  const reports = reportsQuery.data?.data ?? []
  const pagination = reportsQuery.data?.meta?.pagination ?? null

  return (
    <Panel>
      <PanelHeader
        title="Laporan Sampah"
        description={
          pagination ? `${formatNumber(pagination.total)} laporan${hasActiveFilters ? " sesuai filter" : ""}` : "Memuat laporan..."
        }
      />

      <PanelSection className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={values.search}
          onSearch={(search) => setParams({ search })}
          placeholder="Cari deskripsi, alamat, atau pelapor"
          label="Cari laporan"
          className="sm:w-80"
        />
        <FilterSelect
          value={values.status as ReportStatus | ""}
          onChange={(status) => setParams({ status })}
          options={reportStatusOptions}
          allLabel="Semua status"
          label="Filter status"
        />
        <FilterSelect
          value={values.category as WasteCategory | ""}
          onChange={(category) => setParams({ category })}
          options={wasteCategoryOptions}
          allLabel="Semua kategori"
          label="Filter kategori"
        />
        <div className="flex items-center gap-2">
          <Input
            type="date"
            aria-label="Dari tanggal"
            value={values.from}
            max={values.to || undefined}
            onChange={(event) => setParams({ from: event.target.value })}
            className="w-full sm:w-38"
          />
          <span className="text-sm text-muted-foreground">–</span>
          <Input
            type="date"
            aria-label="Sampai tanggal"
            value={values.to}
            min={values.from || undefined}
            onChange={(event) => setParams({ to: event.target.value })}
            className="w-full sm:w-38"
          />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetParams}>
            Reset filter
          </Button>
        )}
      </PanelSection>

      <DataTable
        bordered={false}
        columns={reportColumns}
        data={reports}
        isLoading={reportsQuery.isPending}
        pagination={pagination}
        onPageChange={(next) => setParams({ page: next })}
        onRowClick={(report) => navigate(ROUTES.REPORT.READ(report.id))}
        getRowLabel={(report) => `Buka laporan: ${report.description}`}
        emptyState={
          reportsQuery.isError ? (
            <EmptyState icon={SearchXIcon} title="Gagal memuat laporan" description={getErrorMessage(reportsQuery.error)} />
          ) : hasActiveFilters ? (
            <EmptyState
              icon={SearchXIcon}
              title="Tidak ada laporan yang cocok"
              description="Ubah kata kunci atau filter yang dipakai."
              action={
                <Button variant="outline" size="sm" onClick={resetParams}>
                  Reset filter
                </Button>
              }
            />
          ) : (
            <EmptyState icon={ClipboardListIcon} title="Belum ada laporan" description="Laporan dari user akan muncul di sini." />
          )
        }
      />
    </Panel>
  )
}
