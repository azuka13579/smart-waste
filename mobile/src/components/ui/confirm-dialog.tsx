import type { ReactNode } from "react"
import { Modal, Pressable, View } from "react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"

type ConfirmDialogProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel: string
  /** Ikon lucide di lingkaran atas; warnanya diatur pemanggil sesuai `tone`. */
  icon: ReactNode
  /** `destructive` untuk aksi yang tidak bisa dibatalkan (keluar, hapus). */
  tone?: "default" | "destructive"
  isLoading?: boolean
}

/** Dialog konfirmasi bergaya brand, pengganti `Alert.alert` bawaan sistem. Ketuk latar atau Back untuk batal. */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel, icon, tone = "default", isLoading = false }: ConfirmDialogProps) {
  return (
    <Modal visible={open} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center px-8">
        <Pressable accessibilityRole="button" accessibilityLabel="Batal" onPress={onClose} disabled={isLoading} className="absolute inset-0 bg-black/45" />
        <View accessibilityViewIsModal className="w-full max-w-[360px] items-center rounded-sheet bg-card px-6 pb-4 pt-7">
          <View className={cn("mb-4 h-14 w-14 items-center justify-center rounded-full", tone === "destructive" ? "bg-destructive-container" : "bg-secondary")}>
            {icon}
          </View>
          <Text variant="title-lg" accessibilityRole="header" className="text-center">
            {title}
          </Text>
          <Text variant="body-md" className="mt-2 text-center text-muted-foreground">
            {description}
          </Text>
          <View className="mt-6 w-full gap-1">
            <Button variant={tone === "destructive" ? "destructive" : "default"} onPress={onConfirm} isLoading={isLoading}>
              {confirmLabel}
            </Button>
            <Button variant="text" onPress={onClose} disabled={isLoading} className="self-stretch">
              Batal
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  )
}
