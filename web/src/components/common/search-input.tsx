import { cn } from "cn"
import { SearchIcon, XIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { Input } from "@/components/ui/input"
import { useDebouncedValue } from "@/hooks/use-debounced-value"

type SearchInputProps = {
  value: string
  /** Dipanggil setelah user berhenti mengetik (debounce), bukan di setiap ketukan. */
  onSearch: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({ value, onSearch, placeholder = "Cari...", className }: SearchInputProps) {
  const [draft, setDraft] = useState(value)
  const debounced = useDebouncedValue(draft)

  // Ikuti perubahan dari luar, misalnya tombol "Reset filter"
  useEffect(() => setDraft(value), [value])

  useEffect(() => {
    if (debounced.trim() !== value) onSearch(debounced.trim())
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hanya bereaksi pada hasil debounce
  }, [debounced])

  return (
    <div className={cn("relative", className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        className="pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button
          type="button"
          onClick={() => setDraft("")}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
          aria-label="Hapus pencarian"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  )
}
