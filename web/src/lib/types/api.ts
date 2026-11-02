/** Cermin `modules/response/contract.ts` di backend. */
export type Pagination = {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export type ApiResponse<T> = {
  message: string
  data: T
  meta: { pagination: Pagination | null } | null
}

export type ValidationIssue = {
  summary: string
  path: string
  message: string
  value: unknown
}

export type ApiErrorBody = {
  message: string
  error?: ValidationIssue[] | unknown
}
