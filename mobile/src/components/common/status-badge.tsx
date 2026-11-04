import { View } from "react-native"

import { Text } from "@/components/ui/text"
import { ReportStatus, reportStatusLabels } from "@/lib/enums/report"
import { cn } from "@/lib/utils"

/** Sama dengan web: warna status hanya di titik kecil, teksnya netral agar daftar tidak ramai. */
export const STATUS_DOT: Record<ReportStatus, string> = {
  [ReportStatus.Pending]: "bg-status-pending",
  [ReportStatus.InProgress]: "bg-status-in-progress",
  [ReportStatus.Completed]: "bg-status-completed",
  [ReportStatus.Rejected]: "bg-status-rejected",
}

export function ReportStatusBadge({ status, className }: { status: ReportStatus; className?: string }) {
  return (
    <View className={cn("flex-row items-center gap-1.5", className)}>
      <View className={cn("h-2 w-2 rounded-full", STATUS_DOT[status])} />
      <Text variant="label-md" className="text-foreground">
        {reportStatusLabels[status]}
      </Text>
    </View>
  )
}
