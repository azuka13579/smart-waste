import { cn } from "cn"
import type { ReactNode } from "react"

type DetailFieldProps = {
  label: string
  children: ReactNode
  className?: string
}

/** Pasangan label–nilai di halaman detail. */
export function DetailField({ label, children, className }: DetailFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}
