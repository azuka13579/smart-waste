import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import { useRef } from "react"
import { Text } from "@/components/ui/text"

import { AuthScreenLayout } from "@/components/common/auth-screen-layout"
import { FormErrorAlert } from "@/components/common/form-error-alert"
import { PasswordField, TextField } from "@/components/common/form-fields"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import type { InputRef } from "@/components/ui/input"
import { ROUTES } from "@/lib/constants"
import { ApiError } from "@/lib/http"
import { type LoginPayload, loginPayloadSchema } from "@/lib/schemas/auth"
import { login } from "@/lib/services/auth"
import { useSetSession } from "@/lib/session"

const LOGIN_ERROR_MESSAGES: Record<number, string> = {
  401: "Email atau password salah",
  403: "Akun kamu sudah dinonaktifkan. Hubungi admin.",
}

export default function LoginScreen() {
  const router = useRouter()
  const setSession = useSetSession()
  const passwordRef = useRef<InputRef>(null)

  // Begitu sesi terisi, root layout otomatis memindahkan user ke halaman utama
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => setSession(response.data),
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
    <AuthScreenLayout
      title="Masuk"
      description="Gunakan email dan password akun kamu."
      footer={
        <>
          <Text className="text-muted-foreground">Belum punya akun?</Text>
          <Button variant="text" size="sm" onPress={() => router.replace(ROUTES.REGISTER)}>
            Daftar
          </Button>
        </>
      }
    >
      <FieldGroup>
        <FormErrorAlert error={error} message={errorMessage} />
        <form.Field
          name="email"
          children={(field) => (
            <TextField
              field={field}
              label="Email"
              placeholder="nama@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          )}
        />
        <form.Field
          name="password"
          children={(field) => (
            <PasswordField
              ref={passwordRef}
              field={field}
              label="Password"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={() => form.handleSubmit()}
            />
          )}
        />
        <form.Subscribe
          selector={(state) => state.isSubmitting}
          children={(isSubmitting) => (
            <Button onPress={() => form.handleSubmit()} isLoading={isSubmitting} className="mt-3">
              {isSubmitting ? "Memproses..." : "Masuk"}
            </Button>
          )}
        />
      </FieldGroup>
    </AuthScreenLayout>
  )
}
