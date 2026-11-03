import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { FilterSelect } from "@/components/common/filter-select"
import { FormErrorAlert } from "@/components/common/form-error-alert"
import { TextareaField, TextField } from "@/components/common/form-fields"
import { SubmitButton } from "@/components/common/submit-button"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { type WasteCategory, wasteCategoryOptions } from "@/lib/enums/report"
import { ApiError } from "@/lib/http"
import { type EditReportFormValues, editReportFormSchema, type UpdateReportPayload } from "@/lib/schemas/report"
import { updateMyReport } from "@/lib/services/my-report"
import type { ReportDetail } from "@/lib/types/report"

type EditReportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  report: ReportDetail
  onSaved: (report: ReportDetail) => void
}

export function EditReportDialog({ open, onOpenChange, report, onSaved }: EditReportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">{open && <EditReportForm report={report} onSaved={onSaved} />}</DialogContent>
    </Dialog>
  )
}

/** Hanya kirim field yang berubah; backend menolak body kosong. */
function getChanges(report: ReportDetail, values: EditReportFormValues): UpdateReportPayload {
  const changes: UpdateReportPayload = {}
  if (values.description.trim() !== report.description) changes.description = values.description.trim()
  if ((values.address.trim() || null) !== report.address) changes.address = values.address.trim() || null
  if ((values.category || null) !== report.category) changes.category = values.category || null
  return changes
}

function EditReportForm({ report, onSaved }: Pick<EditReportDialogProps, "report" | "onSaved">) {
  const mutation = useMutation({
    mutationFn: (values: EditReportFormValues) => updateMyReport(report.id, getChanges(report, values)),
    onSuccess: (response) => {
      toast.success("Laporan diperbarui")
      onSaved(response.data)
    },
  })

  const form = useForm({
    defaultValues: {
      description: report.description,
      address: report.address ?? "",
      category: report.category ?? "",
    } as EditReportFormValues,
    validators: { onChange: editReportFormSchema },
    onSubmit: async ({ value }) => {
      if (Object.keys(getChanges(report, value)).length === 0) return onSaved(report)
      await mutation.mutateAsync(value).catch(() => undefined)
    },
  })

  const error = mutation.error
  const errorMessage =
    error instanceof ApiError && error.status === 409 ? "Laporan sudah mulai ditangani sehingga tidak bisa diubah lagi." : undefined

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
        <DialogTitle>Edit laporan</DialogTitle>
        <DialogDescription>Laporan hanya bisa diubah selama statusnya masih Pending. Foto dan lokasi tidak bisa diganti.</DialogDescription>
      </DialogHeader>

      <FieldGroup className="gap-4">
        <FormErrorAlert error={error} message={errorMessage} />
        <form.Field name="description" children={(field) => <TextareaField field={field} label="Deskripsi" rows={4} />} />
        <form.Field name="address" children={(field) => <TextField field={field} label="Alamat (opsional)" />} />
        <form.Field
          name="category"
          children={(field) => (
            <Field>
              <FieldLabel>Kategori</FieldLabel>
              <FilterSelect
                value={field.state.value as WasteCategory | ""}
                onChange={(value) => field.handleChange(value)}
                options={wasteCategoryOptions}
                allLabel="Belum dikategorikan"
                className="sm:w-full"
              />
            </Field>
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
              Simpan
            </SubmitButton>
          )}
        />
      </DialogFooter>
    </form>
  )
}
