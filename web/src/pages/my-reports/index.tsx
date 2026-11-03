import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { CameraIcon, FileTextIcon, SearchXIcon } from "lucide-react"
import { Link, useNavigate } from "react-router"

import { EmptyState } from "@/components/common/empty-state"
import { FilterSelect } from "@/components/common/filter-select"
import { Panel, PanelHeader, PanelSection } from "@/components/common/panel"
import { SearchInput } from "@/components/common/search-input"
import { DataTable } from "@/components/common/table/data-table"
import { Button } from "@/components/ui/button"
import { useQueryParams } from "@/hooks/use-query-params"
import { ROUTES } from "@/lib/constants"
import { type ReportStatus, reportStatusOptions, type WasteCategory, wasteCategoryOptions } from "@/lib/enums/report"
import { formatNumber } from "@/lib/format"
import { getErrorMessage } from "@/lib/http"
import { getMyReports } from "@/lib/services/my-report"
import { reportColumns } from "@/pages/reports/columns"

const PAGE_SIZE = 20
const FILTER_KEYS = ["search", "status", "category"] as const

/** Kolom tabel admin tanpa "Pelapor", karena semua laporan di sini milik user sendiri. */
const columns = reportColumns.filter((column) => column.id !== "reporter")

export default function MyReportsPage() {
  const navigate = useNavigate()
  const { values, page, setParams, resetParams, hasActiveFilters } = useQueryParams(FILTER_KEYS)

  const reportsQuery = useQuery({
    queryKey: ["my-reports", { ...values, page }],
    queryFn: () =>
      getMyReports({
        search: values.search || undefined,
        status: (values.status || undefined) as ReportStatus | undefined,
        category: (values.category || undefined) as WasteCategory | undefined,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  })

  const reports = reportsQuery.data?.data ?? []
  const pagination = reportsQuery.data?.meta?.pagination ?? null

  const createButton = (
    <Button asChild>
      <Link to={ROUTES.MY_REPORT.CREATE}>
        <CameraIcon />
        Buat laporan
      </Link>
    </Button>
  )

  return (
    <Panel>
      <PanelHeader
        title="Laporan Saya"
        description={
          pagination ? `${formatNumber(pagination.total)} laporan${hasActiveFilters ? " sesuai filter" : ""}` : "Memuat laporan..."
        }
        actions={createButton}
      />

      <PanelSection className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput value={values.search} onSearch={(search) => setParams({ search })} placeholder="Cari deskripsi atau alamat"
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
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetParams}>
            Reset filter
          </Button>
        )}
      </PanelSection>

      <DataTable
        bordered={false}
        columns={columns}
        data={reports}
        isLoading={reportsQuery.isPending}
        pagination={pagination}
        onPageChange={(next) => setParams({ page: next })}
        onRowClick={(report) => navigate(ROUTES.MY_REPORT.READ(report.id))}
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
            <EmptyState
              icon={FileTextIcon}
              title="Belum ada laporan"
              description="Foto tumpukan sampah di sekitarmu dan kirim laporan pertama."
              action={createButton}
            />
          )
        }
      />
    </Panel>
  )
}
