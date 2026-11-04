import { File } from "expo-file-system"

import { API_ROUTES } from "@/lib/constants"
import { formDataInit, jsonInit, readResponse, toQueryString } from "@/lib/http"
import type { CreateReportPayload, LocalPhoto, UpdateReportPayload } from "@/lib/schemas/report"
import type { CreatedReport, Prediction, Report, ReportDetail, ReportListQuery, ReportSummary } from "@/lib/types/report"

/**
 * Sejak SDK 52, `fetch` global di Expo adalah `expo/fetch`, yang tidak mendukung format lama `{ uri, name, type }`
 * ("Unsupported FormDataPart implementation"). `File` dari expo-file-system membaca berkas lokal beserta nama
 * dan MIME type-nya (`.jpg` → `image/jpeg`; foto selalu JPEG, lihat `lib/photo.ts`).
 */
function appendPhoto(body: FormData, photo: LocalPhoto) {
  body.append("photo", new File(photo.uri))
}

/* ── Laporan milik user yang login: /users/@me/reports ─────────── */

export async function getMyReports(query: ReportListQuery = {}) {
  const response = await fetch(`${API_ROUTES.MY_REPORTS.INDEX}${toQueryString(query)}`, jsonInit("GET"))
  return readResponse<Report[]>(response)
}

export async function getMyReportSummary() {
  const response = await fetch(API_ROUTES.MY_REPORTS.SUMMARY, jsonInit("GET"))
  return readResponse<ReportSummary>(response)
}

export async function getMyReportById(id: string) {
  const response = await fetch(API_ROUTES.MY_REPORTS.READ(id), jsonInit("GET"))
  return readResponse<ReportDetail>(response)
}

/** Backend menolak dengan 409 bila laporan sudah tidak pending. */
export async function updateMyReport(id: string, payload: UpdateReportPayload) {
  const response = await fetch(API_ROUTES.MY_REPORTS.READ(id), jsonInit("PATCH", payload))
  return readResponse<ReportDetail>(response)
}

/** Backend menolak dengan 409 bila laporan sudah tidak pending. */
export async function deleteMyReport(id: string) {
  const response = await fetch(API_ROUTES.MY_REPORTS.READ(id), jsonInit("DELETE"))
  return readResponse<null>(response)
}

export async function createMyReport(payload: CreateReportPayload) {
  const body = new FormData()
  appendPhoto(body, payload.photo)
  body.append("description", payload.description)
  body.append("latitude", String(payload.latitude))
  body.append("longitude", String(payload.longitude))
  if (payload.address) body.append("address", payload.address)
  if (payload.category) body.append("category", payload.category)

  const response = await fetch(API_ROUTES.MY_REPORTS.INDEX, formDataInit("POST", body))
  return readResponse<CreatedReport>(response)
}

/** Klasifikasi foto untuk pratinjau sebelum laporan dikirim; tidak menyimpan apa pun. */
export async function predictWaste(photo: LocalPhoto) {
  const body = new FormData()
  appendPhoto(body, photo)

  const response = await fetch(API_ROUTES.PREDICTIONS, formDataInit("POST", body))
  return readResponse<Prediction>(response)
}
