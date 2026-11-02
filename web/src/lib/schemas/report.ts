import z from "zod"

import { ReportStatus, type WasteCategory } from "@/lib/enums/report"

/** Sama dengan `ReportsModel.updateStatusBody`: catatan wajib saat menolak laporan. */
export const updateReportStatusPayloadSchema = z
  .object({
    status: z.enum(ReportStatus),
    note: z.string().trim().max(1000, "Catatan maksimal 1000 karakter"),
  })
  .refine((data) => data.status !== ReportStatus.Rejected || data.note.length > 0, {
    message: "Tulis alasan penolakan",
    path: ["note"],
  })

export type UpdateReportStatusValues = z.infer<typeof updateReportStatusPayloadSchema>

/** Sama dengan `ReportsModel.updateBody`. */
export type UpdateReportPayload = {
  description?: string
  address?: string | null
  category?: WasteCategory | null
}
