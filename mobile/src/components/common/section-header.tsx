import type { ReactNode } from "react"
import { View } from "react-native"

import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"

type SectionHeaderProps = {
  title: string
  /** Satu kalimat penjelas di bawah judul. */
  description?: string
  /** Aksi kecil di kanan judul, misalnya tombol teks "Lihat semua". */
  action?: ReactNode
  className?: string
}

/** Judul kelompok isian di dalam lembar putih, tanpa kotak/kartu. */
export function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <View className={cn("flex-row items-end gap-2 pb-3 pl-5 pt-8", action ? "pr-2" : "pr-5", className)}>
      <View className="flex-1 gap-0.5">
        <Text variant="title-md" accessibilityRole="header">
          {title}
        </Text>
        {description && (
          <Text variant="body-sm" className="text-muted-foreground">
            {description}
          </Text>
        )}
      </View>
      {action}
    </View>
  )
}
