import { FileXIcon, MapPinIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router"

import { CategoryBadge } from "@/components/common/category-badge"
import { DetailField } from "@/components/common/detail-field"
import { EmptyState } from "@/components/common/empty-state"
import { LocationMap } from "@/components/common/location-map"
import { ReportThumbnail } from "@/components/common/report-thumbnail"
import { ReportStatusBadge } from "@/components/common/status-badge"
import { StatusTimeline } from "@/components/common/status-timeline"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCoordinates, formatDateTime, formatPercent, getMapsUrl } from "@/lib/format"
import { ApiError, getErrorMessage } from "@/lib/http"
import type { ReportDetail } from "@/lib/types/report"

type ReportDetailViewProps = {
  report: ReportDetail
  /** Tampilkan baris "Pelapor" (halaman admin). User tidak perlu melihat namanya sendiri. */
  showReporter?: boolean
  /** Pengganti tampilan kategori, misalnya select koreksi kategori untuk admin. */
  categoryField?: ReactNode
}

/** Isi halaman detail laporan yang sama untuk admin dan user. Kiri: foto dan peta. Kanan: deskripsi, informasi, riwayat status. */
export function ReportDetailView({ report, showReporter = false, categoryField }: ReportDetailViewProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-4">
        <Card className="gap-0 overflow-hidden py-0">
          <a href={report.photoUrl} target="_blank" rel="noreferrer" className="block bg-muted">
            <ReportThumbnail src={report.photoUrl} alt="Foto laporan" className="aspect-video w-full rounded-none [&_img]:object-contain" />
          </a>
        </Card>

        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="py-4">
            <CardTitle className="text-md font-bold">Peta lokasi</CardTitle>
          </CardHeader>
          <LocationMap position={[report.latitude, report.longitude]} className="h-72 rounded-none border-x-0 border-b-0" />
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-md font-bold">Deskripsi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed whitespace-pre-line">{report.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-md font-bold">Informasi</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-4">
              <DetailField label="Status">
                <ReportStatusBadge status={report.status} className="text-lg font-semibold [&>span]:size-2.5" />
              </DetailField>
              {showReporter && (
                <DetailField label="Pelapor">
                  <p className="font-medium">{report.user.name}</p>
                  <p className="text-xs text-muted-foreground">{report.user.email}</p>
                </DetailField>
              )}
              <DetailField label="Lokasi">
                {report.address && <p>{report.address}</p>}
                <a
                  href={getMapsUrl(report.latitude, report.longitude)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                >
                  <MapPinIcon className="size-3" />
                  {formatCoordinates(report.latitude, report.longitude)}
                </a>
              </DetailField>
              <DetailField label="Kategori">{categoryField ?? <CategoryBadge category={report.category} className="font-medium" />}</DetailField>
              <DetailField label="Hasil model klasifikasi">
                <ReportModelResult report={report} />
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
            <CardTitle className="text-md font-bold">Riwayat status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusTimeline logs={report.statusLogs} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/** Hasil model saat laporan dibuat, terpisah dari kategori akhir yang bisa dikoreksi. */
export function ReportModelResult({ report }: { report: ReportDetail }) {
  if (report.modelConfidence === null) return <span className="text-muted-foreground">Model tidak dijalankan</span>

  if (!report.modelCategory) {
    return <span className="text-muted-foreground">Tidak dikenali (keyakinan {formatPercent(report.modelConfidence)})</span>
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CategoryBadge category={report.modelCategory} confidence={report.modelConfidence} />
      {report.category && report.category !== report.modelCategory && <span className="text-xs text-muted-foreground">Dikoreksi</span>}
    </div>
  )
}

export function ReportDetailSkeleton() {
  return (
    <>
      <Skeleton className="h-[74px] w-full rounded-lg" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    </>
  )
}

/** Laporan gagal dimuat: 404 (dihapus / bukan milik user) atau error lain. */
export function ReportNotFound({ error, backTo }: { error: unknown; backTo: string }) {
  const isNotFound = error instanceof ApiError && error.status === 404

  return (
    <EmptyState
      icon={FileXIcon}
      title={isNotFound ? "Laporan tidak ditemukan" : "Gagal memuat laporan"}
      description={isNotFound ? "Laporan mungkin sudah dihapus." : getErrorMessage(error)}
      action={
        <Button variant="outline" asChild>
          <Link to={backTo}>Kembali ke daftar</Link>
        </Button>
      }
      className="rounded-lg border bg-card"
    />
  )
}
