import { CircleAlertIcon } from "lucide-react-native"
import { View } from "react-native"

import { Text } from "@/components/ui/text"
import { getErrorMessage } from "@/lib/http"
import { colors } from "@/lib/theme"
import { cn } from "@/lib/utils"

type FormErrorAlertProps = {
  error: unknown
  /** Ganti pesan dari server, misalnya agar 401 tampil sebagai "Email atau password salah". */
  message?: string
  className?: string
}

/** Error dari server (bukan validasi per field), ditampilkan sebagai banner di atas form. */
export function FormErrorAlert({ error, message, className }: FormErrorAlertProps) {
  if (!error) return null

  return (
    <View accessibilityRole="alert" className={cn("flex-row items-start gap-3 rounded-lg bg-destructive-container px-4 py-3", className)}>
      <CircleAlertIcon size={20} color={colors.destructiveOnContainer} />
      <Text variant="body-md" className="flex-1 text-destructive-on-container">
        {message ?? getErrorMessage(error)}
      </Text>
    </View>
  )
}
