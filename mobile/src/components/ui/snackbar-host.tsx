import { CircleAlertIcon, CircleCheckIcon, XIcon } from "lucide-react-native"
import { useEffect, useRef } from "react"
import { AccessibilityInfo, Animated, Pressable, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Text } from "@/components/ui/text"
import { dismissSnackbar, useSnackbar } from "@/lib/snackbar"
import { colors } from "@/lib/theme"
import { cn } from "@/lib/utils"

/** Jarak dari bawah agar snackbar tidak menutupi tab bar. */
const BOTTOM_OFFSET = 88

const TONES = {
  success: { container: "bg-primary", text: "text-primary-foreground", icon: CircleCheckIcon, color: colors.primaryForeground },
  error: { container: "bg-destructive-container", text: "text-destructive-on-container", icon: CircleAlertIcon, color: colors.destructiveOnContainer },
} as const

/** Snackbar bernada brand di atas seluruh layar. Dipasang sekali di root layout; tampilkan lewat `showSnackbar()`. */
export function SnackbarHost() {
  const message = useSnackbar()
  const insets = useSafeAreaInsets()
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!message) return
    progress.setValue(0)
    Animated.timing(progress, { toValue: 1, duration: 220, useNativeDriver: true }).start()
    AccessibilityInfo.announceForAccessibility(message.text)
  }, [message, progress])

  if (!message) return null

  const tone = TONES[message.tone]
  const Icon = tone.icon

  return (
    // Posisi lewat style: NativeWind tidak meneruskan className ke Animated.View
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: insets.bottom + BOTTOM_OFFSET,
        opacity: progress,
        transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
      }}
    >
      <View
        accessibilityRole="alert"
        className={cn("min-h-14 flex-row items-center gap-3 rounded-xl py-2 pl-4 pr-1", tone.container)}
        style={{ shadowColor: "#0f6c3f", shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}
      >
        <Icon size={20} color={tone.color} />
        <Text variant="title-sm" className={cn("flex-1", tone.text)}>
          {message.text}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tutup pesan"
          onPress={dismissSnackbar}
          className="h-12 w-12 items-center justify-center rounded-full active:bg-black/10"
        >
          <XIcon size={18} color={tone.color} />
        </Pressable>
      </View>
    </Animated.View>
  )
}
