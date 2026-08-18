"use client"

import { useQuery } from "@tanstack/react-query"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { buttonVariants, Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  ArrowRightIcon,
  BarChart3Icon,
  Link2Icon,
  MousePointerClickIcon,
  TriangleAlertIcon,
} from "lucide-react"
import Link from "next/link"
import { useTranslation } from "react-i18next"

import { ClickChart } from "@/components/click-chart"
import { MetricStrip } from "@/components/metric-strip"
import { api, type AnalyticsSummary } from "@/lib/api"
import { formatNumber } from "@/lib/format"

export default function DashboardPage() {
  const { i18n, t } = useTranslation("dashboard")
  const locale = i18n.resolvedLanguage ?? i18n.language
  const metrics = [
    { key: "clicks", label: t("totalClicks"), icon: MousePointerClickIcon },
    { key: "clicksLast30Days", label: t("last30Days"), icon: BarChart3Icon },
    { key: "links", label: t("linksCreated"), icon: Link2Icon },
  ] as const
  const summary = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: ({ signal }) =>
      api<AnalyticsSummary>("/v1/analytics/summary", { signal }),
  })

  if (summary.isPending) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-72" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (summary.isError) {
    return (
      <Alert variant="destructive">
        <TriangleAlertIcon />
        <AlertTitle>{t("dashboardErrorTitle")}</AlertTitle>
        <AlertDescription>{t("dashboardErrorDescription")}</AlertDescription>
        <Button
          variant="outline"
          className="mt-3 w-fit"
          onClick={() => summary.refetch()}
        >
          {t("retry")}
        </Button>
      </Alert>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">
          {t("dashboard")}
        </h1>
        <Link href="/links/new" className={buttonVariants({ size: "lg" })}>
          {t("createLink")}
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
      </header>

      <MetricStrip
        label={t("mainMetrics")}
        items={metrics.map(({ key, label, icon }) => ({
          label,
          icon,
          value: formatNumber(summary.data.totals[key], locale),
          detail:
            key === "links"
              ? `${formatNumber(summary.data.totals.activeLinks, locale)} ${t("activeLinks")}`
              : undefined,
        }))}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("clicksOverTime")}</CardTitle>
          <CardDescription>{t("last30DaysTrend")}</CardDescription>
        </CardHeader>
        <CardContent>
          {summary.data.totals.clicks > 0 ? (
            <ClickChart series={summary.data.series} />
          ) : (
            <Empty className="min-h-64 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BarChart3Icon />
                </EmptyMedia>
                <EmptyTitle>{t("waitingForClicks")}</EmptyTitle>
                <EmptyDescription>{t("shareToSeeTrend")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b px-5 pt-5 sm:px-6">
          <CardTitle>{t("topLinks")}</CardTitle>
          <CardDescription>{t("topLinksDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {summary.data.topLinks.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/45">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-11 pl-5">{t("links")}</TableHead>
                    <TableHead>{t("destination")}</TableHead>
                    <TableHead className="pr-5 text-right">
                      {t("clicks")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.data.topLinks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="pl-5">
                        <Link
                          className="font-mono font-medium hover:text-primary hover:underline"
                          href={`/links/${link.id}`}
                        >
                          {link.shortUrl}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[44ch] truncate text-muted-foreground">
                        {link.title || link.url}
                      </TableCell>
                      <TableCell className="metric pr-5 text-right font-medium">
                        <Badge variant="secondary">
                          {formatNumber(link.clicks, locale)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Empty className="min-h-56 border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Link2Icon />
                </EmptyMedia>
                <EmptyTitle>{t("noLinksToCompare")}</EmptyTitle>
                <EmptyDescription>{t("createFirstLink")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
