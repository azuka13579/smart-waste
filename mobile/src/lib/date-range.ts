import { format, startOfMonth, subDays } from "date-fns"

import { formatDate } from "@/lib/format"

/** Rentang tanggal filter laporan, format `YYYY-MM-DD` dan inklusif, sama dengan query `from`/`to` backend. */
export type DateRange = { from?: string; to?: string }

export const toDateParam = (date: Date) => format(date, "yyyy-MM-dd")

export const DATE_PRESETS: { id: string; label: string; range: () => DateRange }[] = [
  { id: "today", label: "Hari ini", range: () => ({ from: toDateParam(new Date()), to: toDateParam(new Date()) }) },
  { id: "7d", label: "7 hari terakhir", range: () => ({ from: toDateParam(subDays(new Date(), 6)), to: toDateParam(new Date()) }) },
  { id: "30d", label: "30 hari terakhir", range: () => ({ from: toDateParam(subDays(new Date(), 29)), to: toDateParam(new Date()) }) },
  { id: "month", label: "Bulan ini", range: () => ({ from: toDateParam(startOfMonth(new Date())), to: toDateParam(new Date()) }) },
]

/** Label ringkas untuk tombol filter: "Hari ini", "1 Nov – 4 Nov 2026", "Sejak 1 Nov 2026". */
export function describeDateRange({ from, to }: DateRange) {
  if (!from && !to) return null

  const preset = DATE_PRESETS.find((item) => {
    const range = item.range()
    return range.from === from && range.to === to
  })
  if (preset) return preset.label

  if (from && to) return from === to ? formatDate(from) : `${formatDate(from)} – ${formatDate(to)}`
  return from ? `Sejak ${formatDate(from)}` : `Sampai ${formatDate(to!)}`
}
