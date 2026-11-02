import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeftIcon, ExternalLinkIcon, FileXIcon, MapPinIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { CategoryBadge } from "@/components/common/category-badge"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { DetailField } from "@/components/common/detail-field"
import { EmptyState } from "@/components/common/empty-state"
import { FilterSelect } from "@/components/common/filter-select"
import { Panel, PanelHeader } from "@/components/common/panel"
import { ReportThumbnail } from "@/components/common/report-thumbnail"
import { ReportStatusBadge } from "@/components/common/status-badge"
import { StatusTimeline } from "@/components/common/status-timeline"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { ROUTES } from "@/lib/constants"
import { type WasteCategory, wasteCategoryOptions } from "@/lib/enums/report"
import { formatCoordinates, formatDateTime, formatPercent, getMapsUrl } from "@/lib/format"
import { ApiError, getErrorMessage } from "@/lib/http"
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

  if (!report) {
    const isNotFound = reportQuery.error instanceof ApiError && reportQuery.error.status === 404
    return (
      <EmptyState
        icon={FileXIcon}
        title={isNotFound ? "Laporan tidak ditemukan" : "Gagal memuat laporan"}
        description={isNotFound ? "Laporan mungkin sudah dihapus." : getErrorMessage(reportQuery.error)}
        action={
          <Button variant="outline" asChild>
            <Link to={ROUTES.REPORT.INDEX}>Kembali ke daftar</Link>
          </Button>
        }
        className="rounded-lg border bg-card"
      />
    )
  }

  const mapsUrl = getMapsUrl(report.latitude, report.longitude)

  return (
    <>
      <Panel>
        <PanelHeader
          title="Detail Laporan"
          description={<span className="font-mono text-xs">{report.id}</span>}
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
                      <a href={mapsUrl} target="_blank" rel="noreferrer">
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4">
          <Card className="gap-0 overflow-hidden py-0">
            <a href={report.photoUrl} target="_blank" rel="noreferrer" className="block bg-muted">
              <ReportThumbnail src={report.photoUrl} alt="Foto laporan" className="aspect-video w-full rounded-none [&_img]:object-contain" />
            </a>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Deskripsi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed whitespace-pre-line">{report.description}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informasi</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-4">
                <DetailField label="Status">
                  <ReportStatusBadge status={report.status} className="text-lg font-semibold [&>span]:size-2.5" />
                </DetailField>
                <DetailField label="Pelapor">
                  <p className="font-medium">{report.user.name}</p>
                  <p className="text-xs text-muted-foreground">{report.user.email}</p>
                </DetailField>
                <DetailField label="Lokasi">
                  {report.address && <p>{report.address}</p>}
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                  >
                    <MapPinIcon className="size-3" />
                    {formatCoordinates(report.latitude, report.longitude)}
                  </a>
                </DetailField>
                <DetailField label="Kategori">
                  <FilterSelect
                    value={report.category ?? ""}
                    onChange={(category) => categoryMutation.mutate(category || null)}
                    options={wasteCategoryOptions}
                    allLabel="Belum dikategorikan"
                    className="sm:w-full"
                  />
                </DetailField>
                <DetailField label="Hasil model klasifikasi">
                  <ModelResult report={report} />
                </DetailField>
                <div className="grid grid-cols-2 gap-4">
                  <DetailField label="Dilaporkan">{formatDateTime(report.createdAt)}</DetailField>
                  <DetailField label="Diperbarui">{formatDateTime(report.updatedAt)}</DetailField>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Riwayat status</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline logs={report.statusLogs} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

/** Hasil model saat laporan dibuat, terpisah dari kategori akhir yang bisa dikoreksi admin. */
function ModelResult({ report }: { report: ReportDetail }) {
  if (report.modelConfidence === null) return <span className="text-muted-foreground">Model tidak dijalankan</span>

  if (!report.modelCategory) {
    return <span className="text-muted-foreground">Tidak dikenali (keyakinan {formatPercent(report.modelConfidence)})</span>
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CategoryBadge category={report.modelCategory} confidence={report.modelConfidence} />
      {report.category && report.category !== report.modelCategory && (
        <span className="text-xs text-muted-foreground">Dikoreksi</span>
      )}
    </div>
  )
}

function ReportDetailSkeleton() {
  return (
    <>
      <div className="flex items-center gap-3">
        <Skeleton className="size-8" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </>
  )
}
