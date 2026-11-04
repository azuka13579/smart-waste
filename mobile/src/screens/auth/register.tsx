import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import { useRef } from "react"
import { Text } from "@/components/ui/text"
import type z from "zod"

import { AuthScreenLayout } from "@/components/common/auth-screen-layout"
import { FormErrorAlert } from "@/components/common/form-error-alert"
import { PasswordField, TextField } from "@/components/common/form-fields"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import type { InputRef } from "@/components/ui/input"
import { ROUTES } from "@/lib/constants"
import { ApiError } from "@/lib/http"
import { registerFormSchema } from "@/lib/schemas/auth"
import { register } from "@/lib/services/auth"
import { useSetSession } from "@/lib/session"

type RegisterFormValues = z.infer<typeof registerFormSchema>

export default function RegisterScreen() {
  const router = useRouter()
  const setSession = useSetSession()
  const emailRef = useRef<InputRef>(null)
  const passwordRef = useRef<InputRef>(null)
  const confirmPasswordRef = useRef<InputRef>(null)

  // Register langsung membuat sesi, jadi user tidak perlu login lagi
  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: (response) => setSession(response.data),
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
    <AuthScreenLayout
      title="Daftar"
      description="Akun user untuk mengirim dan memantau laporan sampah."
      footer={
        <>
          <Text className="text-muted-foreground">Sudah punya akun?</Text>
          <Button variant="text" size="sm" onPress={() => router.replace(ROUTES.LOGIN)}>
            Masuk
          </Button>
        </>
      }
    >
      <FieldGroup>
        <FormErrorAlert error={error} message={errorMessage} />
        <form.Field
          name="name"
          children={(field) => (
            <TextField
              field={field}
              label="Nama lengkap"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          )}
        />
        <form.Field
          name="email"
          children={(field) => (
            <TextField
              ref={emailRef}
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
              description="Minimal 8 karakter."
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            />
          )}
        />
        <form.Field
          name="confirmPassword"
          children={(field) => (
            <PasswordField
              ref={confirmPasswordRef}
              field={field}
              label="Konfirmasi password"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={() => form.handleSubmit()}
            />
          )}
        />
        <form.Subscribe
          selector={(state) => state.isSubmitting}
          children={(isSubmitting) => (
            <Button onPress={() => form.handleSubmit()} isLoading={isSubmitting} className="mt-3">
              {isSubmitting ? "Membuat akun..." : "Daftar"}
            </Button>
          )}
        />
      </FieldGroup>
    </AuthScreenLayout>
  )
}
