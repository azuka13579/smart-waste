import { lazy } from "react"

import { isStaff } from "@/lib/access"
import { useSession } from "@/lib/session"

// Dashboard admin membawa Recharts; dipisah agar user biasa tidak ikut mengunduhnya
const DashboardPage = lazy(() => import("@/pages/dashboard"))
const UserHomePage = lazy(() => import("@/pages/my-reports/home"))

/** Admin melihat dashboard statistik; user melihat ringkasan laporannya sendiri. */
export default function HomePage() {
  const { user } = useSession()
  if (!user) return null
  return isStaff(user) ? <DashboardPage /> : <UserHomePage />
}
