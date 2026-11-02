import { Panel, PanelHeader } from "@/components/common/panel"
import { isStaff } from "@/lib/access"
import { userRoleLabels } from "@/lib/enums/user"
import { useSession } from "@/lib/session"
import ComingSoonPage from "@/pages/coming-soon"
import DashboardPage from "@/pages/dashboard"

/** Admin melihat dashboard statistik; beranda user dibuat bersama halaman Laporan Saya. */
export default function HomePage() {
  const { user } = useSession()
  if (!user) return null
  if (isStaff(user)) return <DashboardPage />

  return (
    <>
      <Panel>
        <PanelHeader title="Beranda" description={`${user.name} · ${userRoleLabels[user.role]}`} />
      </Panel>
      <ComingSoonPage title="Ringkasan Laporan Saya" />
    </>
  )
}
