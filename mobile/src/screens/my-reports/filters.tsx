import { DateTimePickerAndroid } from "@react-native-community/datetimepicker"
import { CalendarIcon } from "lucide-react-native"
import { useState } from "react"
import { Platform, Pressable, View } from "react-native"

import { BottomSheet } from "@/components/ui/bottom-sheet"
import { Button } from "@/components/ui/button"
import { ChoiceChip } from "@/components/ui/choice-chip"
import { Text } from "@/components/ui/text"
import { DATE_PRESETS, type DateRange, toDateParam } from "@/lib/date-range"
import { type WasteCategory, wasteCategoryOptions } from "@/lib/enums/report"
import { formatDate } from "@/lib/format"
import { colors } from "@/lib/theme"
import { cn } from "@/lib/utils"

type CategorySheetProps = {
  open: boolean
  onClose: () => void
  value: WasteCategory | undefined
  onChange: (value: WasteCategory | undefined) => void
}

/** Pilihan jenis sampah; langsung diterapkan saat dipilih. */
export function CategorySheet({ open, onClose, value, onChange }: CategorySheetProps) {
  const select = (next: WasteCategory | undefined) => {
    onChange(next)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Jenis sampah">
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
        <ChoiceChip label="Semua jenis" selected={!value} onPress={() => select(undefined)} />
        {wasteCategoryOptions.map((option) => (
          <ChoiceChip key={option.value} label={option.label} selected={value === option.value} onPress={() => select(option.value)} />
        ))}
      </View>
    </BottomSheet>
  )
}

type DateRangeSheetProps = {
  open: boolean
  onClose: () => void
  value: DateRange
  onChange: (value: DateRange) => void
}

/**
 * Rentang tanggal laporan: preset yang sering dipakai, atau tanggal kustom lewat pemilih tanggal native Android.
 * Tanggal kustom baru diterapkan setelah menekan "Terapkan".
 */
export function DateRangeSheet({ open, onClose, value, onChange }: DateRangeSheetProps) {
  const [draft, setDraft] = useState<DateRange>(value)
  const isInvalid = !!(draft.from && draft.to && draft.from > draft.to)
  const canApply = !isInvalid && (draft.from !== value.from || draft.to !== value.to)

  const apply = (range: DateRange) => {
    onChange(range)
    onClose()
  }

  // Draft disamakan dengan filter aktif setiap kali sheet dibuka
  const [lastOpen, setLastOpen] = useState(open)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) setDraft(value)
  }

  const pickDate = (field: "from" | "to") => {
    const current = draft[field] ? new Date(`${draft[field]}T00:00:00`) : new Date()
    DateTimePickerAndroid.open({
      value: current,
      mode: "date",
      maximumDate: new Date(),
      onChange: (event, date) => {
        if (event.type === "set" && date) setDraft((prev) => ({ ...prev, [field]: toDateParam(date) }))
      },
    })
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Tanggal laporan"
      footer={
        Platform.OS === "android" && (
          <Button disabled={!canApply} onPress={() => apply(draft)}>
            Terapkan tanggal
          </Button>
        )
      }
    >
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
        <ChoiceChip label="Semua waktu" selected={!value.from && !value.to} onPress={() => apply({})} />
        {DATE_PRESETS.map((preset) => {
          const range = preset.range()
          return (
            <ChoiceChip
              key={preset.id}
              label={preset.label}
              selected={value.from === range.from && value.to === range.to}
              onPress={() => apply(range)}
            />
          )
        })}
      </View>

      {/* Pemilih tanggal native hanya tersedia di Android (platform aplikasi ini) */}
      {Platform.OS === "android" && (
        <>
          <Text variant="title-sm" className="mb-3 mt-6">
            Pilih tanggal sendiri
          </Text>
          <View className="flex-row gap-3">
            <DateField label="Dari" value={draft.from} onPress={() => pickDate("from")} />
            <DateField label="Sampai" value={draft.to} onPress={() => pickDate("to")} />
          </View>
          {isInvalid && (
            <Text variant="body-sm" className="mt-2 text-destructive">
              Tanggal awal harus sebelum tanggal akhir.
            </Text>
          )}
        </>
      )}
    </BottomSheet>
  )
}

function DateField({ label, value, onPress }: { label: string; value: string | undefined; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value ? formatDate(value) : "belum dipilih"}`}
      onPress={onPress}
      className="h-14 flex-1 flex-row items-center gap-3 rounded-lg bg-muted px-4 active:bg-secondary"
    >
      <CalendarIcon size={18} color={value ? colors.primary : colors.mutedForeground} />
      <View className="flex-1">
        <Text variant="body-sm" className="text-muted-foreground">
          {label}
        </Text>
        <Text variant="title-sm" className={cn(!value && "text-muted-foreground")} numberOfLines={1}>
          {value ? formatDate(value) : "Pilih"}
        </Text>
      </View>
    </Pressable>
  )
}
