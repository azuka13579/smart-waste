import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { FormErrorAlert } from "@/components/common/form-error-alert"
import { PasswordField, TextField } from "@/components/common/form-fields"
import { Panel, PanelFormSection, PanelHeader } from "@/components/common/panel"
import { SubmitButton } from "@/components/common/submit-button"
import { UserAvatar } from "@/components/common/user-avatar"
import { DetailField } from "@/components/common/detail-field"
import { userRoleLabels } from "@/lib/enums/user"
import { formatDate } from "@/lib/format"
import { ApiError } from "@/lib/http"
import { type ChangePasswordFormValues, changePasswordFormSchema, type ProfileFormValues, profileFormSchema } from "@/lib/schemas/profile"
import { updateMe } from "@/lib/services/auth"
import { useSession, useSetSession } from "@/lib/session"
import type { CurrentUser } from "@/lib/types/user"

export default function ProfilePage() {
  const { user } = useSession()
  if (!user) return null

  return (
    <>
      <Panel>
        <PanelHeader
          title="Profil Saya"
          description={`${user.email} · ${userRoleLabels[user.role]}`}
          leading={<UserAvatar name={user.name} className="size-10" />}
        />
      </Panel>

      <Panel>
        <ProfileForm user={user} />
        <ChangePasswordForm />
      </Panel>
    </>
  )
}

function ProfileForm({ user }: { user: CurrentUser }) {
  const setSession = useSetSession()

  const mutation = useMutation({
    mutationFn: (values: ProfileFormValues) => updateMe({ name: values.name.trim() }),
    onSuccess: (response) => {
      setSession(response.data)
      form.reset({ name: response.data.name })
      toast.success("Profil diperbarui")
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
    <form
      noValidate
      // Setiap form punya PanelFormSection sendiri, jadi garis pemisah antarbagian dipasang di form
      className="border-b"
      onSubmit={(event) => {
        event.preventDefault()
        form.handleSubmit()
      }}
    >
      <PanelFormSection title="Informasi akun" description="Nama tampil di laporan dan riwayat status.">
        <FormErrorAlert error={mutation.error} />
        <form.Field name="name" children={(field) => <TextField field={field} label="Nama lengkap" autoComplete="name" />} />
        <dl className="grid grid-cols-2 gap-4">
          <DetailField label="Email">{user.email}</DetailField>
          <DetailField label="Bergabung">{formatDate(user.createdAt)}</DetailField>
        </dl>
        <form.Subscribe
          selector={(state) => ({ isSubmitting: state.isSubmitting, isDirty: state.values.name.trim() !== user.name })}
          children={({ isSubmitting, isDirty }) => (
            <SubmitButton className="self-start" disabled={!isDirty} isSubmitting={isSubmitting} submittingText="Menyimpan...">
              Simpan
            </SubmitButton>
          )}
        />
      </PanelFormSection>
    </form>
  )
}

const EMPTY_PASSWORDS: ChangePasswordFormValues = { currentPassword: "", newPassword: "", confirmPassword: "" }

function ChangePasswordForm() {
  const mutation = useMutation({
    mutationFn: (values: ChangePasswordFormValues) =>
      updateMe({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
    onSuccess: () => {
      form.reset(EMPTY_PASSWORDS)
      toast.success("Password diganti")
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
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        form.handleSubmit()
      }}
    >
      <PanelFormSection title="Ganti password" description="Gunakan minimal 8 karakter yang tidak dipakai di akun lain.">
        <FormErrorAlert error={error} message={errorMessage} />
        <form.Field
          name="currentPassword"
          children={(field) => <PasswordField field={field} label="Password saat ini" autoComplete="current-password" />}
        />
        <form.Field name="newPassword" children={(field) => <PasswordField field={field} label="Password baru" autoComplete="new-password" />} />
        <form.Field
          name="confirmPassword"
          children={(field) => <PasswordField field={field} label="Konfirmasi password baru" autoComplete="new-password" />}
        />
        <form.Subscribe
          selector={(state) => state.isSubmitting}
          children={(isSubmitting) => (
            <SubmitButton className="self-start" isSubmitting={isSubmitting} submittingText="Menyimpan...">
              Ganti password
            </SubmitButton>
          )}
        />
      </PanelFormSection>
    </form>
  )
}
