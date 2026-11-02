import { useEffect, useState } from "react"

/** Nilai yang baru ikut berubah setelah `delay` ms tanpa perubahan, misalnya untuk kolom pencarian. */
export function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return debounced
}
