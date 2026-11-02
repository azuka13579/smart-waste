/** Saat development, Vite meneruskan `/api/*` ke backend (lihat `vite.config.ts`) agar cookie sesi tetap first-party. */
export const BASE_API_URL = import.meta.env.VITE_API_BASE_URL ?? "/api"

export const APP_NAME = "Smart Waste"

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  PROFILE: "/profile",
  REPORT: {
    INDEX: "/reports",
    READ: (id: string) => `/reports/${id}`,
  },
  MY_REPORT: {
    INDEX: "/my-reports",
    CREATE: "/my-reports/create",
    READ: (id: string) => `/my-reports/${id}`,
  },
  USER: {
    INDEX: "/users",
  },
} as const

export const API_ROUTES = Object.freeze({
  AUTH: Object.freeze({
    LOGIN: `${BASE_API_URL}/auth/login`,
    REGISTER: `${BASE_API_URL}/auth/register`,
    LOGOUT: `${BASE_API_URL}/auth/session`,
  }),
  USERS: Object.freeze({
    ME: `${BASE_API_URL}/users/@me`,
    INDEX: `${BASE_API_URL}/users`,
    READ: (id: string) => `${BASE_API_URL}/users/${id}`,
  }),
  MY_REPORTS: Object.freeze({
    INDEX: `${BASE_API_URL}/users/@me/reports`,
    SUMMARY: `${BASE_API_URL}/users/@me/reports/summary`,
    READ: (id: string) => `${BASE_API_URL}/users/@me/reports/${id}`,
  }),
  REPORTS: Object.freeze({
    INDEX: `${BASE_API_URL}/reports`,
    READ: (id: string) => `${BASE_API_URL}/reports/${id}`,
    STATUS: (id: string) => `${BASE_API_URL}/reports/${id}/status`,
  }),
  PREDICTIONS: `${BASE_API_URL}/predictions`,
  STATISTICS: `${BASE_API_URL}/statistics`,
})
