import { NativeTabs } from "expo-router/native-tabs"

import { colors } from "@/lib/theme"

/**
 * Tab bar native berisi ikon saja: Material navigation bar di Android, UITabBar di iOS.
 * Ikon memakai Material Symbols (`md`) di Android dan SF Symbols (`sf`) di iOS.
 * Tanpa label teks, `accessibilityLabel` wajib agar pembaca layar tetap menyebut nama tab.
 */
export default function TabsLayout() {
  return (
    <NativeTabs
      backgroundColor={colors.card}
      indicatorColor={colors.secondary}
      rippleColor={colors.muted}
      iconColor={{ default: colors.mutedForeground, selected: colors.secondaryForeground }}
      tintColor={colors.primary}
      labelVisibilityMode="unlabeled"
    >
      <NativeTabs.Trigger name="index" accessibilityLabel="Beranda">
        <NativeTabs.Trigger.Icon md="home" sf={{ default: "house", selected: "house.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="new-report" accessibilityLabel="Buat laporan">
        <NativeTabs.Trigger.Icon md="add_box" sf={{ default: "camera", selected: "camera.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="check-waste" accessibilityLabel="Cek sampah">
        <NativeTabs.Trigger.Icon md="image_search" sf={{ default: "magnifyingglass.circle", selected: "magnifyingglass.circle.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="my-reports" accessibilityLabel="Laporan saya">
        <NativeTabs.Trigger.Icon md="description" sf={{ default: "list.bullet.rectangle", selected: "list.bullet.rectangle.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile" accessibilityLabel="Profil">
        <NativeTabs.Trigger.Icon md="account_circle" sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
