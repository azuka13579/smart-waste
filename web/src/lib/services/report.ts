import { API_ROUTES } from "@/lib/constants"
import type { ReportStatus } from "@/lib/enums/report"
import { jsonInit, readResponse, toQueryString } from "@/lib/http"
import type { UpdateReportPayload } from "@/lib/schemas/report"
import type { Report, ReportDetail, ReportListQuery } from "@/lib/types/report"

/* ── Pengelola (admin): /reports ───────────────────────────────── */

export async function getReports(query: ReportListQuery = {}) {
  const response = await fetch(`${API_ROUTES.REPORTS.INDEX}${toQueryString(query)}`, jsonInit("GET"))
  return readResponse<Report[]>(response)
}

export async function getReportById(id: string) {
  const response = await fetch(API_ROUTES.REPORTS.READ(id), jsonInit("GET"))
  return readResponse<ReportDetail>(response)
}

export async function updateReport(id: string, payload: UpdateReportPayload) {
  const response = await fetch(API_ROUTES.REPORTS.READ(id), jsonInit("PATCH", payload))
  return readResponse<ReportDetail>(response)
}

export async function updateReportStatus(id: string, payload: { status: ReportStatus; note?: string }) {
  const response = await fetch(API_ROUTES.REPORTS.STATUS(id), jsonInit("PATCH", payload))
  return readResponse<ReportDetail>(response)
}

export async function deleteReport(id: string) {
  const response = await fetch(API_ROUTES.REPORTS.READ(id), jsonInit("DELETE"))
  return readResponse<null>(response)
}
