import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import { CalendarIcon, ChevronDownIcon, FileTextIcon, SearchXIcon, TagIcon } from "lucide-react-native"
import { type ReactNode, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, View } from "react-native"

import { QueryErrorState } from "@/components/common/query-error-state"
import { ReportListItem } from "@/components/common/report-list-item"
import { ScreenHeader, Sheet } from "@/components/common/screen-header"
import { Button } from "@/components/ui/button"
import { ChoiceChip } from "@/components/ui/choice-chip"
import { Text } from "@/components/ui/text"
import { ROUTES } from "@/lib/constants"
import { type DateRange, describeDateRange } from "@/lib/date-range"
import { type ReportStatus, reportStatusOptions, type WasteCategory, wasteCategoryLabels } from "@/lib/enums/report"
import { formatNumber } from "@/lib/format"
import { getMyReports } from "@/lib/services/my-report"
import { colors } from "@/lib/theme"
import { cn } from "@/lib/utils"

import { CategorySheet, DateRangeSheet } from "./filters"

const PAGE_SIZE = 20

type Filters = DateRange & { status?: ReportStatus; category?: WasteCategory }

export default function MyReportsScreen() {
  const router = useRouter()
  const [filters, setFilters] = useState<Filters>({})
  const [openSheet, setOpenSheet] = useState<"category" | "date" | null>(null)

  const reportsQuery = useInfiniteQuery({
    // Key diawali "my-reports" agar ikut diperbarui setelah laporan dibuat atau dihapus
    queryKey: ["my-reports", "list", filters],
    queryFn: ({ pageParam }) => getMyReports({ ...filters, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.meta?.pagination
      return pagination && pagination.page < pagination.totalPages ? pagination.page + 1 : undefined
    },
    // Tetap tampilkan daftar lama saat filter berganti, agar layar tidak berkedip kosong
    placeholderData: keepPreviousData,
  })

  const reports = reportsQuery.data?.pages.flatMap((page) => page.data) ?? []
  const total = reportsQuery.data?.pages[0]?.meta?.pagination?.total
  const hasFilters = !!(filters.status || filters.category || filters.from || filters.to)
  const dateLabel = describeDateRange(filters)

  const updateFilters = (next: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...next }))

  return (
    <View className="flex-1 bg-primary">
      <ScreenHeader
        title="Laporan saya"
        subtitle={
          total !== undefined
            ? `${formatNumber(total)} laporan${hasFilters ? " sesuai filter" : ""}`
            : reportsQuery.isPending
              ? "Memuat laporan..."
              : undefined
        }
      >
        <View className="-mx-5 gap-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-5" accessibilityRole="radiogroup">
            <ChoiceChip tone="onPrimary" label="Semua" selected={!filters.status} onPress={() => updateFilters({ status: undefined })} />
            {reportStatusOptions.map((option) => (
              <ChoiceChip
                key={option.value}
                tone="onPrimary"
                label={option.label}
                selected={filters.status === option.value}
                onPress={() => updateFilters({ status: option.value })}
              />
            ))}
          </ScrollView>
          <View className="flex-row gap-2 px-5">
            <FilterButton
              icon={<TagIcon size={16} color={filters.category ? colors.primary : colors.primaryForeground} />}
              label={filters.category ? wasteCategoryLabels[filters.category] : "Semua jenis"}
              active={!!filters.category}
              onPress={() => setOpenSheet("category")}
            />
            <FilterButton
              icon={<CalendarIcon size={16} color={dateLabel ? colors.primary : colors.primaryForeground} />}
              label={dateLabel ?? "Semua waktu"}
              active={!!dateLabel}
              onPress={() => setOpenSheet("date")}
            />
          </View>
        </View>
      </ScreenHeader>

      <Sheet>
        {reportsQuery.isPending ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : reportsQuery.error && reports.length === 0 ? (
          <QueryErrorState className="flex-1" error={reportsQuery.error} onRetry={() => void reportsQuery.refetch()} isRetrying={reportsQuery.isRefetching} />
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(report) => report.id}
            renderItem={({ item }) => <ReportListItem report={item} onPress={() => router.push(ROUTES.REPORT(item.id))} />}
            ItemSeparatorComponent={() => <View className="ml-[96px] h-px bg-border" />}
            contentContainerClassName={cn("pb-6 pt-3", reports.length === 0 && "grow")}
            onEndReached={() => {
              if (reportsQuery.hasNextPage && !reportsQuery.isFetchingNextPage) void reportsQuery.fetchNextPage()
            }}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl
                refreshing={reportsQuery.isRefetching && !reportsQuery.isFetchingNextPage}
                onRefresh={() => void reportsQuery.refetch()}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListFooterComponent={
              reportsQuery.isFetchingNextPage ? (
                <View className="py-6">
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : undefined
            }
            ListEmptyComponent={
              hasFilters ? (
                <EmptyList
                  icon={<SearchXIcon size={26} color={colors.secondaryForeground} />}
                  title="Tidak ada laporan yang cocok"
                  description="Coba ubah atau hapus filter."
                  action={
                    <Button variant="outline" size="sm" onPress={() => setFilters({})}>
                      Hapus semua filter
                    </Button>
                  }
                />
              ) : (
                <EmptyList
                  icon={<FileTextIcon size={26} color={colors.secondaryForeground} />}
                  title="Belum ada laporan"
                  description="Foto tumpukan sampah di sekitarmu dan kirim laporan pertama."
                  action={
                    <Button size="sm" onPress={() => router.navigate(ROUTES.NEW_REPORT)}>
                      Buat laporan
                    </Button>
                  }
                />
              )
            }
          />
        )}
      </Sheet>

      <CategorySheet open={openSheet === "category"} onClose={() => setOpenSheet(null)} value={filters.category} onChange={(category) => updateFilters({ category })} />
      <DateRangeSheet
        open={openSheet === "date"}
        onClose={() => setOpenSheet(null)}
        value={{ from: filters.from, to: filters.to }}
        onChange={(range) => updateFilters({ from: range.from, to: range.to })}
      />
    </View>
  )
}

/** Tombol pembuka bottom sheet filter di header hijau; putih saat filternya aktif. */
function FilterButton({ icon, label, active, onPress }: { icon: ReactNode; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Filter: ${label}`}
      onPress={onPress}
      className={cn("h-10 flex-1 flex-row items-center gap-2 rounded-full px-4", active ? "bg-card" : "bg-white/15 active:bg-white/25")}
    >
      {icon}
      <Text variant="label-lg" numberOfLines={1} className={cn("flex-1", active ? "text-primary" : "text-primary-foreground")}>
        {label}
      </Text>
      <ChevronDownIcon size={16} color={active ? colors.primary : colors.primaryForeground} />
    </Pressable>
  )
}

function EmptyList({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action: ReactNode }) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8 py-10">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-secondary">{icon}</View>
      <View className="items-center gap-1">
        <Text variant="title-md">{title}</Text>
        <Text variant="body-md" className="text-center text-muted-foreground">
          {description}
        </Text>
      </View>
      {action}
    </View>
  )
}
