import { View } from "react-native"

import { STATUS_DOT } from "@/components/common/status-badge"
import { Text } from "@/components/ui/text"
import { reportStatusLabels } from "@/lib/enums/report"
import { formatDateTime } from "@/lib/format"
import type { ReportStatusLog } from "@/lib/types/report"
import { cn } from "@/lib/utils"

/** Riwayat perubahan status, terbaru di atas, beserta catatan admin. Log dari backend diurutkan dari yang terlama. */
export function StatusTimeline({ logs }: { logs: ReportStatusLog[] }) {
  const ordered = [...logs].reverse()

  return (
    <View>
      {ordered.map((log, index) => {
        const isLast = index === ordered.length - 1
        return (
          <View key={log.id} className="flex-row gap-4">
            <View className="w-3 items-center">
              <View className={cn("mt-1.5 h-3 w-3 rounded-full", STATUS_DOT[log.toStatus], index === 0 && "h-3.5 w-3.5")} />
              {!isLast && <View className="mt-1 w-0.5 flex-1 rounded-full bg-border" />}
            </View>
            <View className={cn("flex-1 gap-0.5", !isLast && "pb-6")}>
              <Text variant="title-sm">
                {log.fromStatus ? reportStatusLabels[log.toStatus] : "Laporan dibuat"}
                {log.fromStatus && (
                  <Text variant="body-md" className="text-muted-foreground">
                    {" "}
                    dari {reportStatusLabels[log.fromStatus]}
                  </Text>
                )}
              </Text>
              <Text variant="body-sm" className="text-muted-foreground">
                {log.changedBy.name} · {formatDateTime(log.createdAt)}
              </Text>
              {log.note && (
                <View className="mt-2 rounded-lg bg-muted px-3 py-2.5">
                  <Text variant="body-md">{log.note}</Text>
                </View>
              )}
            </View>
          </View>
        )
      })}
    </View>
  )
}
