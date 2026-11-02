import { cn } from "cn"

import { ReportStatus, reportStatusLabels } from "@/lib/enums/report"

/** Satu-satunya warna untuk status: titik kecil. Teksnya tetap netral agar halaman tidak ramai. */
const STATUS_DOT: Record<ReportStatus, string> = {
  [ReportStatus.Pending]: "bg-status-pending",
  [ReportStatus.InProgress]: "bg-status-in-progress",
  [ReportStatus.Completed]: "bg-status-completed",
  [ReportStatus.Rejected]: "bg-status-rejected",
}

export function ReportStatusBadge({ status, className }: { status: ReportStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap", className)}>
      <span aria-hidden className={cn("size-2 rounded-full", STATUS_DOT[status])} />
      {reportStatusLabels[status]}
    </span>
  )
}

export function getStatusDotClass(status: ReportStatus) {
  return STATUS_DOT[status]
}
