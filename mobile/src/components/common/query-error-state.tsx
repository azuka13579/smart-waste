import { CloudOffIcon } from "lucide-react-native"
import { View } from "react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { getErrorMessage } from "@/lib/http"
import { colors } from "@/lib/theme"
import { cn } from "@/lib/utils"

type QueryErrorStateProps = {
  error: unknown
  onRetry: () => void
  isRetrying?: boolean
  title?: string
  className?: string
}

/** Data gagal dimuat (server mati, tidak ada internet). Selalu sertakan tombol coba lagi. */
export function QueryErrorState({ error, onRetry, isRetrying = false, title = "Gagal memuat data", className }: QueryErrorStateProps) {
  return (
    <View className={cn("items-center justify-center gap-4 px-8", className)}>
      <View className="h-14 w-14 items-center justify-center rounded-full bg-secondary">
        <CloudOffIcon size={26} color={colors.secondaryForeground} />
      </View>
      <View className="items-center gap-1">
        <Text variant="title-md">{title}</Text>
        <Text variant="body-md" className="text-center text-muted-foreground">
          {getErrorMessage(error)}
        </Text>
      </View>
      <Button variant="outline" size="sm" onPress={onRetry} isLoading={isRetrying}>
        Coba lagi
      </Button>
    </View>
  )
}
