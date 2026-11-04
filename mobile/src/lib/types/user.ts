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

/** Cermin `AuthModel.signInResponse`. Mobile mengirim `token` sebagai `Authorization: Bearer <token>`. */
export type SignInResult = {
  token: string
  expiresAt: string
  user: CurrentUser
}
