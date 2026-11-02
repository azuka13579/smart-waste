import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeftIcon } from "lucide-react"
import { useRef } from "react"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"

import { FormErrorAlert } from "@/components/common/form-error-alert"
import { getFieldErrors, TextareaField, TextField } from "@/components/common/form-fields"
import { LocationPicker } from "@/components/common/location-picker"
import { Panel, PanelFormSection, PanelHeader, PanelSection } from "@/components/common/panel"
import { PhotoDropzone } from "@/components/common/photo-dropzone"
import { SubmitButton } from "@/components/common/submit-button"
import { Button } from "@/components/ui/button"
import { Field, FieldError } from "@/components/ui/field"
import { ROUTES } from "@/lib/constants"
import { type CreateReportFormValues, createReportFormSchema, type CreateReportPayload, REPORT_PHOTO } from "@/lib/schemas/report"
import { createMyReport, predictWaste } from "@/lib/services/my-report"

import { CategoryField, PredictionResult } from "./prediction"

const DEFAULT_VALUES: CreateReportFormValues = {
  photo: null,
  description: "",
  latitude: null,
  longitude: null,
  address: "",
  category: "",
}

/** Form sudah divalidasi zod, jadi foto dan koordinat dijamin ada di sini. */
function toPayload(values: CreateReportFormValues): CreateReportPayload {
  return {
    photo: values.photo!,
    description: values.description.trim(),
    latitude: values.latitude!,
    longitude: values.longitude!,
    address: values.address.trim() || undefined,
    category: values.category || undefined,
  }
}

const isAcceptedPhoto = (file: File) => (REPORT_PHOTO.types as readonly string[]).includes(file.type) && file.size <= REPORT_PHOTO.maxSize

export default function CreateReportPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Pratinjau hasil model untuk foto yang dipilih; laporan tetap diklasifikasikan ulang di server saat dikirim
  const predictMutation = useMutation({ mutationFn: predictWaste })

  const createMutation = useMutation({
    mutationFn: createMyReport,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["my-reports"] })
      toast.success("Laporan terkirim")
      navigate(ROUTES.MY_REPORT.READ(response.data.id), { replace: true })
    },
  })

  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    validators: { onChange: createReportFormSchema },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync(toPayload(value)).catch(() => undefined)
    },
  })

  // Alamat dari peta hanya mengisi kolom yang masih kosong atau masih berisi saran sebelumnya, tidak menimpa ketikan user
  const lastSuggestedAddress = useRef("")
  const handleAddressSuggestion = (address: string) => {
    const current = form.getFieldValue("address").trim()
    if (current !== "" && current !== lastSuggestedAddress.current) return
    lastSuggestedAddress.current = address
    form.setFieldValue("address", address)
  }

  const handlePhotoChange = (file: File | null) => {
    form.setFieldValue("photo", file)
    form.setFieldValue("category", "")
    predictMutation.reset()
    if (file && isAcceptedPhoto(file)) predictMutation.mutate(file)
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title="Buat Laporan"
          description="Laporkan tumpukan sampah agar segera ditindaklanjuti."
          leading={
            <Button variant="outline" size="icon-sm" asChild>
              <Link to={ROUTES.MY_REPORT.INDEX} aria-label="Kembali ke Laporan Saya">
                <ArrowLeftIcon />
              </Link>
            </Button>
          }
        />
      </Panel>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          form.handleSubmit()
        }}
      >
        <Panel>
          {createMutation.error && (
            <PanelSection>
              <FormErrorAlert error={createMutation.error} />
            </PanelSection>
          )}

          <PanelFormSection title="Foto" description="Foto yang jelas membantu model mengenali jenis sampah. JPG, PNG, atau WebP, maksimal 10 MB.">
            <form.Field
              name="photo"
              children={(field) => {
                const errors = getFieldErrors(field)
                return (
                  <Field data-invalid={errors.length > 0}>
                    <PhotoDropzone
                      value={field.state.value}
                      onChange={(file) => {
                        handlePhotoChange(file)
                        field.handleBlur()
                      }}
                      accept={REPORT_PHOTO.accept}
                      hint="JPG, PNG, atau WebP, maksimal 10 MB"
                      isInvalid={errors.length > 0}
                    />
                    <FieldError errors={errors} />
                  </Field>
                )
              }}
            />
            <PredictionResult
              isPending={predictMutation.isPending}
              error={predictMutation.error}
              prediction={predictMutation.data?.data ?? null}
            />
          </PanelFormSection>

          <PanelFormSection title="Detail" description="Ceritakan kondisi sampah, misalnya sejak kapan menumpuk dan seberapa banyak.">
            <form.Field
              name="description"
              children={(field) => (
                <TextareaField field={field} label="Deskripsi" rows={4} placeholder="Tumpukan sampah plastik di depan pasar, sudah tiga hari." />
              )}
            />
            <form.Field
              name="category"
              children={(field) => <CategoryField field={field} prediction={predictMutation.data?.data ?? null} />}
            />
          </PanelFormSection>

          <PanelFormSection
            title="Lokasi"
            description="Cari alamat, klik peta, atau pakai lokasi saat ini. Alamat terisi otomatis dari titik yang dipilih dan masih bisa diubah."
          >
            <form.Field
              name="latitude"
              children={(latitudeField) => (
                <form.Field
                  name="longitude"
                  children={(longitudeField) => {
                    // Pesan lat/lng sama ("Tentukan lokasi laporan"), cukup tampilkan satu
                    const errors = [...getFieldErrors(latitudeField), ...getFieldErrors(longitudeField)].slice(0, 1)
                    return (
                      <Field data-invalid={errors.length > 0}>
                        <LocationPicker
                          value={{ latitude: latitudeField.state.value, longitude: longitudeField.state.value }}
                          onAddressSuggestion={handleAddressSuggestion}
                          onChange={(next) => {
                            latitudeField.handleChange(next.latitude)
                            longitudeField.handleChange(next.longitude)
                            latitudeField.handleBlur()
                            longitudeField.handleBlur()
                          }}
                          isInvalid={errors.length > 0}
                        />
                        <FieldError errors={errors} />
                      </Field>
                    )
                  }}
                />
              )}
            />
            <form.Field
              name="address"
              children={(field) => (
                <TextField
                  field={field}
                  label="Alamat (opsional)"
                  placeholder="Jl. Raya Dramaga, depan Pasar Dramaga"
                  description="Tambahkan patokan, misalnya nomor gerbang atau warung terdekat."
                />
              )}
            />
          </PanelFormSection>

          <PanelSection className="flex justify-end gap-2 bg-muted/30 py-3">
            <Button type="button" variant="outline" asChild>
              <Link to={ROUTES.MY_REPORT.INDEX}>Batal</Link>
            </Button>
            <form.Subscribe
              selector={(state) => state.isSubmitting}
              children={(isSubmitting) => (
                <SubmitButton isSubmitting={isSubmitting} submittingText="Mengirim...">
                  Kirim laporan
                </SubmitButton>
              )}
            />
          </PanelSection>
        </Panel>
      </form>
    </>
  )
}
