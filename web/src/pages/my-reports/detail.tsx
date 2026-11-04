import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PencilIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { Panel, PanelHeader } from "@/components/common/panel"
import { ReportDetailSkeleton, ReportDetailView, ReportNotFound } from "@/components/common/report-detail-view"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/constants"
import { ReportStatus } from "@/lib/enums/report"
import { getErrorMessage } from "@/lib/http"
import { deleteMyReport, getMyReportById } from "@/lib/services/my-report"
import type { ReportDetail } from "@/lib/types/report"

import { EditReportDialog } from "./edit-report-dialog"

export default function MyReportDetailPage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const reportQuery = useQuery({ queryKey: ["my-reports", id], queryFn: () => getMyReportById(id), enabled: !!id })
  const report = reportQuery.data?.data

  const deleteMutation = useMutation({
    mutationFn: () => deleteMyReport(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["my-reports", id] })
      queryClient.invalidateQueries({ queryKey: ["my-reports"] })
      toast.success("Laporan dihapus")
      navigate(ROUTES.MY_REPORT.INDEX, { replace: true })
    },
    onError: (error) => {
      setIsDeleteOpen(false)
      toast.error(getErrorMessage(error, "Gagal menghapus laporan"))
      // Kemungkinan status sudah berubah (409); muat ulang agar tombol aksi ikut menyesuaikan
      queryClient.invalidateQueries({ queryKey: ["my-reports", id] })
    },
  })

  const handleSaved = (updated: ReportDetail) => {
    setIsEditOpen(false)
    queryClient.setQueryData(["my-reports", id], { message: "OK", data: updated, meta: null })
    queryClient.invalidateQueries({ queryKey: ["my-reports"], predicate: (query) => query.queryKey[1] !== id })
  }

  if (reportQuery.isPending) return <ReportDetailSkeleton />
  if (!report) return <ReportNotFound error={reportQuery.error} backTo={ROUTES.MY_REPORT.INDEX} />

  // Aturan backend: laporan sendiri hanya bisa diubah atau dihapus selama belum ditangani
  const canModify = report.status === ReportStatus.Pending

  return (
    <>
      <Panel>
        <PanelHeader
          title="Detail Laporan"
          description={canModify ? "Laporan masih bisa diubah atau dihapus selama berstatus Pending." : "Laporan sudah ditangani dan tidak bisa diubah lagi."}
       
          actions={
            canModify && (
              <>
                <Button variant="outline" onClick={() => setIsDeleteOpen(true)}>
                  <Trash2Icon />
                  Hapus
                </Button>
                <Button onClick={() => setIsEditOpen(true)}>
                  <PencilIcon />
                  Edit
                </Button>
              </>
            )
          }
        />
      </Panel>

      <EditReportDialog open={isEditOpen} onOpenChange={setIsEditOpen} report={report} onSaved={handleSaved} />

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Hapus laporan ini?"
        description="Laporan dan fotonya akan dihapus permanen."
        confirmText="Hapus"
        destructive
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />

      <ReportDetailView report={report} />
    </>
  )
}
