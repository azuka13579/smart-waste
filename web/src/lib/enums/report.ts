/** Value harus sama persis dengan `constants/report.ts` di backend. */
export const ReportStatus = {
  Pending: "pending",
  InProgress: "in_progress",
  Completed: "completed",
  Rejected: "rejected",
} as const

export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus]

export const reportStatusLabels: Record<ReportStatus, string> = {
  [ReportStatus.Pending]: "Pending",
  [ReportStatus.InProgress]: "Diproses",
  [ReportStatus.Completed]: "Selesai",
  [ReportStatus.Rejected]: "Ditolak",
}

export const reportStatusOptions = Object.values(ReportStatus).map((value) => ({
  value,
  label: reportStatusLabels[value],
}))

/** Urutan dan value sama dengan `labels.json` model klasifikasi. */
export const WasteCategory = {
  Glass: "glass",
  Metal: "metal",
  Organic: "organic",
  Paper: "paper",
  Plastic: "plastic",
  Textile: "textile",
} as const

export type WasteCategory = (typeof WasteCategory)[keyof typeof WasteCategory]

export const wasteCategoryLabels: Record<WasteCategory, string> = {
  [WasteCategory.Glass]: "Kaca",
  [WasteCategory.Metal]: "Logam",
  [WasteCategory.Organic]: "Organik",
  [WasteCategory.Paper]: "Kertas",
  [WasteCategory.Plastic]: "Plastik",
  [WasteCategory.Textile]: "Tekstil",
}

export const wasteCategoryOptions = Object.values(WasteCategory).map((value) => ({
  value,
  label: wasteCategoryLabels[value],
}))
