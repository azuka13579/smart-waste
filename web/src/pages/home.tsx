import { isStaff } from "@/lib/access"
import { useSession } from "@/lib/session"
import DashboardPage from "@/pages/dashboard"
import UserHomePage from "@/pages/my-reports/home"

/** Admin melihat dashboard statistik; user melihat ringkasan laporannya sendiri. */
export default function HomePage() {
  const { user } = useSession()
  if (!user) return null
  return isStaff(user) ? <DashboardPage /> : <UserHomePage />
}
