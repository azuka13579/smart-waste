import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { formatNumber } from "@/lib/format"

const chartConfig = {
  count: { label: "Laporan", color: "var(--color-primary)" },
} satisfies ChartConfig

type DailyTrendChartProps = {
  data: { date: string; count: number }[]
  isLoading?: boolean
}

const formatDay = (value: string) => format(new Date(value), "EEEE, d MMMM yyyy", { locale: id })

/** Ringkasan untuk pembaca layar: grafik hanya menampilkan angka harian lewat tooltip hover. */
function describe(data: DailyTrendChartProps["data"]) {
  if (data.length === 0) return "Grafik laporan per hari, belum ada data."
  const total = data.reduce((sum, day) => sum + day.count, 0)
  const busiest = data.reduce((max, day) => (day.count > max.count ? day : max), data[0])
  const peak = busiest.count > 0 ? `, terbanyak ${formatNumber(busiest.count)} pada ${formatDay(busiest.date)}` : ""
  return `Grafik laporan per hari selama ${data.length} hari: total ${formatNumber(total)} laporan${peak}.`
}

/** Satu seri (jumlah laporan per hari), jadi satu warna dan tanpa legenda. */
export function DailyTrendChart({ data, isLoading = false }: DailyTrendChartProps) {
  const prefersReducedMotion = usePrefersReducedMotion()

  if (isLoading) return <Skeleton className="h-64 w-full" />

  return (
    <figure>
      <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full" role="img" aria-label={describe(data)}>
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
            content={<ChartTooltipContent labelFormatter={(value) => formatDay(String(value))} indicator="dot" />}
          />
          <Bar
            dataKey="count"
            fill="var(--color-count)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={!prefersReducedMotion}
          />
        </BarChart>
      </ChartContainer>

      {/* Angka per hari untuk pembaca layar dan keyboard, yang tidak bisa memakai tooltip hover */}
      <table className="sr-only">
        <caption>Jumlah laporan per hari</caption>
        <thead>
          <tr>
            <th scope="col">Tanggal</th>
            <th scope="col">Laporan</th>
          </tr>
        </thead>
        <tbody>
          {data.map((day) => (
            <tr key={day.date}>
              <td>{formatDay(day.date)}</td>
              <td>{day.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
