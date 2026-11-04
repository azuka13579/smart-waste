import { type ComponentRef, forwardRef, useState } from "react"
import { TextInput, type TextInputProps } from "react-native"

import { colors, fonts } from "@/lib/theme"
import { cn } from "@/lib/utils"

/** Tipe ref untuk `useRef`, misalnya agar tombol "Next" di keyboard memindahkan fokus ke field berikutnya. */
export type InputRef = ComponentRef<typeof TextInput>

export type InputProps = TextInputProps & {
  isInvalid?: boolean
  className?: string
}

/**
 * Text field tinggi 56 dp di atas permukaan hijau-pucat; saat fokus berubah putih dengan garis hijau 2 dp.
 * Padding dikurangi 1 dp saat garis menebal agar teks tidak bergeser.
 */
export const Input = forwardRef<InputRef, InputProps>(function Input(
  { isInvalid = false, editable = true, className, style, onFocus, onBlur, ...props },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <TextInput
      ref={ref}
      editable={editable}
      placeholderTextColor={colors.mutedForeground}
      selectionColor={colors.primary}
      cursorColor={colors.primary}
      onFocus={(event) => {
        setIsFocused(true)
        onFocus?.(event)
      }}
      onBlur={(event) => {
        setIsFocused(false)
        onBlur?.(event)
      }}
      // Font lewat style: className font-* tidak diteruskan ke TextInput di semua platform
      style={[{ fontFamily: fonts.regular }, style]}
      className={cn(
        // Ukuran saja tanpa line-height: line-height di TextInput Android membuat teks tidak di tengah secara vertikal
        "h-14 rounded-lg border border-transparent bg-muted px-4 text-[16px] text-foreground",
        isFocused && "border-2 border-primary bg-card px-[15px]",
        isInvalid && "border-destructive bg-destructive-container/40",
        isInvalid && isFocused && "bg-card",
        !editable && "opacity-60",
        className,
      )}
      {...props}
    />
  )
})
