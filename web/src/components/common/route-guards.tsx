import { Navigate, Outlet, useLocation, useSearchParams } from "react-router"

import { FullPageLoader } from "@/components/common/full-page-loader"
import { QueryErrorState } from "@/components/common/query-error-state"
import { can } from "@/lib/access"
import { ROUTES } from "@/lib/constants"
import type { Permission } from "@/lib/enums/user"
import { getSafeRedirect } from "@/lib/navigation"
import { useSession } from "@/lib/session"

/** Halaman setelah login. Belum login → ke `/login?redirect=<halaman asal>`. */
export function RequireAuth() {
  const { user, isLoading, error, isRefetching, refetch } = useSession()
  const location = useLocation()

  if (isLoading) return <FullPageLoader />
  // Server tidak bisa dihubungi: jangan lempar ke halaman login seolah sesi habis
  if (error) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
        <QueryErrorState subject="sesi" error={error} onRetry={() => refetch()} isRetrying={isRefetching} />
      </div>
    )
  }
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`${ROUTES.LOGIN}?redirect=${redirect}`} replace />
  }
  return <Outlet />
}

/**
 * Halaman login/register. Sudah login → ke `?redirect=` (atau beranda).
 * Guard ini yang mengarahkan setelah login berhasil, karena ia bereaksi lebih dulu begitu sesi terisi.
 */
export function GuestOnly() {
  const { user, isLoading } = useSession()
  const [searchParams] = useSearchParams()

  if (isLoading) return <FullPageLoader />
  if (user) return <Navigate to={getSafeRedirect(searchParams.get("redirect"))} replace />
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
