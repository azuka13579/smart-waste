import type { AnyFieldApi } from "@tanstack/react-form"

/**
 * Error baru ditampilkan setelah field ditinggalkan (blur) atau form pernah disubmit,
 * supaya user tidak langsung disambut pesan merah saat baru mulai mengetik.
 */
export function getFieldErrors(field: AnyFieldApi) {
  const { meta } = field.state
  const shouldShow = meta.isBlurred || field.form.state.submissionAttempts > 0
  if (!shouldShow || meta.isValid) return []

  return meta.errors.map((error) => (typeof error === "string" ? { message: error } : (error as { message?: string })))
}
