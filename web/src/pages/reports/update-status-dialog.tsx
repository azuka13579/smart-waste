import { useForm, useStore } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

import { FormErrorAlert } from "@/components/common/form-error-alert"
import { SelectField, TextareaField } from "@/components/common/form-fields"
import { SubmitButton } from "@/components/common/submit-button"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { ReportStatus, reportStatusLabels, reportStatusOptions } from "@/lib/enums/report"
import { type UpdateReportStatusValues, updateReportStatusPayloadSchema } from "@/lib/schemas/report"
import { updateReportStatus } from "@/lib/services/report"
import type { ReportDetail } from "@/lib/types/report"

/** Status berikutnya yang paling umum, agar petugas cukup menekan "Simpan". */
const NEXT_STATUS: Record<ReportStatus, ReportStatus> = {
  [ReportStatus.Pending]: ReportStatus.InProgress,
  [ReportStatus.InProgress]: ReportStatus.Completed,
  [ReportStatus.Completed]: ReportStatus.InProgress,
  [ReportStatus.Rejected]: ReportStatus.Pending,
}

type UpdateStatusDialogProps = {
  report: ReportDetail
  onUpdated: (report: ReportDetail) => void
}

export function UpdateStatusDialog({ report, onUpdated }: UpdateStatusDialogProps) {
  const [open, setOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: (values: UpdateReportStatusValues) =>
      updateReportStatus(report.id, { status: values.status, note: values.note || undefined }),
    onSuccess: (response) => {
      onUpdated(response.data)
      toast.success(`Status diubah menjadi ${reportStatusLabels[response.data.status]}`)
      setOpen(false)
    },
  })

  const form = useForm({
    defaultValues: { status: NEXT_STATUS[report.status], note: "" } as UpdateReportStatusValues,
    validators: { onChange: updateReportStatusPayloadSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value).catch(() => undefined)
    },
  })

  const selectedStatus = useStore(form.store, (state) => state.values.status)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      form.reset({ status: NEXT_STATUS[report.status], note: "" })
      mutation.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Ubah status</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            form.handleSubmit()
          }}
          className="flex flex-col gap-6"
        >
          <DialogHeader>
            <DialogTitle>Ubah status laporan</DialogTitle>
            <DialogDescription>Status saat ini: {reportStatusLabels[report.status]}. Perubahan dicatat di riwayat.</DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <FormErrorAlert error={mutation.error} />
            <form.Field
              name="status"
              children={(field) => (
                <SelectField
                  field={field}
                  label="Status baru"
                  options={reportStatusOptions.map((option) => ({ ...option, disabled: option.value === report.status }))}
                />
              )}
            />
            <form.Field
              name="note"
              children={(field) => (
                <TextareaField
                  field={field}
                  label={selectedStatus === ReportStatus.Rejected ? "Alasan penolakan" : "Catatan (opsional)"}
                  description="Catatan terlihat oleh warga pelapor."
                  rows={3}
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
                  Simpan
                </SubmitButton>
              )}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
