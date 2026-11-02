import { useCallback } from "react"
import { useSearchParams } from "react-router"

/**
 * Filter tabel disimpan di URL (`?status=pending&page=2`) agar bisa dibagikan dan tetap ada saat refresh.
 * Mengubah filter apa pun selain `page` otomatis kembali ke halaman 1.
 */
export function useQueryParams<K extends string>(keys: readonly K[]) {
  const [searchParams, setSearchParams] = useSearchParams()

  const values = Object.fromEntries(keys.map((key) => [key, searchParams.get(key) ?? ""])) as Record<K, string>
  const page = Math.max(1, Number(searchParams.get("page")) || 1)

  const setParams = useCallback(
    (changes: Partial<Record<K | "page", string | number | null>>) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === undefined || value === "") next.delete(key)
            else next.set(key, String(value))
          }
          if (!("page" in changes)) next.delete("page")
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const resetParams = useCallback(() => setSearchParams(new URLSearchParams(), { replace: true }), [setSearchParams])
  const hasActiveFilters = keys.some((key) => values[key] !== "")

  return { values, page, setParams, resetParams, hasActiveFilters }
}
