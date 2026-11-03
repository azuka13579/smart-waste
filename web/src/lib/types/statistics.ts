import type { ReportStatus, WasteCategory } from "@/lib/enums/report"

/** Cermin `StatisticsModel.dashboardSchema` di backend. */
export type DashboardStatistics = {
  totals: {
    reports: number
    reportsToday: number
    /** Akun aktif dengan role `user`. */
    users: number
  }
  byStatus: Record<ReportStatus, number>
  byCategory: Record<WasteCategory | "uncategorized", number>
  /** Satu entri per hari, dari yang terlama. */
  daily: { date: string; count: number }[]
  model: {
    predicted: number
    notRecognized: number
    agreed: number
    agreementRate: number | null
  }
}
