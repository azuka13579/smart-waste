import type { ReportStatus, WasteCategory } from "@/lib/enums/report"

/** Cermin `ReportsModel.reportSchema` di backend. */
export type Report = {
  id: string
  userId: string
  description: string
  photoUrl: string
  latitude: number
  longitude: number
  address: string | null
  /** Kategori akhir: hasil model, pilihan user, atau koreksi admin. */
  category: WasteCategory | null
  /** Hasil model saat laporan dibuat; null bila di bawah ambang keyakinan. */
  modelCategory: WasteCategory | null
  /** 0–1. */
  modelConfidence: number | null
  status: ReportStatus
  createdAt: string
  updatedAt: string
  user: { id: string; name: string; email: string }
}

export type ReportStatusLog = {
  id: string
  fromStatus: ReportStatus | null
  toStatus: ReportStatus
  note: string | null
  createdAt: string
  changedBy: { id: string; name: string }
}

/** Cermin `ReportsModel.reportDetailSchema`. Log diurutkan dari yang terlama. */
export type ReportDetail = Report & {
  statusLogs: ReportStatusLog[]
}

export type ReportListQuery = {
  search?: string
  status?: ReportStatus
  category?: WasteCategory
  /** YYYY-MM-DD, zona Asia/Jakarta, inklusif. */
  from?: string
  to?: string
  page?: number
  limit?: number
}
