import type { ReportStatus, WasteCategory } from "@/lib/enums/report"

/** Cermin `ReportsModel.reportSchema` di backend. */
export type Report = {
  id: string
  userId: string
  description: string
  photoUrl: string
  /** Pratinjau 240×240 untuk tabel dan daftar; laporan lama bisa belum punya, jadi selalu sediakan `photoUrl` sebagai cadangan. */
  thumbnailUrl: string
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

/** Cermin `PredictionsModel.predictionSchema`. */
export type Prediction = {
  /** `false` bila keyakinan tertinggi di bawah `threshold`; user diminta memilih kategori sendiri. */
  recognized: boolean
  category: WasteCategory | null
  confidence: number
  threshold: number
  probabilities: Record<WasteCategory, number>
}

/** Cermin `ReportsModel.createdReportSchema`. */
export type CreatedReport = ReportDetail & {
  /** `null` bila model sedang tidak tersedia. */
  prediction: Prediction | null
}

/** Cermin `ReportsModel.summarySchema` (dashboard user). */
export type ReportSummary = {
  total: number
  byStatus: Record<ReportStatus, number>
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
