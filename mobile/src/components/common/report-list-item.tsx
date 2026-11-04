import { Image } from "expo-image"
import { Pressable, View } from "react-native"

import { ReportStatusBadge } from "@/components/common/status-badge"
import { Text } from "@/components/ui/text"
import { wasteCategoryLabels } from "@/lib/enums/report"
import { formatCoordinates, formatRelative } from "@/lib/format"
import type { Report } from "@/lib/types/report"
import { cn } from "@/lib/utils"

type ReportListItemProps = {
  report: Report
  onPress?: () => void
  className?: string
}

/** Baris laporan: thumbnail, jenis sampah, lokasi, lalu status dan waktu di kanan. */
export function ReportListItem({ report, onPress, className }: ReportListItemProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      className={cn("min-h-[76px] flex-row items-center gap-4 px-5 py-3 active:bg-secondary", className)}
    >
      <Image
        source={{ uri: report.thumbnailUrl || report.photoUrl }}
        accessibilityIgnoresInvertColors
        contentFit="cover"
        transition={150}
        style={{ width: 56, height: 56, borderRadius: 12 }}
      />
      <View className="flex-1 gap-0.5">
        <Text variant="title-sm" numberOfLines={1}>
          {report.category ? wasteCategoryLabels[report.category] : "Belum dikategorikan"}
        </Text>
        <Text variant="body-sm" numberOfLines={1} className="text-muted-foreground">
          {report.address || formatCoordinates(report.latitude, report.longitude)}
        </Text>
      </View>
      <View className="items-end gap-1">
        <ReportStatusBadge status={report.status} />
        <Text variant="body-sm" className="text-muted-foreground">
          {formatRelative(report.createdAt)}
        </Text>
      </View>
    </Pressable>
  )
}
