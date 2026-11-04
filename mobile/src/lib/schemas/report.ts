import z from "zod"

import { WasteCategory } from "@/lib/enums/report"

/** Sama dengan `FileConfig.ReportPhoto` di backend: foto dikirim sebagai JPEG dengan sisi terpanjang 1600 px. */
export const REPORT_PHOTO = {
  maxSize: 10 * 1024 * 1024,
  maxDimension: 1600,
  /** Kompresi JPEG 0–1 saat foto diperkecil sebelum diunggah. */
  quality: 0.8,
} as const

/** Foto yang sudah diperkecil dan disimpan sementara di HP, siap diunggah sebagai multipart. */
export type LocalPhoto = {
  uri: string
  width: number
  height: number
}

const description = z.string().trim().min(1, "Deskripsi wajib diisi").max(2000, "Deskripsi maksimal 2000 karakter")
const address = z.string().trim().max(500, "Alamat maksimal 500 karakter")
/** Kosong berarti "pakai hasil model". */
const category = z.union([z.literal(""), z.enum(WasteCategory)])

/** Form buat laporan. Lokasi `null` sampai GPS berhasil membaca posisi HP. */
export const createReportFormSchema = z.object({
  photo: z
    .custom<LocalPhoto>()
    .nullable()
    .refine((photo) => photo !== null, "Foto wajib diambil"),
  description,
  latitude: z.number().min(-90).max(90).nullable().refine((value) => value !== null, "Lokasi belum didapatkan"),
  longitude: z.number().min(-180).max(180).nullable().refine((value) => value !== null, "Lokasi belum didapatkan"),
  address,
  category,
})

export type CreateReportFormValues = z.input<typeof createReportFormSchema>

export type CreateReportPayload = {
  photo: LocalPhoto
  description: string
  latitude: number
  longitude: number
  address?: string
  category?: WasteCategory
}

/** Sama dengan `ReportsModel.updateBody`. `null` mengosongkan alamat atau kategori. */
export type UpdateReportPayload = {
  description?: string
  address?: string | null
  category?: WasteCategory | null
}

/** Edit laporan milik sendiri selama masih pending. Foto dan lokasi tidak bisa diganti. */
export const editReportFormSchema = z.object({ description, address, category })

export type EditReportFormValues = z.infer<typeof editReportFormSchema>
