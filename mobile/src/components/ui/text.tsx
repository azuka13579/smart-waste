import { Text as RNText, type TextProps as RNTextProps } from "react-native"

import { cn } from "@/lib/utils"

/** Peran tipe Material 3 dengan ketebalan Plus Jakarta Sans masing-masing. */
const variants = {
  display: "text-display-sm font-jakarta-bold",
  headline: "text-headline-sm font-jakarta-bold",
  "title-lg": "text-title-lg font-jakarta-semibold",
  "title-md": "text-title-md font-jakarta-semibold",
  "title-sm": "text-title-sm font-jakarta-semibold",
  "body-lg": "text-body-lg font-jakarta",
  "body-md": "text-body-md font-jakarta",
  "body-sm": "text-body-sm font-jakarta",
  "label-lg": "text-label-lg font-jakarta-semibold",
  "label-md": "text-label-md font-jakarta-medium",
} as const

export type TextVariant = keyof typeof variants

type TextProps = RNTextProps & {
  variant?: TextVariant
  className?: string
}

/** Semua teks aplikasi lewat komponen ini, agar font dan skala tipe konsisten. Warna default: foreground. */
export function Text({ variant = "body-md", className, ...props }: TextProps) {
  return <RNText className={cn("text-foreground", variants[variant], className)} {...props} />
}
