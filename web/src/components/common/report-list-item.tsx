import type { ReactNode } from "react"
import { Link } from "react-router"

import { ReportThumbnail } from "@/components/common/report-thumbnail"
import { formatCoordinates } from "@/lib/format"
import type { Report } from "@/lib/types/report"

type ReportListItemProps = {
  report: Report
  to: string
  /** Info di sisi kanan, misalnya nama pelapor, status, atau waktu. */
  trailing?: ReactNode
}

/** Satu baris laporan ringkas untuk daftar di dalam `Panel` (bungkus dengan `<ul className="divide-y">`). */
export function ReportListItem({ report, to, trailing }: ReportListItemProps) {
  return (
    <li>
      <Link to={to} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 md:px-5">
        <ReportThumbnail src={report.thumbnailUrl} fallbackSrc={report.photoUrl} alt="" className="size-10" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold">{report.description}</span>
          <span className="truncate text-xs text-muted-foreground">
            {report.address ?? formatCoordinates(report.latitude, report.longitude)}
          </span>
        </div>
        {trailing}
      </Link>
    </li>
  )
}
