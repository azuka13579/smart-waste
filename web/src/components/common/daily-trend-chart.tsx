import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

const chartConfig = {
  count: { label: "Laporan", color: "var(--color-primary)" },
} satisfies ChartConfig

type DailyTrendChartProps = {
  data: { date: string; count: number }[]
  isLoading?: boolean
}

/** Satu seri (jumlah laporan per hari), jadi satu warna dan tanpa legenda. */
export function DailyTrendChart({ data, isLoading = false }: DailyTrendChartProps) {
  if (isLoading) return <Skeleton className="h-64 w-full" />

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: -20 }} barCategoryGap={data.length > 45 ? 1 : 4}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={(value: string) => format(new Date(value), "d MMM", { locale: id })}
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} />
        <ChartTooltip
          cursor={{ fill: "var(--color-muted)" }}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => format(new Date(String(value)), "EEEE, d MMMM yyyy", { locale: id })}
              indicator="dot"
            />
          }
        />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ChartContainer>
  )
}
