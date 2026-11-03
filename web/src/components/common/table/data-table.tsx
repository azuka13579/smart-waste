import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { cn } from "cn"
import type { ReactNode } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Pagination } from "@/lib/types/api"

import { DataTablePagination } from "./data-table-pagination"

/** Lebar kolom opsional: `meta: { className: "w-32" }` di definisi kolom. */
export type ColumnMeta = { className?: string }

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  isLoading?: boolean
  /** Pagination dari backend (`meta.pagination`). Kosongkan bila tabel tidak dipaginasi. */
  pagination?: Pagination | null
  onPageChange?: (page: number) => void
  onRowClick?: (row: TData) => void
  /** Ditampilkan saat data kosong dan tidak sedang memuat. */
  emptyState: ReactNode
  loadingRows?: number
  /** `false` saat tabel sudah berada di dalam `Panel` agar tidak ada border ganda. */
  bordered?: boolean
}

/** Tabel dengan pagination di sisi server: data yang diterima sudah satu halaman. */
export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  pagination,
  onPageChange,
  onRowClick,
  emptyState,
  loadingRows = 8,
  bordered = true,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  })

  const showEmpty = !isLoading && data.length === 0

  return (
    <div className={cn("overflow-hidden bg-card", bordered && "rounded-lg border")}>
      {/* table-fixed: lebar kolom dari `meta.className`, kolom tanpa lebar mengisi sisa ruang dan teks panjang terpotong */}
      <Table className="table-fixed">
        <TableHeader className="bg-muted/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn("h-10 px-4 text-xs font-medium text-muted-foreground md:px-5", (header.column.columnDef.meta as ColumnMeta)?.className)}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: loadingRows }, (_, index) => (
              <TableRow key={index} className="hover:bg-transparent">
                {table.getVisibleLeafColumns().map((column) => (
                  <TableCell key={column.id} className={cn("px-4 py-3 md:px-5", (column.columnDef.meta as ColumnMeta)?.className)}>
                    <Skeleton className="h-4 w-full max-w-40" />
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {!isLoading &&
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                className={cn(onRowClick && "cursor-pointer")}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={cn("px-4 py-3 md:px-5", (cell.column.columnDef.meta as ColumnMeta)?.className)}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {showEmpty && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-0">
                {emptyState}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {pagination && onPageChange && !showEmpty && <DataTablePagination pagination={pagination} onPageChange={onPageChange} />}
    </div>
  )
}
