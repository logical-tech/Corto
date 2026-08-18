"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import { Switch } from "@workspace/ui/components/switch"
import { Input } from "@workspace/ui/components/input"
import { Progress } from "@workspace/ui/components/progress"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { toast } from "@workspace/ui/components/toast"
import {
  ArrowLeftIcon,
  BarChart3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  FlagIcon,
  ExternalLinkIcon,
  MousePointerClickIcon,
  PlusIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { ClickChart } from "@/components/click-chart"
import { LinkForm, type LinkInput } from "@/components/link-form"
import { MetricStrip } from "@/components/metric-strip"
import {
  api,
  type LinkAnalytics,
  type LinkGoal,
  type ShortLink,
  type AdvertisingSettings,
} from "@/lib/api"
import { formatDate, formatNumber } from "@/lib/format"
import { cn } from "@workspace/ui/lib/utils"

type LinkDetail = {
  link: ShortLink
  analytics: LinkAnalytics
  goals: LinkGoal[]
}

export default function LinkDetailPage() {
  const { i18n, t } = useTranslation("links")
  const locale = i18n.resolvedLanguage ?? i18n.language
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const client = useQueryClient()
  const [recentClicksPage, setRecentClicksPage] = useState(1)
  const [country, setCountry] = useState("")
  const [device, setDevice] = useState("")
  const [goalInput, setGoalInput] = useState("")
  const recentClicksQuery = new URLSearchParams({
    page: String(recentClicksPage),
    pageSize: "10",
  })
  if (country) recentClicksQuery.set("country", country)
  if (device) recentClicksQuery.set("device", device)
  const recentClicksSearch = recentClicksQuery.toString()
  const detail = useQuery({
    queryKey: ["links", id, recentClicksSearch],
    queryFn: ({ signal }) =>
      api<LinkDetail>(`/v1/links/${id}?${recentClicksSearch}`, { signal }),
  })
  const updateLink = useMutation({
    mutationFn: (
      values: LinkInput | { active: boolean } | { adFree: boolean }
    ) =>
      api<{ link: ShortLink }>(`/v1/links/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["links"] }),
        client.invalidateQueries({ queryKey: ["links", id] }),
        client.invalidateQueries({ queryKey: ["analytics"] }),
      ])
      toast.add({ title: t("linkUpdated"), type: "success" })
    },
  })
  const deleteLink = useMutation({
    mutationFn: () => api<void>(`/v1/links/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["links"] })
      toast.add({ title: t("linkDeleted"), type: "success" })
      router.replace("/links")
    },
  })
  const updateGoals = useMutation({
    mutationFn: (goals: number[]) =>
      api<{ goals: LinkGoal[] }>(`/v1/links/${id}/goals`, {
        method: "PUT",
        body: JSON.stringify({ goals }),
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["links", id] })
      toast.add({ title: t("goalsUpdated"), type: "success" })
    },
  })
  const advertising = useQuery({
    queryKey: ["advertising"],
    queryFn: ({ signal }) =>
      api<AdvertisingSettings>("/v1/advertising", { signal }),
    retry: false,
  })

  if (detail.isPending) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-80" />
        <Skeleton className="h-32" />
        <Skeleton className="h-80" />
        <Skeleton className="h-72" />
      </div>
    )
  }

  if (detail.isError) {
    return (
      <Alert variant="destructive">
        <TriangleAlertIcon />
        <AlertTitle>{t("linkUnavailable")}</AlertTitle>
        <AlertDescription>{t("linkUnavailableDescription")}</AlertDescription>
        <Button
          variant="outline"
          className="mt-3 w-fit"
          onClick={() => detail.refetch()}
        >
          {t("retry")}
        </Button>
      </Alert>
    )
  }

  const { link, analytics, goals } = detail.data
  const goalTarget = goals.at(-1)?.clicks ?? 0
  const goalProgress = goalTarget
    ? Math.min(100, (link.clicks / goalTarget) * 100)
    : 0
  const advertisingAvailable = Boolean(
    advertising.data?.enabled && advertising.data.banners.length
  )
  const goalInputValue = Number(goalInput)
  const duplicateGoal =
    Boolean(goalInput) && goals.some((goal) => goal.clicks === goalInputValue)
  const breakdowns = [
    {
      title: t("sources"),
      rows: analytics.referrers.map((row) => ({
        label: row.referrer || t("direct"),
        clicks: row.clicks,
      })),
    },
    {
      title: t("countries"),
      rows: analytics.countries.map((row) => ({
        label: row.country || t("unknown"),
        clicks: row.clicks,
      })),
    },
    {
      title: t("devices"),
      rows: analytics.devices.map((row) => ({
        label: row.device || t("unknown"),
        clicks: row.clicks,
      })),
    },
  ]

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <header className="flex flex-col gap-5">
        <Link
          href="/links"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "-ml-2 w-fit",
          })}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          {t("allLinks")}
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={link.active ? "default" : "secondary"}>
                {link.active ? t("active") : t("paused")}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {t("created")} {formatDate(link.createdAt, locale)}
              </span>
            </div>
            <h1 className="truncate font-mono text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
              {link.shortUrl}
            </h1>
            <p className="mt-2 max-w-3xl truncate text-muted-foreground">
              {link.title || link.url}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                navigator.clipboard
                  .writeText(link.shortUrl)
                  .then(() =>
                    toast.add({ title: t("linkCopied"), type: "success" })
                  )
              }
            >
              <CopyIcon data-icon="inline-start" />
              {t("copy")}
            </Button>
            <a
              href={link.shortUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              <ExternalLinkIcon data-icon="inline-start" />
              {t("open")}
            </a>
          </div>
        </div>
      </header>

      <MetricStrip
        label={t("linkMetrics")}
        items={[
          {
            label: t("totalClicks"),
            value: formatNumber(analytics.totals.clicks, locale),
            icon: MousePointerClickIcon,
          },
          {
            label: t("uniqueVisitors"),
            value: formatNumber(analytics.totals.uniqueVisitors, locale),
            icon: UsersIcon,
          },
          {
            label: t("last30Days"),
            value: formatNumber(analytics.totals.clicksLast30Days, locale),
            icon: BarChart3Icon,
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("clicksOverTime")}</CardTitle>
          <CardDescription>{t("last30DaysTrend")}</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.totals.clicks > 0 ? (
            <ClickChart series={analytics.series} />
          ) : (
            <Empty className="min-h-64 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BarChart3Icon />
                </EmptyMedia>
                <EmptyTitle>{t("noRecordedClicks")}</EmptyTitle>
                <EmptyDescription>
                  {t("shareLinkForAnalytics")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      <section
        aria-label={t("audienceDetails")}
        className="grid gap-4 lg:grid-cols-3"
      >
        {breakdowns.map((breakdown) => (
          <Card key={breakdown.title}>
            <CardHeader>
              <CardTitle>{breakdown.title}</CardTitle>
              <CardDescription>{t("topFiveResults")}</CardDescription>
            </CardHeader>
            <CardContent>
              {breakdown.rows.length ? (
                <div className="flex flex-col gap-4">
                  {breakdown.rows.slice(0, 5).map((row) => (
                    <div
                      className="flex items-center justify-between gap-4"
                      key={row.label}
                    >
                      <span className="truncate text-muted-foreground">
                        {row.label}
                      </span>
                      <Badge variant="secondary">
                        {formatNumber(row.clicks)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("noDataYet")}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="surface-shadow gap-0 overflow-hidden py-0">
        <CardHeader className="px-5 pt-5 sm:px-6">
          <CardTitle>{t("recentClicks")}</CardTitle>
          <CardDescription>{t("recentClicksDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 px-0 pt-5">
          <div className="flex flex-wrap items-center gap-2 px-5 sm:px-6">
            <Select
              value={country || "all"}
              onValueChange={(value) => {
                setCountry(value === "all" || !value ? "" : value)
                setRecentClicksPage(1)
              }}
            >
              <SelectTrigger
                aria-label={t("country")}
                className="h-10 w-full sm:w-48"
              >
                <SelectValue placeholder={t("allCountries")} />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  <SelectItem value="all">{t("allCountries")}</SelectItem>
                  {analytics.countries.map((item) => (
                    <SelectItem key={item.country} value={item.country}>
                      {item.country}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={device || "all"}
              onValueChange={(value) => {
                setDevice(value === "all" || !value ? "" : value)
                setRecentClicksPage(1)
              }}
            >
              <SelectTrigger
                aria-label={t("device")}
                className="h-10 w-full sm:w-48"
              >
                <SelectValue placeholder={t("allDevices")} />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  <SelectItem value="all">{t("allDevices")}</SelectItem>
                  {analytics.devices.map((item) => (
                    <SelectItem key={item.device} value={item.device}>
                      {item.device}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {analytics.recentClicks.length ? (
            <>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader className="bg-muted/45">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-11 pl-5">{t("date")}</TableHead>
                      <TableHead>{t("country")}</TableHead>
                      <TableHead>{t("source")}</TableHead>
                      <TableHead className="pr-5">{t("device")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.recentClicks.map((click) => (
                      <TableRow key={click.id}>
                        <TableCell className="pl-5">
                          {formatDate(click.clickedAt, locale)}
                        </TableCell>
                        <TableCell>{click.country || "—"}</TableCell>
                        <TableCell className="max-w-[30ch] truncate">
                          {click.referrer || t("direct")}
                        </TableCell>
                        <TableCell className="pr-5">
                          {click.device || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col gap-2 px-5 sm:px-6 md:hidden">
                {analytics.recentClicks.map((click) => (
                  <article
                    className="rounded-xl bg-muted/65 p-4"
                    key={click.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-medium">
                        {formatDate(click.clickedAt, locale)}
                      </span>
                      <Badge variant="secondary">{click.device || "—"}</Badge>
                    </div>
                    <p className="mt-3 truncate text-sm text-muted-foreground">
                      {click.referrer || t("direct")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {click.country || "—"}
                    </p>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p className="px-5 text-sm text-muted-foreground sm:px-6">
              {t("noRecentEvents")}
            </p>
          )}

          {analytics.recentClicksPagination.total ? (
            <footer className="mx-5 mb-5 flex items-center justify-between gap-3 border-t pt-4 sm:mx-6">
              <Button
                variant="outline"
                disabled={recentClicksPage === 1}
                onClick={() => setRecentClicksPage((page) => page - 1)}
              >
                <ChevronLeftIcon data-icon="inline-start" />
                {t("previousPage")}
              </Button>
              <span className="text-center text-xs text-muted-foreground tabular-nums">
                {t("pageOf", {
                  page: recentClicksPage,
                  total: Math.max(
                    1,
                    analytics.recentClicksPagination.pageCount
                  ),
                })}
              </span>
              <Button
                variant="outline"
                disabled={
                  recentClicksPage >= analytics.recentClicksPagination.pageCount
                }
                onClick={() => setRecentClicksPage((page) => page + 1)}
              >
                {t("nextPage")}
                <ChevronRightIcon data-icon="inline-end" />
              </Button>
            </footer>
          ) : null}
        </CardContent>
      </Card>

      <Card className="surface-shadow">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle>{t("goals")}</CardTitle>
            <CardDescription>{t("goalsDescription")}</CardDescription>
          </div>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
            <FlagIcon className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          {goals.length ? (
            <div className="grid gap-4">
              <div className="px-1 pb-2">
                <Progress
                  value={goalProgress}
                  className="relative block w-full gap-0 pt-10"
                >
                  <ul
                    aria-label={t("goals")}
                    className="pointer-events-none absolute inset-x-0 top-0 h-10"
                  >
                    {goals.map((goal) => {
                      const position = (goal.clicks / goalTarget) * 100

                      return (
                        <li
                          className="absolute top-0 -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
                          key={goal.id}
                          style={{ left: `${position}%` }}
                        >
                          <span
                            className={cn(
                              "flex size-7 items-center justify-center rounded-full border bg-card shadow-sm transition-[transform,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]",
                              goal.reachedAt
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-muted-foreground"
                            )}
                          >
                            <FlagIcon aria-hidden="true" className="size-3.5" />
                          </span>
                          <span className="sr-only">
                            {t("goalClicks", { count: goal.clicks })} —{" "}
                            {goal.reachedAt
                              ? t("goalReached")
                              : t("goalUpcoming")}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </Progress>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground tabular-nums">
                <span>0</span>
                <span>
                  {formatNumber(link.clicks, locale)} /{" "}
                  {formatNumber(goalTarget, locale)} ·{" "}
                  {Math.round(goalProgress)}%
                </span>
                <span>100%</span>
              </div>

              <ol className="overflow-hidden rounded-2xl bg-muted/50 ring-1 ring-border/70">
                {goals.map((goal, index) => {
                  const isTarget = index === goals.length - 1
                  const position = Math.round((goal.clicks / goalTarget) * 100)

                  return (
                    <li
                      className={cn(
                        "flex min-h-16 items-center gap-3 px-4 py-3 not-last:border-b",
                        isTarget && "bg-primary/5"
                      )}
                      key={goal.id}
                    >
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm",
                          isTarget && "bg-primary text-primary-foreground"
                        )}
                      >
                        <FlagIcon aria-hidden="true" className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-medium tabular-nums">
                          {t("goalClicks", { count: goal.clicks })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isTarget ? t("goalTargetAuto") : `${position}%`}
                        </p>
                      </div>
                      <Button
                        aria-label={t("removeGoal")}
                        className="ml-auto size-11 text-muted-foreground hover:text-destructive"
                        disabled={updateGoals.isPending}
                        onClick={() =>
                          updateGoals.mutate(
                            goals
                              .filter((item) => item.id !== goal.id)
                              .map((item) => item.clicks)
                          )
                        }
                        size="icon"
                        title={t("removeGoal")}
                        type="button"
                        variant="ghost"
                      >
                        <XIcon />
                      </Button>
                    </li>
                  )
                })}
              </ol>
            </div>
          ) : (
            <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
              {t("noGoals")}
            </p>
          )}

          <form
            className="border-t pt-6"
            onSubmit={(event) => {
              event.preventDefault()
              if (!Number.isInteger(goalInputValue) || duplicateGoal) return

              updateGoals.mutate(
                [...goals.map((goal) => goal.clicks), goalInputValue].sort(
                  (left, right) => left - right
                ),
                { onSuccess: () => setGoalInput("") }
              )
            }}
          >
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="link-goal-input">
                  {t("goalNew")}
                </FieldLabel>
                <FieldDescription>
                  {t("goalTargetDescription")}
                </FieldDescription>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    aria-invalid={duplicateGoal}
                    className="h-11 font-mono tabular-nums"
                    id="link-goal-input"
                    inputMode="numeric"
                    max="1000000000"
                    min="1"
                    onChange={(event) => setGoalInput(event.target.value)}
                    placeholder={t("goalNewPlaceholder")}
                    required
                    step="1"
                    type="number"
                    value={goalInput}
                  />
                  <Button
                    className="h-11 w-full sm:w-auto"
                    disabled={updateGoals.isPending || duplicateGoal}
                    type="submit"
                  >
                    {updateGoals.isPending ? (
                      <Spinner data-icon="inline-start" />
                    ) : (
                      <PlusIcon data-icon="inline-start" />
                    )}
                    {t("addGoal")}
                  </Button>
                </div>
                {duplicateGoal ? (
                  <FieldError>{t("goalAlreadyExists")}</FieldError>
                ) : null}
              </Field>
            </FieldGroup>
          </form>

          {updateGoals.isError ? (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>{t("goalsNotSaved")}</AlertTitle>
              <AlertDescription>{updateGoals.error.message}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <Card className="surface-shadow">
          <CardHeader>
            <CardTitle>{t("linkSettings")}</CardTitle>
            <CardDescription>{t("linkSettingsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-7">
            <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{t("redirectActive")}</p>
                  <Badge variant={link.active ? "default" : "secondary"}>
                    {link.active ? t("active") : t("paused")}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("redirectActiveDescription")}
                </p>
              </div>
              <Switch
                checked={link.active}
                disabled={updateLink.isPending}
                aria-label={t("enableRedirect")}
                onCheckedChange={(active) => updateLink.mutate({ active })}
              />
            </div>
            <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{t("advertisingMode")}</p>
                  <Badge
                    variant={
                      advertisingAvailable && !link.adFree
                        ? "default"
                        : "secondary"
                    }
                  >
                    {advertisingAvailable && !link.adFree
                      ? t("advertisingEnabled")
                      : t("advertisingDisabled")}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {advertisingAvailable
                    ? t("advertisingLinkDescription")
                    : t("advertisingUnavailableDescription")}
                </p>
              </div>
              <Switch
                aria-label={t("excludeFromAdvertising")}
                checked={!link.adFree}
                disabled={!advertisingAvailable || updateLink.isPending}
                onCheckedChange={(enabled) =>
                  updateLink.mutate({ adFree: !enabled })
                }
              />
            </div>
            <LinkForm
              link={link}
              pending={updateLink.isPending}
              onSubmit={(values) =>
                updateLink.mutateAsync(values).then(() => undefined)
              }
            />
            {updateLink.isError ? (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertTitle>{t("changesNotSaved")}</AlertTitle>
                <AlertDescription>{updateLink.error.message}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>

        <Card className="h-fit border-destructive/20 bg-destructive/[0.03]">
          <CardHeader>
            <CardTitle>{t("deleteLink")}</CardTitle>
            <CardDescription>{t("deleteLinkDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="destructive" />}>
                <Trash2Icon data-icon="inline-start" />
                {t("deleteLink")}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("deleteLinkQuestion")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("deleteLinkWarning")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={deleteLink.isPending}
                    onClick={() => deleteLink.mutate()}
                  >
                    {t("deletePermanently")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {deleteLink.isError ? (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertTitle>{t("linkNotDeleted")}</AlertTitle>
                <AlertDescription>{deleteLink.error.message}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
