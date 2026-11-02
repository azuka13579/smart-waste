import { PageHeader } from "@/components/common/page-header"
import { isStaff } from "@/lib/access"
import { userRoleLabels } from "@/lib/enums/user"
import { useSession } from "@/lib/session"
import ComingSoonPage from "@/pages/coming-soon"

/** Staf melihat dashboard statistik, warga melihat ringkasan laporannya. Isinya dibuat di tahap berikutnya. */
export default function HomePage() {
  const { user } = useSession()
  if (!user) return null

  return (
    <>
      <PageHeader
        title={isStaff(user) ? "Dashboard" : "Beranda"}
        description={`${user.name} · ${userRoleLabels[user.role]}`}
      />
      <ComingSoonPage title={isStaff(user) ? "Dashboard Statistik" : "Ringkasan Laporan Saya"} />
    </>
  )
}
