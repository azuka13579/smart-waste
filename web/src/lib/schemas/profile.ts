import z from "zod"

/** Sama dengan `UsersModel.updateMeBody` di backend. */
export const profileFormSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
})

export type ProfileFormValues = z.infer<typeof profileFormSchema>

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
    newPassword: z.string().min(8, "Password minimal 8 karakter").max(72, "Password maksimal 72 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak sama",
    path: ["confirmPassword"],
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>

export type UpdateMePayload = {
  name?: string
  currentPassword?: string
  newPassword?: string
}
