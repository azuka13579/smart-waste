import z from "zod"

import { ReportStatus, WasteCategory } from "@/lib/enums/report"

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

/** Sama dengan `FileConfig.ReportPhoto` di backend. */
export const REPORT_PHOTO = {
  maxSize: 10 * 1024 * 1024,
  accept: "image/jpeg,image/png,image/webp",
  types: ["image/jpeg", "image/png", "image/webp"],
} as const

const description = z.string().trim().min(1, "Deskripsi wajib diisi").max(2000, "Deskripsi maksimal 2000 karakter")
const address = z.string().trim().max(500, "Alamat maksimal 500 karakter")
/** Kosong berarti "pakai hasil model". */
const category = z.union([z.literal(""), z.enum(WasteCategory)])

/** Form buat laporan. Lokasi `null` sampai user menekan "Gunakan lokasi saat ini" atau mengisinya manual. */
export const createReportFormSchema = z.object({
  photo: z
    .instanceof(File, { message: "Foto wajib diunggah" })
    .refine((file) => (REPORT_PHOTO.types as readonly string[]).includes(file.type), "Format foto harus JPG, PNG, atau WebP")
    .refine((file) => file.size <= REPORT_PHOTO.maxSize, "Ukuran foto maksimal 10 MB")
    .nullable()
    .refine((file) => file !== null, "Foto wajib diunggah"),
  description,
  latitude: z.number().min(-90).max(90).nullable().refine((value) => value !== null, "Tentukan lokasi laporan"),
  longitude: z.number().min(-180).max(180).nullable().refine((value) => value !== null, "Tentukan lokasi laporan"),
  address,
  category,
})

export type CreateReportFormValues = z.input<typeof createReportFormSchema>

export type CreateReportPayload = {
  photo: File
  description: string
  latitude: number
  longitude: number
  address?: string
  category?: WasteCategory
}

/** Edit laporan milik sendiri selama masih pending. */
export const editReportFormSchema = z.object({ description, address, category })

export type EditReportFormValues = z.infer<typeof editReportFormSchema>
