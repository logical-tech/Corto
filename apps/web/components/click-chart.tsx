"use client"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
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

  return (
    <ChartContainer
      config={config}
      className="aspect-auto h-[260px] w-full"
      initialDimension={{ width: 720, height: 260 }}
    >
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{ left: 4, right: 4, top: 12 }}
      >
        <defs>
          <linearGradient id="clicks-fill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-clicks)"
              stopOpacity={0.28}
            />
            <stop
              offset="95%"
              stopColor="var(--color-clicks)"
              stopOpacity={0.02}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          minTickGap={28}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Area
          dataKey="clicks"
          type="monotone"
          fill="url(#clicks-fill)"
          stroke="var(--color-clicks)"
          strokeWidth={2.5}
        />
      </AreaChart>
    </ChartContainer>
  )
}
