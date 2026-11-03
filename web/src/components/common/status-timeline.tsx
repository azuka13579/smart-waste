import { cn } from "cn"

import { getStatusDotClass } from "@/components/common/status-badge"
import { reportStatusLabels } from "@/lib/enums/report"
import { formatDateTime } from "@/lib/format"
import type { ReportStatusLog } from "@/lib/types/report"

/** Riwayat perubahan status, terbaru di atas. Log dari backend diurutkan dari yang terlama. */
export function StatusTimeline({ logs }: { logs: ReportStatusLog[] }) {
  const ordered = [...logs].reverse()

  return (
    <ol className="flex flex-col">
      {ordered.map((log, index) => {
        const isLast = index === ordered.length - 1
        return (
          <li key={log.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && <span aria-hidden className="absolute top-3 left-[5px] h-full w-px bg-border" />}
            <span aria-hidden className={cn("relative mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-card", getStatusDotClass(log.toStatus))} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-sm">
                <span className="font-medium">{log.fromStatus ? reportStatusLabels[log.toStatus] : "Laporan dibuat"}</span>
                {log.fromStatus && <span className="text-muted-foreground"> dari {reportStatusLabels[log.fromStatus]}</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                {log.changedBy.name} · {formatDateTime(log.createdAt)}
              </p>
              {log.note && <p className="mt-1 rounded-md bg-muted px-2.5 py-1.5 text-sm">{log.note}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
