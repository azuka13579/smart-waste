import { LeafIcon } from "lucide-react-native"
import { View } from "react-native"

import { Text } from "@/components/ui/text"
import { APP_NAME } from "@/lib/constants"
import { colors } from "@/lib/theme"
import { cn } from "@/lib/utils"

/** Tanda aplikasi di atas permukaan hijau: daun hijau di kotak putih, nama dan kepanjangannya dalam putih. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <View className={cn("flex-row items-center gap-3", className)}>
      <View className="h-12 w-12 items-center justify-center rounded-xl bg-card">
        <LeafIcon size={24} color={colors.primary} />
      </View>
      <View>
        <Text variant="title-lg" className="text-primary-foreground">
          {APP_NAME}
        </Text>
        <Text variant="body-sm" className="text-primary-muted">
          Management System
        </Text>
      </View>
    </View>
  )
}
