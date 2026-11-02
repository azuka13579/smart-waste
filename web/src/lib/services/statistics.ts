import { API_ROUTES } from "@/lib/constants"
import type { ReportStatus } from "@/lib/enums/report"
import { jsonInit, readResponse, toQueryString } from "@/lib/http"
import type { DashboardStatistics } from "@/lib/types/statistics"

/** `status` hanya menyaring `daily`; angka total dan rincian lain tetap untuk semua laporan. */
export async function getStatistics(query: { days?: number; status?: ReportStatus } = {}) {
  const response = await fetch(`${API_ROUTES.STATISTICS}${toQueryString(query)}`, jsonInit("GET"))
  return readResponse<DashboardStatistics>(response)
}
