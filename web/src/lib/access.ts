import { Permission } from "@/lib/enums/user"
import type { CurrentUser } from "@/lib/types/user"

/** Sama seperti `hasPermission` di backend: ADMINISTRATOR lolos semua cek, kecuali `bypassAdministrator` false. */
export function can(user: CurrentUser | null | undefined, permission: Permission, bypassAdministrator = true) {
  if (!user) return false
  if (bypassAdministrator && user.permissions.includes(Permission.Administrator)) return true
  return user.permissions.includes(permission)
}

/** Halaman pengelola (dashboard statistik) vs halaman user (laporan saya). */
export function isStaff(user: CurrentUser | null | undefined) {
  return can(user, Permission.ViewStatistics) || can(user, Permission.ManageReports)
}
