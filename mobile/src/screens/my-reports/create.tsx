import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useLocalSearchParams, useRouter } from "expo-router"
import { type ComponentRef, useEffect, useRef, useState } from "react"
import { KeyboardAvoidingView, ScrollView, View } from "react-native"

import { FormErrorAlert } from "@/components/common/form-error-alert"
import { getFieldErrors, TextareaField, TextField } from "@/components/common/form-fields"
import { LocationField } from "@/components/common/location-field"
import { PhotoPicker } from "@/components/common/photo-picker"
import { ScreenHeader, Sheet } from "@/components/common/screen-header"
import { SectionHeader } from "@/components/common/section-header"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { type CreateReportFormValues, createReportFormSchema, type CreateReportPayload, type LocalPhoto } from "@/lib/schemas/report"
import { createMyReport, predictWaste } from "@/lib/services/my-report"
import type { CreatedReport } from "@/lib/types/report"

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

type PhotoParams = { photoUri?: string; photoWidth?: string; photoHeight?: string }

export default function CreateReportScreen() {
  const router = useRouter()
  // Foto yang dibawa dari tab Cek Sampah ("Laporkan sampah ini")
  const params = useLocalSearchParams<PhotoParams>()
  // Ganti key = form dipasang ulang dari awal, termasuk mencari lokasi lagi
  const [formKey, setFormKey] = useState(0)
  const [initialPhoto, setInitialPhoto] = useState<LocalPhoto | null>(null)

  // Tab tetap terpasang di belakang layar, jadi foto baru dari Cek Sampah datang sebagai perubahan param
  useEffect(() => {
    if (!params.photoUri) return
    setInitialPhoto({ uri: params.photoUri, width: Number(params.photoWidth), height: Number(params.photoHeight) })
    setFormKey((key) => key + 1)
    router.setParams({ photoUri: undefined, photoWidth: undefined, photoHeight: undefined })
  }, [params.photoUri, params.photoWidth, params.photoHeight, router])

  return (
    <View className="flex-1 bg-primary">
      <ScreenHeader title="Buat laporan" subtitle="Foto, lokasi, dan keterangan singkat sudah cukup." />
      <Sheet>
        <CreateReportForm
          key={formKey}
          initialPhoto={initialPhoto}
          onCreated={(report) => {
            // Form dikosongkan untuk laporan berikutnya, lalu detail laporan baru dibuka
            setInitialPhoto(null)
            setFormKey((key) => key + 1)
            router.push({ pathname: "/reports/[id]", params: { id: report.id, created: "1" } })
          }}
        />
      </Sheet>
    </View>
  )
}

type CreateReportFormProps = {
  initialPhoto: LocalPhoto | null
  onCreated: (report: CreatedReport) => void
}

function CreateReportForm({ initialPhoto, onCreated }: CreateReportFormProps) {
  const queryClient = useQueryClient()
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null)

  // Pratinjau hasil model untuk foto yang dipilih; laporan tetap diklasifikasikan ulang di server saat dikirim
  const predictMutation = useMutation({ mutationFn: predictWaste })

  const createMutation = useMutation({
    mutationFn: createMyReport,
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: ["my-reports"] })
      onCreated(response.data)
    },
    onError: () => scrollRef.current?.scrollTo({ y: 0, animated: true }),
  })

  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    validators: { onChange: createReportFormSchema },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync(toPayload(value)).catch(() => undefined)
    },
    // Field yang salah bisa berada jauh di atas tombol kirim; kembali ke atas agar pesannya terlihat
    onSubmitInvalid: () => scrollRef.current?.scrollTo({ y: 0, animated: true }),
  })

  // Alamat dari GPS hanya mengisi kolom yang masih kosong atau masih berisi saran sebelumnya, tidak menimpa ketikan user
  const lastSuggestedAddress = useRef("")
  const handleAddressSuggestion = (address: string) => {
    const current = form.getFieldValue("address").trim()
    if (current !== "" && current !== lastSuggestedAddress.current) return
    lastSuggestedAddress.current = address
    form.setFieldValue("address", address)
  }

  const handlePhotoChange = (photo: LocalPhoto) => {
    form.setFieldValue("photo", photo)
    form.setFieldValue("category", "")
    predictMutation.reset()
    predictMutation.mutate(photo)
  }

  useEffect(() => {
    if (initialPhoto) handlePhotoChange(initialPhoto)
    // Hanya sekali saat form dipasang; form dipasang ulang (key baru) untuk setiap foto dari Cek Sampah
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <KeyboardAvoidingView className="flex-1" behavior="padding">
      <ScrollView ref={scrollRef} contentContainerClassName="pb-8 pt-6" keyboardShouldPersistTaps="handled">
        <FormErrorAlert error={createMutation.error} className="mx-5 mb-5" />

        <View className="gap-3 px-5">
          <form.Field
            name="photo"
            children={(field) => {
              const errors = getFieldErrors(field)
              return (
                <View className="gap-2">
                  <PhotoPicker
                    value={field.state.value}
                    onChange={(photo) => {
                      handlePhotoChange(photo)
                      field.handleBlur()
                    }}
                    isInvalid={errors.length > 0}
                  />
                  <FieldError errors={errors} />
                </View>
              )
            }}
          />
          <PredictionResult isPending={predictMutation.isPending} error={predictMutation.error} prediction={predictMutation.data?.data ?? null} />
        </View>

        <SectionHeader title="Jenis sampah" />
        <form.Field name="category" children={(field) => <CategoryField field={field} prediction={predictMutation.data?.data ?? null} />} />

        <SectionHeader title="Lokasi" description="Diambil dari GPS. Ketuk untuk membuka peta." />
        <View className="gap-5 px-5">
          <form.Field
            name="latitude"
            children={(latitudeField) => (
              <form.Field
                name="longitude"
                children={(longitudeField) => {
                  // Pesan lat/lng sama ("Lokasi belum didapatkan"), cukup tampilkan satu
                  const errors = [...getFieldErrors(latitudeField), ...getFieldErrors(longitudeField)].slice(0, 1)
                  return (
                    <View className="gap-2">
                      <LocationField
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
                    </View>
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
                label="Alamat atau patokan (opsional)"
                placeholder="Depan Pasar Dramaga, dekat gerbang 2"
                autoCapitalize="sentences"
                returnKeyType="done"
              />
            )}
          />
        </View>

        <SectionHeader title="Keterangan" />
        <View className="px-5">
          <form.Field
            name="description"
            children={(field) => (
              <TextareaField
                field={field}
                label="Deskripsi"
                maxLength={2000}
                placeholder="Contoh: tumpukan sampah plastik di depan pasar, sudah tiga hari."
                autoCapitalize="sentences"
              />
            )}
          />
        </View>
      </ScrollView>

      <View className="border-t border-border bg-card px-5 py-3">
        <form.Subscribe
          selector={(state) => state.isSubmitting}
          children={(isSubmitting) => (
            <Button onPress={() => void form.handleSubmit()} isLoading={isSubmitting}>
              {isSubmitting ? "Mengirim..." : "Kirim laporan"}
            </Button>
          )}
        />
      </View>
    </KeyboardAvoidingView>
  )
}
