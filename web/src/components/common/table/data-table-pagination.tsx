import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/format"
import type { Pagination } from "@/lib/types/api"

type DataTablePaginationProps = {
  pagination: Pagination
  onPageChange: (page: number) => void
}

export function DataTablePagination({ pagination, onPageChange }: DataTablePaginationProps) {
  const { page, perPage, total, totalPages } = pagination
  const start = total === 0 ? 0 : (page - 1) * perPage + 1
  const end = Math.min(page * perPage, total)

  return (
    <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm md:px-5">
      <p className="text-muted-foreground">
        {formatNumber(start)}–{formatNumber(end)} dari {formatNumber(total)}
      </p>
      <div className="flex items-center gap-2">
        <span className="hidden text-muted-foreground sm:inline">
          Halaman {page} dari {totalPages}
        </span>
        <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Halaman sebelumnya">
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Halaman berikutnya"
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  )
}
