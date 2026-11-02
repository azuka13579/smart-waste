import { cn } from "cn"

import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"

/** Radix Select tidak menerima value kosong, jadi "semua" diwakili nilai ini. */
const ALL = "__all__"

type FilterSelectProps<T extends string> = {
  value: T | ""
  onChange: (value: T | "") => void
  options: { value: T; label: string }[]
  /** Label saat tidak ada filter, misalnya "Semua kategori". */
  allLabel: string
  className?: string
}

export function FilterSelect<T extends string>({ value, onChange, options, allLabel, className }: FilterSelectProps<T>) {
  return (
    <Select value={value || ALL} onValueChange={(next) => onChange(next === ALL ? "" : (next as T))}>
      <SelectTrigger className={cn("w-full sm:w-44", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        <SelectSeparator />
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
