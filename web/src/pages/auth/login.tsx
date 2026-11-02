import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { Link, useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"

import { FormErrorAlert } from "@/components/common/form-error-alert"
import { PasswordField, TextField } from "@/components/common/form-fields"
import { SubmitButton } from "@/components/common/submit-button"
import { FieldGroup } from "@/components/ui/field"
import { ROUTES } from "@/lib/constants"
import { ApiError } from "@/lib/http"
import { type LoginPayload, loginPayloadSchema } from "@/lib/schemas/auth"
import { login } from "@/lib/services/auth"
import { useSetSession } from "@/lib/session"

const LOGIN_ERROR_MESSAGES: Record<number, string> = {
  401: "Email atau password salah",
  403: "Akun kamu sudah dinonaktifkan. Hubungi admin.",
}

/** Hanya path internal agar `?redirect=` tidak bisa dipakai untuk mengarahkan ke situs lain. */
function getSafeRedirect(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : ROUTES.HOME
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setSession = useSetSession()

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      setSession(response.data.user)
      toast.success(`Selamat datang, ${response.data.user.name}`)
      navigate(getSafeRedirect(searchParams.get("redirect")), { replace: true })
    },
  })

  const form = useForm({
    defaultValues: { email: "", password: "" } satisfies LoginPayload,
    validators: { onChange: loginPayloadSchema },
    onSubmit: async ({ value }) => {
      await loginMutation.mutateAsync(value).catch(() => undefined)
    },
  })

  const error = loginMutation.error
  const errorMessage = error instanceof ApiError ? LOGIN_ERROR_MESSAGES[error.status] : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Masuk</h1>
        <p className="text-sm text-muted-foreground">Gunakan email dan password akun kamu.</p>
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
            name="email"
            children={(field) => (
              <TextField field={field} label="Email" type="email" autoComplete="email" autoFocus />
            )}
          />
          <form.Field
            name="password"
            children={(field) => <PasswordField field={field} label="Password" autoComplete="current-password" />}
          />
          <form.Subscribe
            selector={(state) => state.isSubmitting}
            children={(isSubmitting) => (
              <SubmitButton className="w-full" isSubmitting={isSubmitting} submittingText="Memproses...">
                Masuk
              </SubmitButton>
            )}
          />
        </FieldGroup>
      </form>

      <p className="border-t pt-5 text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link to={ROUTES.REGISTER} className="font-medium text-foreground underline-offset-4 hover:underline">
          Daftar
        </Link>
      </p>
    </div>
  )
}
