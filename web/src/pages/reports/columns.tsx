import type { ColumnDef } from "@tanstack/react-table"

import { CategoryBadge } from "@/components/common/category-badge"
import { ReportThumbnail } from "@/components/common/report-thumbnail"
import { ReportStatusBadge } from "@/components/common/status-badge"
import type { ColumnMeta } from "@/components/common/table/data-table"
import { formatCoordinates, formatDate, formatRelative } from "@/lib/format"
import type { Report } from "@/lib/types/report"

const meta = (className: string): ColumnMeta => ({ className })

/** Kolom "Laporan" tidak diberi lebar sehingga mengisi sisa ruang; teks panjangnya terpotong dengan elipsis. */
export const reportColumns: ColumnDef<Report, unknown>[] = [
  {
    id: "report",
    header: "Laporan",
    cell: ({ row: { original: report } }) => (
      <div className="flex min-w-0 items-center gap-3">
        <ReportThumbnail src={report.photoUrl} alt="" className="size-10" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-semibold text-foreground">{report.description}</span>
          <span className="truncate text-xs text-muted-foreground">
            {report.address ?? formatCoordinates(report.latitude, report.longitude)}
          </span>
        </div>
      </div>
    ),
  },
  {
    id: "reporter",
    header: "Pelapor",
    meta: meta("hidden w-52 md:table-cell"),
    cell: ({ row: { original: report } }) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{report.user.name}</span>
        <span className="truncate text-xs text-muted-foreground">{report.user.email}</span>
      </div>
    ),
  },
  {
    id: "category",
    header: "Kategori",
    meta: meta("hidden w-36 xl:table-cell"),
    cell: ({ row: { original: report } }) => <CategoryBadge category={report.category} />,
  },
  {
    id: "status",
    header: "Status",
    meta: meta("w-28"),
    cell: ({ row: { original: report } }) => <ReportStatusBadge status={report.status} />,
  },
  {
    id: "createdAt",
    header: "Dilaporkan",
    meta: meta("hidden w-36 lg:table-cell"),
    cell: ({ row: { original: report } }) => (
      <div className="flex flex-col">
        <span>{formatDate(report.createdAt)}</span>
        <span className="text-xs text-muted-foreground">{formatRelative(report.createdAt)}</span>
      </div>
    ),
  },
]
