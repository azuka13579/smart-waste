import { Linking, View } from "react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

type PermissionNoticeProps = {
  message: string
  /** `false` berarti dialog izin tidak akan muncul lagi; arahkan ke pengaturan HP. */
  canAskAgain: boolean
  onRetry: () => void
}

/** Izin kamera, galeri, atau lokasi ditolak. Bentuknya banner dengan satu aksi pemulihan. */
export function PermissionNotice({ message, canAskAgain, onRetry }: PermissionNoticeProps) {
  return (
    <View className="flex-row items-center gap-2 rounded-lg bg-secondary py-1 pl-4 pr-1">
      <Text variant="body-md" className="flex-1 py-2 text-secondary-foreground">
        {message}
      </Text>
      {canAskAgain ? (
        <Button variant="text" size="sm" onPress={onRetry}>
          Izinkan
        </Button>
      ) : (
        <Button variant="text" size="sm" onPress={() => void Linking.openSettings()}>
          Pengaturan
        </Button>
      )}
    </View>
  )
}
