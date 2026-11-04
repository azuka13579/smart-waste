import type { ReactNode } from "react"
import { Modal, Pressable, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Text } from "@/components/ui/text"

type BottomSheetProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Tombol di dasar sheet, misalnya "Terapkan". */
  footer?: ReactNode
}

/** Bottom sheet modal Material 3: ketuk latar atau tombol Back untuk menutup. */
export function BottomSheet({ open, onClose, title, children, footer }: BottomSheetProps) {
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={open} transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable accessibilityRole="button" accessibilityLabel="Tutup" onPress={onClose} className="absolute inset-0 bg-black/30 rounded-xl" />
        <View style={{ paddingBottom: insets.bottom + 16 }} className="rounded-t-sheet bg-card px-5 pt-3">
          <View className="mb-4 h-1 w-8 self-center rounded-full bg-input" />
          <Text variant="title-lg" accessibilityRole="header" className="mb-4">
            {title}
          </Text>
          {children}
          {footer && <View className="mt-6">{footer}</View>}
        </View>
      </View>
    </Modal>
  )
}
