/**
 * Warna yang sama dengan `tailwind.config.js`, untuk prop yang tidak menerima className
 * (`placeholderTextColor`, warna ikon lucide, `ActivityIndicator`, tab bar native).
 */
export const colors = {
  background: "#f6f8f7",
  foreground: "#1a201d",
  card: "#ffffff",
  primary: "#18864f",
  primaryForeground: "#ffffff",
  primaryDeep: "#0f6c3f",
  primaryMuted: "#cae6d3",
  secondary: "#e3f3ea",
  secondaryForeground: "#156b42",
  muted: "#f1f5f3",
  mutedForeground: "#617069",
  destructive: "#dc2626",
  destructiveOnContainer: "#9b1c1c",
  border: "#e3e9e6",
  input: "#c9d3ce",
  ring: "#25a563",
} as const

export const fonts = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
} as const
