/**
 * Isi di `.env.local` (lihat `.env.example`). HP tidak bisa mengakses `localhost` milik laptop,
 * jadi saat development pakai IP laptop di WiFi yang sama, misalnya `http://192.168.1.10:8080`.
 */
export const BASE_API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "")

export const APP_NAME = "Smart Waste"

/** Batas waktu request agar layar tidak menunggu tanpa akhir saat server tidak terjangkau. */
export const REQUEST_TIMEOUT_MS = 15_000

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  NEW_REPORT: "/new-report",
  CHECK_WASTE: "/check-waste",
  MY_REPORTS: "/my-reports",
  REPORT: (id: string) => `/reports/${id}` as const,
  REPORT_EDIT: (id: string) => `/reports/${id}/edit` as const,
  PROFILE: "/profile",
} as const

export const API_ROUTES = Object.freeze({
  AUTH: Object.freeze({
    LOGIN: `${BASE_API_URL}/auth/login`,
    REGISTER: `${BASE_API_URL}/auth/register`,
    LOGOUT: `${BASE_API_URL}/auth/session`,
  }),
  USERS: Object.freeze({
    ME: `${BASE_API_URL}/users/@me`,
  }),
  MY_REPORTS: Object.freeze({
    INDEX: `${BASE_API_URL}/users/@me/reports`,
    SUMMARY: `${BASE_API_URL}/users/@me/reports/summary`,
    READ: (id: string) => `${BASE_API_URL}/users/@me/reports/${id}`,
  }),
  PREDICTIONS: `${BASE_API_URL}/predictions`,
})
