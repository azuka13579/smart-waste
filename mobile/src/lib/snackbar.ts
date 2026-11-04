import { useSyncExternalStore } from "react"

export type SnackbarTone = "success" | "error"

/** Umpan balik singkat setelah aksi ("Laporan diperbarui"). Satu pesan tampil dalam satu waktu. */
type SnackbarMessage = { id: number; text: string; tone: SnackbarTone }

const DURATION_MS = 3000

let current: SnackbarMessage | null = null
let hideTimer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function showSnackbar(text: string, { tone = "success" }: { tone?: SnackbarTone } = {}) {
  current = { id: Date.now(), text, tone }
  clearTimeout(hideTimer)
  hideTimer = setTimeout(dismissSnackbar, DURATION_MS)
  emit()
}

export function dismissSnackbar() {
  current = null
  emit()
}

export function useSnackbar() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => current,
  )
}
