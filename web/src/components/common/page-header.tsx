import type { ReactNode } from "react"

type PageHeaderProps = {
  title: string
  description?: string
  /** Tombol aksi di kanan, misalnya "Tambah Pengguna". */
  actions?: ReactNode
}

/** Judul standar di atas setiap halaman dashboard. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
