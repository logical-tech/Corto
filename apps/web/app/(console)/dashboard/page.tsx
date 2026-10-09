"use client"

import { useQuery } from "@tanstack/react-query"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { buttonVariants, Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
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
  BarChart3Icon,
  CalendarIcon,
  Link2Icon,
  MousePointerClickIcon,
  PlusIcon,
  TrophyIcon,
  TriangleAlertIcon,
} from "lucide-react"
import Link from "next/link"
import { useTranslation } from "react-i18next"

import { ClickChart } from "@/components/click-chart"
import { MetricStrip } from "@/components/metric-strip"
import { api, type AnalyticsSummary } from "@/lib/api"
import { authClient } from "@/lib/auth-client"
import { formatChartDate, formatNumber } from "@/lib/format"

export default function DashboardPage() {
  const { i18n, t } = useTranslation("dashboard")
  const locale = i18n.resolvedLanguage ?? i18n.language
  const { data: session } = authClient.useSession()
  const summary = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: ({ signal }) =>
      api<AnalyticsSummary>("/v1/analytics/summary", { signal }),
  })

  if (summary.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <Skeleton className="h-16 w-80 max-w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <Skeleton className="h-[420px] rounded-2xl" />
          <Skeleton className="h-[420px] rounded-2xl" />
        </div>
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

  const { totals, series, topLinks } = summary.data
  const peak = series.reduce<(typeof series)[number] | undefined>(
    (best, point) =>
      point.clicks > (best?.clicks ?? 0) ? point : best,
    undefined
  )
  const leader = topLinks[0]?.clicks ? topLinks[0] : undefined
  const name = session?.user.name

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="truncate text-[32px] leading-tight font-bold tracking-[-0.02em]">
            {name ? t("welcomeBack", { name }) : t("welcomeBackAnonymous")}
          </h1>
          <p className="text-base text-muted-foreground">
            {t("welcomeSubtitle")}
          </p>
        </div>
        <Link
          href="/links/new"
          className={buttonVariants({
            size: "lg",
            className: "shrink-0 px-6 text-base",
          })}
        >
          <PlusIcon data-icon="inline-start" />
          {t("createLink")}
        </Link>
      </header>

      <MetricStrip
        label={t("mainMetrics")}
        items={[
          {
            label: t("totalClicks"),
            icon: MousePointerClickIcon,
            value: formatNumber(totals.clicks, locale),
          },
          {
            label: t("last30Days"),
            icon: CalendarIcon,
            value: formatNumber(totals.clicksLast30Days, locale),
            detail: t("dailyAverage", {
              formatted: formatNumber(
                Math.round(totals.clicksLast30Days / 3) / 10,
                locale
              ),
            }),
          },
          {
            label: t("links"),
            icon: Link2Icon,
            value: formatNumber(totals.links, locale),
            detail: t("linksStatus", {
              active: formatNumber(totals.activeLinks, locale),
              inactive: formatNumber(totals.links - totals.activeLinks, locale),
            }),
          },
          {
            label: t("topLink"),
            icon: TrophyIcon,
            value: leader ? `/${leader.slug}` : "—",
            detail: leader
              ? t("shareOfClicks", {
                  percent: Math.round((leader.clicks / totals.clicks) * 100),
                })
              : t("noClicksYet"),
          },
        ]}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{t("clicksOverTime")}</CardTitle>
            <CardDescription>{t("dailyClicks")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {peak ? (
              <>
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="metric text-[40px] leading-none font-bold tracking-[-0.025em]">
                    {formatNumber(totals.clicksLast30Days, locale)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {t("peakOn", {
                      formatted: formatNumber(peak.clicks, locale),
                      date: formatChartDate(peak.date, locale),
                    })}
                  </span>
                </p>
                <ClickChart series={series} />
              </>
            ) : (
              <Empty className="min-h-64 rounded-xl border">
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

        <Card>
          <CardHeader>
            <CardTitle>{t("topLinks")}</CardTitle>
            {topLinks.length ? (
              <CardAction>
                <Link
                  href="/links"
                  className="rounded-sm text-sm font-semibold hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {t("showAll")}
                </Link>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardContent>
            {topLinks.length ? (
              <ul className="flex flex-col gap-2">
                {topLinks.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={`/links/${link.id}`}
                      className="-mx-2 flex items-center gap-4 rounded-xl p-2 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                        <Link2Icon aria-hidden="true" className="size-5" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-[15px] font-semibold">
                          /{link.slug}
                        </span>
                        <span className="truncate text-[13px] text-muted-foreground">
                          {link.title || link.url}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-0.5">
                        <span className="metric text-[15px] font-semibold">
                          {formatNumber(link.clicks, locale)}
                        </span>
                        <span className="text-xs text-subtle-foreground">
                          {t("clicksUnit")}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty className="min-h-56 rounded-xl border">
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
    </div>
  )
}
