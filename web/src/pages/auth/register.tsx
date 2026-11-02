import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"
import type z from "zod"

import { FormErrorAlert } from "@/components/common/form-error-alert"
import { PasswordField, TextField } from "@/components/common/form-fields"
import { SubmitButton } from "@/components/common/submit-button"
import { FieldGroup } from "@/components/ui/field"
import { ROUTES } from "@/lib/constants"
import { ApiError } from "@/lib/http"
import { registerFormSchema } from "@/lib/schemas/auth"
import { register } from "@/lib/services/auth"
import { useSetSession } from "@/lib/session"

type RegisterFormValues = z.infer<typeof registerFormSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const setSession = useSetSession()

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: (response) => {
      setSession(response.data.user)
      toast.success("Akun berhasil dibuat")
      navigate(ROUTES.HOME, { replace: true })
    },
  })

  const form = useForm({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" } satisfies RegisterFormValues,
    validators: { onChange: registerFormSchema },
    onSubmit: async ({ value: { confirmPassword: _confirmPassword, ...payload } }) => {
      await registerMutation.mutateAsync(payload).catch(() => undefined)
    },
  })

  const error = registerMutation.error
  const errorMessage = error instanceof ApiError && error.status === 409 ? "Email sudah terdaftar, silakan masuk." : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Daftar</h1>
        <p className="text-sm text-muted-foreground">Akun warga untuk mengirim dan memantau laporan sampah.</p>
      </div>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          form.handleSubmit()
        }}
      >
        <FieldGroup className="gap-5">
          <FormErrorAlert error={error} message={errorMessage} />
          <form.Field
            name="name"
            children={(field) => <TextField field={field} label="Nama lengkap" autoComplete="name" autoFocus />}
          />
          <form.Field
            name="email"
            children={(field) => <TextField field={field} label="Email" type="email" autoComplete="email" />}
          />
          <form.Field
            name="password"
            children={(field) => (
              <PasswordField field={field} label="Password" description="Minimal 8 karakter." autoComplete="new-password" />
            )}
          />
          <form.Field
            name="confirmPassword"
            children={(field) => <PasswordField field={field} label="Konfirmasi password" autoComplete="new-password" />}
          />
          <form.Subscribe
            selector={(state) => state.isSubmitting}
            children={(isSubmitting) => (
              <SubmitButton className="w-full" isSubmitting={isSubmitting} submittingText="Membuat akun...">
                Daftar
              </SubmitButton>
            )}
          />
        </FieldGroup>
      </form>

      <p className="border-t pt-5 text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link to={ROUTES.LOGIN} className="font-medium text-foreground underline-offset-4 hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  )
}
