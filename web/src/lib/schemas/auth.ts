import z from "zod"

/** Aturan sama dengan `AuthModel.loginBody` / `registerBody` di backend, pesan dalam Bahasa Indonesia. */
export const loginPayloadSchema = z.object({
  email: z.email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
})

export type LoginPayload = z.infer<typeof loginPayloadSchema>

export const registerPayloadSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  email: z.email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter").max(72, "Password maksimal 72 karakter"),
})

export type RegisterPayload = z.infer<typeof registerPayloadSchema>

/** Form register punya konfirmasi password yang tidak dikirim ke backend. */
export const registerFormSchema = registerPayloadSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak sama",
    path: ["confirmPassword"],
  })
