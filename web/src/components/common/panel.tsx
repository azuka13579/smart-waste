import { cn } from "cn"
import type { ComponentProps, ReactNode } from "react"

/** Kartu putih pembungkus konten halaman. Bagiannya dipisah dengan `PanelSection`. */
export function Panel({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("overflow-hidden rounded-lg border bg-card", className)} {...props} />
}

/** Satu bagian di dalam `Panel`, misalnya header atau toolbar filter, dipisah garis tipis. */
export function PanelSection({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("border-b px-4 py-3 last:border-b-0 md:px-5", className)} {...props} />
}

type PanelFormSectionProps = {
  title: string
  description?: ReactNode
  children: ReactNode
}

/** Bagian form bergaya halaman pengaturan: judul dan keterangan di kiri, field di kanan (bertumpuk di layar kecil). */
export function PanelFormSection({ title, description, children }: PanelFormSectionProps) {
  return (
    <PanelSection className="grid gap-4 py-5 md:grid-cols-[240px_minmax(0,1fr)] md:gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="flex max-w-xl flex-col gap-4">{children}</div>
    </PanelSection>
  )
}

type PanelHeaderProps = {
  title: ReactNode
  description?: ReactNode
  /** Elemen di kiri judul, misalnya tombol kembali. */
  leading?: ReactNode
  actions?: ReactNode
}

/** Judul halaman di dalam `Panel`. */
export function PanelHeader({ title, description, leading, actions }: PanelHeaderProps) {
  return (
    <PanelSection className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {leading}
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          {description && <div className="text-sm text-muted-foreground">{description}</div>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </PanelSection>
  )
}
