"use client"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import { Bar, BarChart, Cell, XAxis } from "recharts"
import { useTranslation } from "react-i18next"

import type { TimePoint } from "@/lib/api"
import { formatChartDate } from "@/lib/format"

export function ClickChart({ series }: { series: TimePoint[] }) {
  const { i18n, t } = useTranslation("common")
  const locale = i18n.resolvedLanguage ?? i18n.language
  const config = {
    clicks: { label: t("clicks"), color: "var(--chart-1)" },
  } satisfies ChartConfig
  const data = series.map((point) => ({
    ...point,
    label: formatChartDate(point.date, locale),
  }))
  const peak = Math.max(0, ...series.map((point) => point.clicks))

  return (
    <ChartContainer
      config={config}
      className="aspect-auto h-[240px] w-full"
      initialDimension={{ width: 720, height: 240 }}
    >
      <BarChart
        accessibilityLayer
        data={data}
        barCategoryGap="22%"
        margin={{ left: 0, right: 0, top: 8 }}
      >
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tickMargin={12}
          minTickGap={28}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Bar dataKey="clicks" radius={[4, 4, 0, 0]} minPointSize={2}>
          {data.map((point) => (
            <Cell
              key={point.date}
              fill={
                peak > 0 && point.clicks === peak
                  ? "var(--chart-1)"
                  : "var(--chart-2)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
