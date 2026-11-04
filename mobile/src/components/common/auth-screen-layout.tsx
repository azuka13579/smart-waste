import { LeafIcon } from "lucide-react-native"
import type { ReactNode } from "react"
import { KeyboardAvoidingView, ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { BrandLogo } from "@/components/common/brand-logo"
import { Text } from "@/components/ui/text"
import { colors } from "@/lib/theme"

type AuthScreenLayoutProps = {
  title: string
  description: string
  children: ReactNode
  /** Ajakan pindah ke layar lain ("Belum punya akun? Daftar"), di dasar lembar putih. */
  footer: ReactNode
}

/**
 * Layar masuk/daftar: panel hijau berisi identitas aplikasi, lalu lembar putih berisi form
 * yang naik menimpa panel. Seluruhnya bisa di-scroll saat keyboard terbuka.
 */
export function AuthScreenLayout({ title, description, children, footer }: AuthScreenLayoutProps) {
  const insets = useSafeAreaInsets()

  return (
    <KeyboardAvoidingView className="flex-1 bg-primary" behavior="padding">
      <ScrollView contentContainerClassName="grow" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: insets.top + 40 }} className="gap-6 overflow-hidden px-6 pb-16">
          {/* Siluet daun besar yang samar: identitas brand tanpa menambah elemen yang harus dibaca */}
          <View pointerEvents="none" className="absolute -right-24 -top-12 opacity-[0.12]" style={{ transform: [{ rotate: "-18deg" }] }}>
            <LeafIcon size={260} color={colors.primaryForeground} strokeWidth={1.25} />
          </View>
          <BrandLogo />
          <Text variant="body-lg" className="max-w-[300px] text-primary-muted">
            Laporkan tumpukan sampah di sekitarmu dan pantau penanganannya.
          </Text>
        </View>

        <View style={{ paddingBottom: insets.bottom + 16 }} className="-mt-7 grow rounded-t-sheet bg-card px-6 pt-8">
          <View className="mb-7 gap-1.5">
            <Text variant="headline" accessibilityRole="header">
              {title}
            </Text>
            <Text variant="body-md" className="text-muted-foreground">
              {description}
            </Text>
          </View>

          {children}

          <View className="grow" />
          <View className="mt-8 flex-row items-center justify-center">{footer}</View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
