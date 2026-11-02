import { createBrowserRouter } from "react-router"

import type { RouteHandle } from "@/components/common/app-breadcrumbs"
import { GuestOnly, RequireAuth, RequirePermission } from "@/components/common/route-guards"
import { ROUTES } from "@/lib/constants"
import { Permission } from "@/lib/enums/user"
import { AuthLayout } from "@/layouts/auth-layout"
import { DashboardLayout } from "@/layouts/dashboard-layout"
import LoginPage from "@/pages/auth/login"
import RegisterPage from "@/pages/auth/register"
import ComingSoonPage from "@/pages/coming-soon"
import HomePage from "@/pages/home"
import NotFoundPage from "@/pages/not-found"

const handle = (breadcrumb: string): RouteHandle => ({ breadcrumb })

export const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: ROUTES.LOGIN, element: <LoginPage /> },
          { path: ROUTES.REGISTER, element: <RegisterPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: ROUTES.HOME, element: <HomePage />, handle: handle("Beranda") },
          { path: ROUTES.PROFILE, element: <ComingSoonPage title="Profil Saya" />, handle: handle("Profil Saya") },
          {
            element: <RequirePermission permission={Permission.ManageReports} />,
            children: [
              {
                path: ROUTES.REPORT.INDEX,
                handle: handle("Laporan Sampah"),
                children: [
                  { index: true, element: <ComingSoonPage title="Laporan Sampah" /> },
                  { path: ":id", element: <ComingSoonPage title="Detail Laporan" />, handle: handle("Detail") },
                ],
              },
            ],
          },
          {
            element: <RequirePermission permission={Permission.SendReports} bypassAdministrator={false} />,
            children: [
              {
                path: ROUTES.MY_REPORT.INDEX,
                handle: handle("Laporan Saya"),
                children: [
                  { index: true, element: <ComingSoonPage title="Laporan Saya" /> },
                  { path: "create", element: <ComingSoonPage title="Buat Laporan" />, handle: handle("Buat Laporan") },
                  { path: ":id", element: <ComingSoonPage title="Detail Laporan" />, handle: handle("Detail") },
                ],
              },
            ],
          },
          {
            element: <RequirePermission permission={Permission.ManageUsers} />,
            children: [{ path: ROUTES.USER.INDEX, element: <ComingSoonPage title="Pengguna" />, handle: handle("Pengguna") }],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
])
