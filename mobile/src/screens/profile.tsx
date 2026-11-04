import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ChevronRightIcon, LogOutIcon } from "lucide-react-native"
import { useRef, useState } from "react"
import { KeyboardAvoidingView, Pressable, ScrollView, View } from "react-native"

import { FormErrorAlert } from "@/components/common/form-error-alert"
import { PasswordField, TextField } from "@/components/common/form-fields"
import { ScreenHeader, Sheet } from "@/components/common/screen-header"
import { SectionHeader } from "@/components/common/section-header"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { FieldGroup } from "@/components/ui/field"
import type { InputRef } from "@/components/ui/input"
import { Text } from "@/components/ui/text"
import { formatDate } from "@/lib/format"
import { ApiError } from "@/lib/http"
import { type ChangePasswordFormValues, changePasswordFormSchema, type ProfileFormValues, profileFormSchema } from "@/lib/schemas/profile"
import { logout, updateMe } from "@/lib/services/auth"
import { SESSION_QUERY_KEY, useSession, useSetSession } from "@/lib/session"
import { showSnackbar } from "@/lib/snackbar"
import { colors } from "@/lib/theme"
import type { CurrentUser } from "@/lib/types/user"

/** "Azka Raditya Hafidz" → "AR" */
function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("")
}

export default function ProfileScreen() {
  const { user } = useSession()
  const setSession = useSetSession()

  const [isLogoutOpen, setIsLogoutOpen] = useState(false)

  // Sesi lokal tetap dihapus walau request logout gagal (misalnya sedang offline)
  const logoutMutation = useMutation({ mutationFn: logout, onSettled: () => setSession(null) })

  if (!user) return null

  return (
    <View className="flex-1 bg-primary">
      <ScreenHeader title="Profil">
        <View className="flex-row items-center gap-4">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-card">
            <Text variant="title-lg" className="text-primary">
              {getInitials(user.name)}
            </Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Text variant="title-lg" numberOfLines={1} className="text-primary-foreground">
              {user.name}
            </Text>
            <Text variant="body-md" numberOfLines={1} className="text-primary-muted">
              {user.email}
            </Text>
            <Text variant="body-sm" className="text-primary-muted">
              Bergabung {formatDate(user.createdAt)}
            </Text>
          </View>
        </View>
      </ScreenHeader>

      <Sheet>
        <KeyboardAvoidingView className="flex-1" behavior="padding">
          <ScrollView contentContainerClassName="pb-10 pt-2" keyboardShouldPersistTaps="handled">
            <ProfileForm user={user} />
            <ChangePasswordForm />

            <SectionHeader title="Akun" />
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsLogoutOpen(true)}
              className="mx-5 flex-row items-center gap-4 rounded-xl bg-destructive-container p-4 active:opacity-80"
            >
              <View className="h-11 w-11 items-center justify-center rounded-full bg-card">
                <LogOutIcon size={20} color={colors.destructive} />
              </View>
              <View className="flex-1 gap-0.5">
                <Text variant="title-md" className="text-destructive-on-container">
                  Keluar dari akun
                </Text>
              </View>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Sheet>

      <ConfirmDialog
        open={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={() => logoutMutation.mutate()}
        isLoading={logoutMutation.isPending}
        tone="destructive"
        icon={<LogOutIcon size={26} color={colors.destructive} />}
        title="Keluar dari akun?"
        description="Kamu perlu masuk lagi untuk mengirim dan memantau laporan."
        confirmLabel="Keluar"
      />
    </View>
  )
}

function ProfileForm({ user }: { user: CurrentUser }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (values: ProfileFormValues) => updateMe({ name: values.name.trim() }),
    onSuccess: (response) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, response.data)
      form.reset({ name: response.data.name })
      showSnackbar("Nama diperbarui")
    },
  })

  const form = useForm({
    defaultValues: { name: user.name } as ProfileFormValues,
    validators: { onChange: profileFormSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value).catch(() => undefined)
    },
  })

  return (
    <>
      <SectionHeader title="Informasi akun" description="Nama tampil di laporan dan riwayat status." />
      <FieldGroup className="px-5">
        <FormErrorAlert error={mutation.error} />
        <form.Field
          name="name"
          children={(field) => (
            <TextField
              field={field}
              label="Nama lengkap"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="done"
              onSubmitEditing={() => void form.handleSubmit()}
            />
          )}
        />
        <form.Subscribe
          selector={(state) => ({ isSubmitting: state.isSubmitting, isDirty: state.values.name.trim() !== user.name })}
          children={({ isSubmitting, isDirty }) => (
            <Button variant="tonal" onPress={() => void form.handleSubmit()} isLoading={isSubmitting} disabled={!isDirty}>
              {isSubmitting ? "Menyimpan..." : "Simpan nama"}
            </Button>
          )}
        />
      </FieldGroup>
    </>
  )
}

const EMPTY_PASSWORDS: ChangePasswordFormValues = { currentPassword: "", newPassword: "", confirmPassword: "" }

function ChangePasswordForm() {
  const newPasswordRef = useRef<InputRef>(null)
  const confirmPasswordRef = useRef<InputRef>(null)

  const mutation = useMutation({
    mutationFn: (values: ChangePasswordFormValues) => updateMe({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
    onSuccess: () => {
      form.reset(EMPTY_PASSWORDS)
      showSnackbar("Password diganti")
    },
  })

  const form = useForm({
    defaultValues: EMPTY_PASSWORDS,
    validators: { onChange: changePasswordFormSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value).catch(() => undefined)
    },
  })

  const error = mutation.error
  const errorMessage = error instanceof ApiError && error.status === 400 ? "Password saat ini salah." : undefined

  return (
    <>
      <SectionHeader title="Ganti password" description="Gunakan minimal 8 karakter yang tidak dipakai di akun lain." />
      <FieldGroup className="px-5">
        <FormErrorAlert error={error} message={errorMessage} />
        <form.Field
          name="currentPassword"
          children={(field) => (
            <PasswordField
              field={field}
              label="Password saat ini"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => newPasswordRef.current?.focus()}
            />
          )}
        />
        <form.Field
          name="newPassword"
          children={(field) => (
            <PasswordField
              ref={newPasswordRef}
              field={field}
              label="Password baru"
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
              label="Konfirmasi password baru"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={() => void form.handleSubmit()}
            />
          )}
        />
        <form.Subscribe
          selector={(state) => ({ isSubmitting: state.isSubmitting, isEmpty: !state.values.currentPassword && !state.values.newPassword })}
          children={({ isSubmitting, isEmpty }) => (
            <Button variant="tonal" onPress={() => void form.handleSubmit()} isLoading={isSubmitting} disabled={isEmpty}>
              {isSubmitting ? "Menyimpan..." : "Ganti password"}
            </Button>
          )}
        />
      </FieldGroup>
    </>
  )
}
