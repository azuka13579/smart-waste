import { API_ROUTES } from "@/lib/constants"
import { jsonInit, readResponse, toQueryString } from "@/lib/http"
import type { DashboardStatistics } from "@/lib/types/statistics"

export async function getStatistics(query: { days?: number } = {}) {
  const response = await fetch(`${API_ROUTES.STATISTICS}${toQueryString(query)}`, jsonInit("GET"))
  return readResponse<DashboardStatistics>(response)
}
