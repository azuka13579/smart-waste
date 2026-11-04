import { CheckIcon } from "lucide-react-native"
import { Pressable } from "react-native"

import { Text } from "@/components/ui/text"
import { colors } from "@/lib/theme"
import { cn } from "@/lib/utils"

type ChoiceChipProps = {
  label: string
  selected: boolean
  onPress: () => void
  /** `onPrimary` untuk chip di atas header hijau. */
  tone?: "default" | "onPrimary"
  className?: string
}

/** Chip pilihan tunggal. Terpilih: hijau solid dengan centang (atau putih di atas header hijau). */
export function ChoiceChip({ label, selected, onPress, tone = "default", className }: ChoiceChipProps) {
  const onPrimary = tone === "onPrimary"

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6 }}
      className={cn(
        "h-9 flex-row items-center gap-1.5 rounded-full",
        selected ? "pl-3 pr-4" : "px-4",
        selected && (onPrimary ? "bg-card" : "bg-primary"),
        !selected && (onPrimary ? "bg-white/15 active:bg-white/25" : "bg-muted active:bg-secondary"),
        className,
      )}
    >
      {selected && <CheckIcon size={16} color={onPrimary ? colors.primary : colors.primaryForeground} />}
      <Text
        variant="label-lg"
        className={cn(
          selected && (onPrimary ? "text-primary" : "text-primary-foreground"),
          !selected && (onPrimary ? "text-primary-foreground" : "text-foreground"),
        )}
      >
        {label}
      </Text>
    </Pressable>
  )
}
