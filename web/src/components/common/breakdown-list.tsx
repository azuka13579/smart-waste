import { cn } from "cn"
import { Link } from "react-router"

import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber, formatPercent } from "@/lib/format"

export type BreakdownItem = {
  key: string
  label: string
  value: number
  /** Penanda identitas di samping label, misalnya titik warna status. Bar tetap satu warna. */
  marker?: string
  /** Bila diisi, baris menjadi link (misalnya ke daftar laporan yang sudah difilter). */
  href?: string
}

type BreakdownListProps = {
  items: BreakdownItem[]
  isLoading?: boolean
}

/** Rincian jumlah per kelompok: label, angka, persentase, dan bar tipis satu warna. */
export function BreakdownList({ items, isLoading = false }: BreakdownListProps) {
  if (isLoading) {
    return (
      <ul className="flex flex-col gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-1.5 w-full" />
          </li>
        ))}
      </ul>
    )
  }

  const total = items.reduce((sum, item) => sum + item.value, 0)
  const max = Math.max(1, ...items.map((item) => item.value))

  return (
    <ul className="flex flex-col gap-3.5">
      {items.map((item) => {
        const content = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="flex items-center gap-2">
                {item.marker && <span aria-hidden className={cn("size-2 rounded-full", item.marker)} />}
                {item.label}
              </span>
              <span className="flex items-baseline gap-2 tabular-nums">
                <span className="font-semibold">{formatNumber(item.value)}</span>
                <span className="w-9 text-right text-xs text-muted-foreground">{total > 0 ? formatPercent(item.value / total) : "0%"}</span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
          </>
        )

        return (
          <li key={item.key}>
            {item.href ? (
              <Link to={item.href} className="-mx-2 flex flex-col gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-muted/60">
                {content}
              </Link>
            ) : (
              <div className="flex flex-col gap-1.5 py-1">{content}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
