import { cn } from "cn"

import { type WasteCategory, wasteCategoryLabels } from "@/lib/enums/report"
import { formatPercent } from "@/lib/format"

type CategoryBadgeProps = {
  category: WasteCategory | null
  /** Tampilkan tingkat keyakinan model di samping label, misalnya "Plastik 92%". */
  confidence?: number | null
  className?: string
}

/** Kategori sebagai teks biasa. `null` berarti model tidak yakin dan belum ada yang memilih kategori. */
export function CategoryBadge({ category, confidence, className }: CategoryBadgeProps) {
  if (!category) return <span className={cn("text-sm text-muted-foreground", className)}>Belum dikategorikan</span>

  return (
    <span className={cn("inline-flex items-baseline gap-1.5 text-sm whitespace-nowrap", className)}>
      {wasteCategoryLabels[category]}
      {confidence != null && <span className="text-xs text-muted-foreground tabular-nums">{formatPercent(confidence)}</span>}
    </span>
  )
}
