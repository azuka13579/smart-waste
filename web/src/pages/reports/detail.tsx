import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeftIcon, ExternalLinkIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { FilterSelect } from "@/components/common/filter-select"
import { Panel, PanelHeader } from "@/components/common/panel"
import { ReportDetailSkeleton, ReportDetailView, ReportNotFound } from "@/components/common/report-detail-view"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ROUTES } from "@/lib/constants"
import { type WasteCategory, wasteCategoryOptions } from "@/lib/enums/report"
import { getMapsUrl } from "@/lib/format"
import { getErrorMessage } from "@/lib/http"
import { deleteReport, getReportById, updateReport } from "@/lib/services/report"
import type { ReportDetail } from "@/lib/types/report"

import { UpdateStatusDialog } from "./update-status-dialog"

export default function ReportDetailPage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const reportQuery = useQuery({ queryKey: ["reports", id], queryFn: () => getReportById(id), enabled: !!id })
  const report = reportQuery.data?.data

  /** Simpan hasil terbaru ke cache detail, dan tandai daftar + statistik agar dimuat ulang. */
  const applyUpdate = (updated: ReportDetail) => {
    queryClient.setQueryData(["reports", id], { message: "OK", data: updated, meta: null })
    queryClient.invalidateQueries({ queryKey: ["reports"], predicate: (query) => query.queryKey[1] !== id })
    queryClient.invalidateQueries({ queryKey: ["statistics"] })
  }

  const categoryMutation = useMutation({
    mutationFn: (category: WasteCategory | null) => updateReport(id, { category }),
    onSuccess: (response) => {
      applyUpdate(response.data)
      toast.success("Kategori diperbarui")
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal memperbarui kategori")),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteReport(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["reports", id] })
      queryClient.invalidateQueries({ queryKey: ["reports"] })
      queryClient.invalidateQueries({ queryKey: ["statistics"] })
      toast.success("Laporan dihapus")
      navigate(ROUTES.REPORT.INDEX, { replace: true })
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal menghapus laporan")),
  })

  if (reportQuery.isPending) return <ReportDetailSkeleton />
  if (!report) return <ReportNotFound error={reportQuery.error} backTo={ROUTES.REPORT.INDEX} />

  return (
    <>
      <Panel>
        <PanelHeader
          title="Detail Laporan"
          // description={<span className="font-mono text-xs">{report.id}</span>}
          leading={
            <Button variant="outline" size="icon-sm" asChild>
              <Link to={ROUTES.REPORT.INDEX} aria-label="Kembali ke daftar laporan">
                <ArrowLeftIcon />
              </Link>
            </Button>
          }
          actions={
            <>
              <UpdateStatusDialog report={report} onUpdated={applyUpdate} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Aksi lainnya">
                    <MoreHorizontalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <a href={getMapsUrl(report.latitude, report.longitude)} target="_blank" rel="noreferrer">
                      <ExternalLinkIcon />
                      Buka di Google Maps
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setIsDeleteOpen(true)}>
                    <Trash2Icon />
                    Hapus laporan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
        />
      </Panel>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Hapus laporan ini?"
        description="Laporan, foto, dan riwayat statusnya akan dihapus permanen."
        confirmText="Hapus"
        destructive
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />

      <ReportDetailView
        report={report}
        showReporter
        categoryField={
          <FilterSelect
            value={report.category ?? ""}
            onChange={(category) => categoryMutation.mutate(category || null)}
            options={wasteCategoryOptions}
            allLabel="Belum dikategorikan"
            className="sm:w-full"
          />
        }
      />
    </>
  )
}
