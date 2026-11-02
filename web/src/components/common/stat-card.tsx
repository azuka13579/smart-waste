import { cn } from "cn"
import type { ReactNode } from "react"

import { Skeleton } from "@/components/ui/skeleton"

type StatProps = {
  label: string
  value: ReactNode
  /** Keterangan kecil di bawah angka, misalnya "dari 24 laporan". */
  hint?: ReactNode
  isLoading?: boolean
  className?: string
}

/** Satu angka utama. Susun beberapa di dalam `StatGroup` agar dipisah garis, bukan kartu terpisah. */
export function Stat({ label, value, hint, isLoading = false, className }: StatProps) {
  return (
    <div className={cn("flex flex-col gap-1 bg-card px-4 py-4 md:px-5", className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      {isLoading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      )}
      {hint && <div className="text-xs text-muted-foreground">{isLoading ? <Skeleton className="h-3 w-24" /> : hint}</div>}
    </div>
  )
}

/**
 * Deretan `Stat` dalam satu panel. Garis pemisah berasal dari `gap-px` di atas latar warna border.
 * Jumlah kolom di layar besar bisa diganti lewat `className`, misalnya `lg:grid-cols-5`.
 */
export function StatGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-4", className)}>{children}</div>
  )
}
