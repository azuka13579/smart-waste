/** Value harus sama persis dengan `constants/user.ts` di backend. */
export const UserRole = {
  Admin: "admin",
  User: "user",
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const userRoleLabels: Record<UserRole, string> = {
  [UserRole.Admin]: "Admin",
  [UserRole.User]: "User",
}

/** Nama flag dari `constants/permissions.ts` di backend. `/users/@me` mengembalikan nama-nama ini. */
export const Permission = {
  Administrator: "ADMINISTRATOR",
  ManageUsers: "MANAGE_USERS",
  SendReports: "SEND_REPORTS",
  ManageReports: "MANAGE_REPORTS",
  ViewStatistics: "VIEW_STATISTICS",
} as const

export type Permission = (typeof Permission)[keyof typeof Permission]
