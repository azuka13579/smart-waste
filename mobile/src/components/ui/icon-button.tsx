import type { ReactNode } from "react"
import { Pressable, type PressableProps } from "react-native"

import { colors } from "@/lib/theme"
import { cn } from "@/lib/utils"

type IconButtonProps = Omit<PressableProps, "children"> & {
  /** Wajib: ikon tanpa teks harus punya nama untuk pembaca layar. */
  accessibilityLabel: string
  icon: (props: { size: number; color: string }) => ReactNode
  /** `onPrimary` untuk tombol di atas header hijau. */
  tone?: "default" | "onPrimary"
  color?: string
  className?: string
}

/** Tombol ikon Material 3: area sentuh 48×48 dp, efek tekan berbentuk lingkaran. */
export function IconButton({ icon, tone = "default", color, className, ...props }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        "h-12 w-12 items-center justify-center rounded-full",
        tone === "onPrimary" ? "active:bg-white/15" : "active:bg-secondary",
        props.disabled && "opacity-40",
        className,
      )}
      {...props}
    >
      {icon({ size: 22, color: color ?? (tone === "onPrimary" ? colors.primaryForeground : colors.foreground) })}
    </Pressable>
  )
}
