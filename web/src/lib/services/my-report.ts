import { API_ROUTES } from "@/lib/constants"
import { jsonInit, readResponse, toQueryString } from "@/lib/http"
import type { CreateReportPayload, UpdateReportPayload } from "@/lib/schemas/report"
import type { CreatedReport, Prediction, Report, ReportDetail, ReportListQuery, ReportSummary } from "@/lib/types/report"

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

/** multipart/form-data: tanpa header Content-Type agar browser mengisi boundary sendiri. */
export async function createMyReport(payload: CreateReportPayload) {
  const body = new FormData()
  body.set("photo", payload.photo)
  body.set("description", payload.description)
  body.set("latitude", String(payload.latitude))
  body.set("longitude", String(payload.longitude))
  if (payload.address) body.set("address", payload.address)
  if (payload.category) body.set("category", payload.category)

  const response = await fetch(API_ROUTES.MY_REPORTS.INDEX, { method: "POST", credentials: "include", body })
  return readResponse<CreatedReport>(response)
}

/** Backend menolak dengan 409 bila laporan sudah tidak pending. */
export async function updateMyReport(id: string, payload: UpdateReportPayload) {
  const response = await fetch(API_ROUTES.MY_REPORTS.READ(id), jsonInit("PATCH", payload))
  return readResponse<ReportDetail>(response)
}

export async function deleteMyReport(id: string) {
  const response = await fetch(API_ROUTES.MY_REPORTS.READ(id), jsonInit("DELETE"))
  return readResponse<null>(response)
}

/** Klasifikasi foto untuk pratinjau sebelum laporan dikirim; tidak menyimpan apa pun. */
export async function predictWaste(photo: File) {
  const body = new FormData()
  body.set("photo", photo)

  const response = await fetch(API_ROUTES.PREDICTIONS, { method: "POST", credentials: "include", body })
  return readResponse<Prediction>(response)
}
