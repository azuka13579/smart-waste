import { Navigate, Outlet, useLocation } from "react-router"

import { FullPageLoader } from "@/components/common/full-page-loader"
import { can } from "@/lib/access"
import { ROUTES } from "@/lib/constants"
import type { Permission } from "@/lib/enums/user"
import { useSession } from "@/lib/session"

/** Halaman setelah login. Belum login → ke `/login?redirect=<halaman asal>`. */
export function RequireAuth() {
  const { user, isLoading } = useSession()
  const location = useLocation()

  if (isLoading) return <FullPageLoader />
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`${ROUTES.LOGIN}?redirect=${redirect}`} replace />
  }
  return <Outlet />
}

/** Halaman login/register. Sudah login → ke beranda. */
export function GuestOnly() {
  const { user, isLoading } = useSession()

  if (isLoading) return <FullPageLoader />
  if (user) return <Navigate to={ROUTES.HOME} replace />
  return <Outlet />
}

type RequirePermissionProps = {
  permission: Permission
  /** `false` untuk fitur khusus user yang tidak ikut terbuka bagi ADMINISTRATOR. */
  bypassAdministrator?: boolean
}

/** Backend tetap penjaga utama; guard ini hanya mengalihkan user yang tidak berhak. */
export function RequirePermission({ permission, bypassAdministrator = true }: RequirePermissionProps) {
  const { user } = useSession()

  if (!can(user, permission, bypassAdministrator)) return <Navigate to={ROUTES.HOME} replace />
  return <Outlet />
}
