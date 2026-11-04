import type { ReactNode } from "react"
import { ActivityIndicator, Pressable, type PressableProps } from "react-native"

import { Text } from "@/components/ui/text"
import { colors } from "@/lib/theme"
import { cn } from "@/lib/utils"

/** Varian tombol Material 3: filled untuk aksi utama, tonal/outline untuk aksi kedua, text untuk aksi ringan. */
const containerVariants = {
  default: "bg-primary active:bg-primary-deep",
  tonal: "bg-secondary active:opacity-80",
  outline: "border border-primary/40 bg-card active:bg-secondary",
  text: "bg-transparent active:bg-secondary",
  destructive: "bg-destructive active:opacity-90",
  /** Tombol putih di atas permukaan hijau. */
  inverse: "bg-card active:bg-secondary",
} as const

const textVariants = {
  default: "text-primary-foreground",
  tonal: "text-secondary-foreground",
  outline: "text-primary",
  text: "text-primary",
  destructive: "text-destructive-foreground",
  inverse: "text-primary",
} as const

const contentColors = {
  default: colors.primaryForeground,
  tonal: colors.secondaryForeground,
  outline: colors.primary,
  text: colors.primary,
  destructive: colors.primaryForeground,
  inverse: colors.primary,
} as const

/** Tinggi 52 dp untuk aksi utama (lebih dari target sentuh 48 dp). `sm` 40 dp untuk tombol di dalam baris, dengan hitSlop. */
const sizeVariants = {
  default: "h-[52px] px-6",
  sm: "h-10 px-4",
} as const

type ButtonVariant = keyof typeof containerVariants

type ButtonProps = Omit<PressableProps, "children"> & {
  children: string
  variant?: ButtonVariant
  size?: keyof typeof sizeVariants
  /** Ikon lucide di kiri label; warnanya mengikuti varian. */
  icon?: (props: { size: number; color: string }) => ReactNode
  /** Tampilkan spinner dan nonaktifkan tombol, misalnya saat request berjalan. */
  isLoading?: boolean
  className?: string
}

export function Button({
  children,
  variant = "default",
  size = "default",
  icon,
  isLoading = false,
  disabled,
  className,
  hitSlop,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading
  const contentColor = contentColors[variant]

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      hitSlop={hitSlop ?? (size === "sm" ? 4 : undefined)}
      className={cn(
        "flex-row items-center justify-center gap-2 rounded-xl",
        containerVariants[variant],
        sizeVariants[size],
        variant === "text" && "px-3",
        isDisabled && "opacity-50",
        className,
      )}
      {...props}
    >
      {isLoading ? <ActivityIndicator size="small" color={contentColor} /> : icon?.({ size: 18, color: contentColor })}
      <Text variant={size === "sm" ? "label-lg" : "title-sm"} numberOfLines={1} className={textVariants[variant]}>
        {children}
      </Text>
    </Pressable>
  )
}
