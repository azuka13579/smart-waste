import type { ReactNode } from "react"
import { View } from "react-native"

import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"

/** Padanan `components/ui/field` di web: label, kontrol, teks pendukung, dan pesan error dalam satu kolom. */
export function Field({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn("gap-2", className)}>{children}</View>
}

export function FieldGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn("gap-5", className)}>{children}</View>
}

export function FieldLabel({ children, isInvalid = false }: { children: ReactNode; isInvalid?: boolean }) {
  return (
    <Text variant="label-lg" className={cn("text-foreground", isInvalid && "text-destructive")}>
      {children}
    </Text>
  )
}

/** Teks pendukung di bawah field. */
export function FieldDescription({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Text variant="body-sm" className={cn("text-muted-foreground", className)}>
      {children}
    </Text>
  )
}

export function FieldError({ errors }: { errors: { message?: string }[] }) {
  const message = errors.find((error) => error.message)?.message
  if (!message) return null

  return (
    <Text variant="body-sm" accessibilityRole="alert" className="text-destructive">
      {message}
    </Text>
  )
}
