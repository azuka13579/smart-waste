import type { Permission, UserRole } from "@/lib/enums/user"

/** Cermin `UsersModel.userSchema` di backend. */
export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** Cermin `UsersModel.meSchema`. */
export type CurrentUser = User & {
  permissions: Permission[]
}

export type UserListQuery = {
  /** Cocok dengan nama atau email. */
  search?: string
  role?: UserRole
  isActive?: "true" | "false"
  page?: number
  limit?: number
}

export type SignInResult = {
  token: string
  expiresAt: string
  user: CurrentUser
}
