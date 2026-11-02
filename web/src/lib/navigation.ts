import { CameraIcon, ClipboardListIcon, FileTextIcon, HomeIcon, LayoutDashboardIcon, UsersIcon, type LucideIcon } from "lucide-react"

import { can, isStaff } from "@/lib/access"
import { ROUTES } from "@/lib/constants"
import { Permission } from "@/lib/enums/user"
import type { CurrentUser } from "@/lib/types/user"

export type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  isVisible: (user: CurrentUser) => boolean
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

const isCitizen = (user: CurrentUser) => can(user, Permission.SendReports, false)

/** Menu sidebar. Item yang `isVisible`-nya false untuk user saat ini tidak ditampilkan. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Menu",
    items: [
      { title: "Dashboard", url: ROUTES.HOME, icon: LayoutDashboardIcon, isVisible: isStaff },
      { title: "Beranda", url: ROUTES.HOME, icon: HomeIcon, isVisible: (user) => !isStaff(user) },
      { title: "Laporan Sampah", url: ROUTES.REPORT.INDEX, icon: ClipboardListIcon, isVisible: (user) => can(user, Permission.ManageReports) },
      { title: "Laporan Saya", url: ROUTES.MY_REPORT.INDEX, icon: FileTextIcon, isVisible: isCitizen },
      { title: "Buat Laporan", url: ROUTES.MY_REPORT.CREATE, icon: CameraIcon, isVisible: isCitizen },
    ],
  },
  {
    label: "Administrasi",
    items: [{ title: "Pengguna", url: ROUTES.USER.INDEX, icon: UsersIcon, isVisible: (user) => can(user, Permission.ManageUsers) }],
  },
]

/** `/` hanya aktif persis di `/`; menu lain aktif juga untuk sub-halamannya, kecuali ada menu lain yang lebih spesifik. */
export function isNavItemActive(pathname: string, url: string, allUrls: string[]) {
  if (url === ROUTES.HOME) return pathname === ROUTES.HOME
  if (pathname === url) return true
  if (!pathname.startsWith(`${url}/`)) return false
  return !allUrls.some((other) => other !== url && other.startsWith(url) && pathname.startsWith(other))
}
