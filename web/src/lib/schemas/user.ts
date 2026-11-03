import z from "zod"

import { UserRole } from "@/lib/enums/user"

/** Aturan sama dengan `UsersModel.createBody` / `updateBody` di backend. */
const name = z.string().trim().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter")
const email = z.email("Format email tidak valid")
const password = z.string().min(8, "Password minimal 8 karakter").max(72, "Password maksimal 72 karakter")

export const createUserPayloadSchema = z.object({
  name,
  email,
  password,
  role: z.enum(UserRole),
})

export type CreateUserPayload = z.infer<typeof createUserPayloadSchema>

/** Saat edit, password boleh dikosongkan agar tidak diubah. */
export const editUserFormSchema = createUserPayloadSchema.extend({
  password: z.union([z.literal(""), password]),
})

export type EditUserFormValues = z.infer<typeof editUserFormSchema>

/** Bentuk sama dengan form edit, tapi password wajib diisi untuk akun baru. */
export const createUserFormSchema = editUserFormSchema.refine((values) => values.password !== "", {
  message: "Password wajib diisi",
  path: ["password"],
})

export type UpdateUserPayload = Partial<CreateUserPayload> & { isActive?: boolean }
