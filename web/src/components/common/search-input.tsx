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
  /** Nama untuk pembaca layar; placeholder bukan pengganti label. */
  label?: string
  className?: string
}

export function SearchInput({ value, onSearch, placeholder = "Cari...", label = "Cari", className }: SearchInputProps) {
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
        aria-label={label}
        className="pr-9 pl-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        // Area sentuh 28px (WCAG 2.5.8 minimal 24px); ikon tetap kecil
        <button
          type="button"
          onClick={() => setDraft("")}
          className="absolute top-1/2 right-1 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Hapus pencarian"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  )
}
