import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { FormErrorAlert } from "@/components/common/form-error-alert"
import { PasswordField, SelectField, TextField } from "@/components/common/form-fields"
import { SubmitButton } from "@/components/common/submit-button"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { UserRole, userRoleOptions } from "@/lib/enums/user"
import { ApiError } from "@/lib/http"
import {
  createUserFormSchema,
  createUserPayloadSchema,
  type EditUserFormValues,
  editUserFormSchema,
  type UpdateUserPayload,
} from "@/lib/schemas/user"
import { createUser, updateUser } from "@/lib/services/user"
import type { User } from "@/lib/types/user"

type UserFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Kosong untuk tambah pengguna; diisi untuk edit. */
  user?: User | null
  /** Admin tidak boleh mengubah role akunnya sendiri (aturan backend). */
  isSelf?: boolean
  onSaved: (user: User) => void
}

export function UserFormDialog({ open, onOpenChange, user, isSelf = false, onSaved }: UserFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* key: form dibuat ulang setiap kali dialog dibuka untuk user yang berbeda */}
        {open && <UserForm key={user?.id ?? "new"} user={user} isSelf={isSelf} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  )
}

/** Hanya kirim field yang berubah; backend menolak body kosong. */
function getChanges(user: User, values: EditUserFormValues): UpdateUserPayload {
  const changes: UpdateUserPayload = {}
  if (values.name.trim() !== user.name) changes.name = values.name.trim()
  if (values.email.toLowerCase() !== user.email) changes.email = values.email
  if (values.role !== user.role) changes.role = values.role
  if (values.password) changes.password = values.password
  return changes
}

function UserForm({ user, isSelf, onSaved }: Omit<UserFormDialogProps, "open" | "onOpenChange">) {
  const isEdit = !!user

  const mutation = useMutation({
    mutationFn: async (values: EditUserFormValues) => {
      if (!user) return createUser(createUserPayloadSchema.parse(values))
      return updateUser(user.id, getChanges(user, values))
    },
    onSuccess: (response) => {
      toast.success(isEdit ? "Perubahan disimpan" : "Pengguna ditambahkan")
      onSaved(response.data)
    },
  })

  const form = useForm({
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      role: user?.role ?? UserRole.User,
      password: "",
    } as EditUserFormValues,
    validators: { onChange: isEdit ? editUserFormSchema : createUserFormSchema },
    onSubmit: async ({ value }) => {
      if (user && Object.keys(getChanges(user, value)).length === 0) {
        onSaved(user)
        return
      }
      await mutation.mutateAsync(value).catch(() => undefined)
    },
  })

  const error = mutation.error
  const errorMessage = error instanceof ApiError && error.status === 409 ? "Email sudah dipakai akun lain." : undefined

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        form.handleSubmit()
      }}
      className="flex flex-col gap-6"
    >
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit pengguna" : "Tambah pengguna"}</DialogTitle>
        <DialogDescription>
          {isEdit ? "Mengganti password membuat pengguna ini keluar dari semua perangkat." : "Akun baru bisa langsung dipakai untuk masuk."}
        </DialogDescription>
      </DialogHeader>

      <FieldGroup className="gap-4">
        <FormErrorAlert error={error} message={errorMessage} />
        <form.Field name="name" children={(field) => <TextField field={field} label="Nama lengkap" autoComplete="off" autoFocus />} />
        <form.Field name="email" children={(field) => <TextField field={field} label="Email" type="email" autoComplete="off" />} />
        <form.Field
          name="role"
          children={(field) => (
            <SelectField
              field={field}
              label="Role"
              options={userRoleOptions}
              disabled={isSelf}
              description={isSelf ? "Role akunmu sendiri tidak bisa diubah." : "Admin mengelola laporan dan pengguna, user mengirim laporan."}
            />
          )}
        />
        <form.Field
          name="password"
          children={(field) => (
            <PasswordField
              field={field}
              label={isEdit ? "Password baru" : "Password"}
              description={isEdit ? "Kosongkan jika tidak ingin mengganti." : "Minimal 8 karakter."}
              autoComplete="new-password"
            />
          )}
        />
      </FieldGroup>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Batal
          </Button>
        </DialogClose>
        <form.Subscribe
          selector={(state) => state.isSubmitting}
          children={(isSubmitting) => (
            <SubmitButton isSubmitting={isSubmitting} submittingText="Menyimpan...">
              {isEdit ? "Simpan" : "Tambah"}
            </SubmitButton>
          )}
        />
      </DialogFooter>
    </form>
  )
}
