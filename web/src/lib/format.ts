import { format, formatDistanceToNowStrict } from "date-fns"
import { id } from "date-fns/locale"

/** 27 Okt 2026 */
export function formatDate(value: string | Date) {
  return format(new Date(value), "d MMM yyyy", { locale: id })
}

/** 27 Okt 2026, 14.05 */
export function formatDateTime(value: string | Date) {
  return format(new Date(value), "d MMM yyyy, HH.mm", { locale: id })
}

/** 2 jam yang lalu */
export function formatRelative(value: string | Date) {
  return formatDistanceToNowStrict(new Date(value), { locale: id, addSuffix: true })
}

/** 0.923 → "92%" */
export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value)
}

export function formatCoordinates(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
}

export function getMapsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps?q=${latitude},${longitude}`
}
