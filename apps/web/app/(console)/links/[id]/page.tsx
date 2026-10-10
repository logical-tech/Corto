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
import { buttonVariants, Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { FieldError } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import { Switch } from "@workspace/ui/components/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { toast } from "@workspace/ui/components/toast"
import { cn } from "@workspace/ui/lib/utils"
import {
  BarChart3Icon,
  CalendarClockIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  CirclePauseIcon,
  CopyIcon,
  ExternalLinkIcon,
  FlagIcon,
  GaugeIcon,
  GlobeIcon,
  Link2Icon,
  LockIcon,
  MegaphoneIcon,
  MousePointerClickIcon,
  PlusIcon,
  RotateCcwIcon,
  Share2Icon,
  Trash2Icon,
  TriangleAlertIcon,
  UsersIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { ClickChart } from "@/components/click-chart"
import { LinkForm, type LinkInput } from "@/components/link-form"
import {
  api,
  type AdvertisingSettings,
  type LinkAnalytics,
  type LinkGoal,
  type ShortLink,
} from "@/lib/api"
import { formatDate, formatNumber } from "@/lib/format"

type LinkDetail = {
  link: ShortLink
  analytics: LinkAnalytics
  goals: LinkGoal[]
}

const withoutProtocol = (url: string) => url.replace(/^https?:\/\//, "")

const section = "flex flex-col gap-5 border-b border-border-soft py-8"
const sectionTitle = "text-[22px] font-semibold"

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
  const [editingGoals, setEditingGoals] = useState(false)
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
      // Only the list: refetching this deleted link would 404 and retry.
      await client.invalidateQueries({ queryKey: ["links"], exact: true })
      toast.add({ title: t("linkDeleted"), type: "success" })
      router.replace("/links")
    },
  })
  const resetStats = useMutation({
    mutationFn: () =>
      api<{ link: ShortLink }>(`/v1/links/${id}/reset-stats`, {
        method: "POST",
      }),
    onSuccess: async () => {
      setRecentClicksPage(1)
      await Promise.all([
        client.invalidateQueries({ queryKey: ["links"] }),
        client.invalidateQueries({ queryKey: ["analytics"] }),
      ])
      toast.add({ title: t("statsReset"), type: "success" })
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Skeleton className="h-16 w-80" />
        <Skeleton className="h-[340px] rounded-2xl" />
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
  const adsOn = advertisingAvailable && !link.adFree
  const goalInputValue = Number(goalInput)
  const duplicateGoal =
    Boolean(goalInput) && goals.some((goal) => goal.clicks === goalInputValue)
  const hostname = URL.canParse(link.url) ? new URL(link.url).hostname : ""
  const expired = Boolean(
    link.expiresAt && new Date(link.expiresAt) < new Date()
  )
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
  const topReferrer = analytics.referrers[0]?.referrer
  const tiles: Array<{ icon: LucideIcon; value: string; label: string }> = [
    {
      icon: MousePointerClickIcon,
      value: formatNumber(analytics.totals.clicks, locale),
      label: t("totalClicks"),
    },
    {
      icon: CalendarIcon,
      value: formatNumber(analytics.totals.clicksLast30Days, locale),
      label: t("last30Days"),
    },
    {
      icon: UsersIcon,
      value: formatNumber(analytics.totals.uniqueVisitors, locale),
      label: t("uniqueVisitors"),
    },
    {
      icon: Share2Icon,
      value: topReferrer
        ? URL.canParse(topReferrer)
          ? new URL(topReferrer).hostname
          : topReferrer
        : "—",
      label: t("topSource"),
    },
  ]
  const highlights: Array<{
    icon: LucideIcon
    title: string
    description: string
  }> = [
    link.active
      ? {
          icon: CircleCheckIcon,
          title: t("highlightLive"),
          description: t("highlightLiveDescription"),
        }
      : {
          icon: CirclePauseIcon,
          title: t("highlightPaused"),
          description: t("redirectActiveDescription"),
        },
    link.expiresAt
      ? {
          icon: CalendarClockIcon,
          title: t(expired ? "highlightExpired" : "highlightExpires", {
            date: formatDate(link.expiresAt, locale),
          }),
          description: t("highlightExpiresDescription"),
        }
      : {
          icon: CalendarClockIcon,
          title: t("highlightNoExpiry"),
          description: t("highlightNoExpiryDescription"),
        },
    ...(link.hasPassword
      ? [
          {
            icon: LockIcon,
            title: t("highlightPassword"),
            description: t("linkFormPasswordHelp"),
          },
        ]
      : []),
    ...(link.clickLimit !== null
      ? [
          {
            icon: GaugeIcon,
            title: t("highlightClickLimit", {
              limit: formatNumber(link.clickLimit, locale),
            }),
            description: t("clickLimitProgress", {
              clicks: formatNumber(link.clicks, locale),
              limit: formatNumber(link.clickLimit, locale),
            }),
          },
        ]
      : []),
    ...(advertisingAvailable
      ? [
          {
            icon: MegaphoneIcon,
            title: adsOn ? t("highlightAdsOn") : t("highlightAdsOff"),
            description: adsOn
              ? t("advertisingLinkDescription")
              : t("highlightAdsOffDescription"),
          },
        ]
      : []),
  ]

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="truncate text-[28px] leading-tight font-bold tracking-[-0.5px]">
            {link.title || withoutProtocol(link.shortUrl)}
          </h1>
          <p className="flex min-w-0 flex-wrap items-center gap-x-2 text-[15px]">
            <span className="font-semibold">
              {withoutProtocol(link.shortUrl)}
            </span>
            <span aria-hidden="true" className="text-muted-foreground">
              ·
            </span>
            <span className="min-w-0 truncate text-muted-foreground">
              {withoutProtocol(link.url)}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="font-semibold"
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
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "font-semibold",
            })}
          >
            <ExternalLinkIcon data-icon="inline-start" />
            {t("open")}
          </a>
        </div>
      </header>

      <section
        aria-label={t("linkMetrics")}
        className="grid gap-2 overflow-hidden rounded-2xl lg:h-[340px] lg:grid-cols-2"
      >
        <div className="relative flex min-h-44 flex-col justify-end bg-muted p-5">
          <Link2Icon
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 text-subtle-foreground"
            strokeWidth={1.25}
          />
          {hostname ? (
            <span className="relative flex w-fit max-w-full items-center gap-2 rounded-lg bg-background px-3 py-2 text-[13px] font-semibold">
              <GlobeIcon aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="truncate">{hostname}</span>
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {tiles.map(({ icon: Icon, value, label }, index) => (
            <div
              key={label}
              className={cn(
                "flex min-h-36 min-w-0 flex-col justify-between gap-6 p-5",
                index === 0 ? "bg-primary text-primary-foreground" : "bg-muted"
              )}
            >
              <Icon aria-hidden="true" className="size-[22px]" strokeWidth={1.5} />
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="metric truncate text-2xl font-bold tracking-[-0.6px] sm:text-[30px]">
                  {value}
                </p>
                <p
                  className={cn(
                    "truncate text-sm",
                    index === 0
                      ? "text-primary-foreground/85"
                      : "text-muted-foreground"
                  )}
                >
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-x-16 pt-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-4 border-b border-border-soft pt-2 pb-8">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
              <Link2Icon aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">
                {t("createdOn", { date: formatDate(link.createdAt, locale) })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("updatedOn", { date: formatDate(link.updatedAt, locale) })}
              </p>
            </div>
          </div>

          <ul className="flex flex-col gap-6 border-b border-border-soft py-8">
            {highlights.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-5">
                <Icon
                  aria-hidden="true"
                  className="size-[26px] shrink-0"
                  strokeWidth={1.5}
                />
                <div className="min-w-0">
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </li>
            ))}
          </ul>

          <section className={section} aria-labelledby="clicks-over-time">
            <h2 id="clicks-over-time" className={sectionTitle}>
              {t("clicksOverTime")}
            </h2>
            {analytics.totals.clicks > 0 ? (
              <ClickChart series={analytics.series} />
            ) : (
              <Empty className="min-h-56 rounded-2xl bg-muted">
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
          </section>

          <section className={section} aria-labelledby="audience-details">
            <h2 id="audience-details" className={sectionTitle}>
              {t("audienceDetails")}
            </h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {breakdowns.map((breakdown) => (
                <div key={breakdown.title} className="flex min-w-0 flex-col gap-3">
                  <h3 className="text-[13px] font-semibold text-muted-foreground">
                    {breakdown.title}
                  </h3>
                  {breakdown.rows.length ? (
                    <ul className="flex flex-col gap-2.5 text-[15px]">
                      {breakdown.rows.slice(0, 5).map((row) => (
                        <li
                          className="flex items-center justify-between gap-4"
                          key={row.label}
                        >
                          <span className="truncate">{row.label}</span>
                          <span className="metric font-semibold">
                            {formatNumber(row.clicks, locale)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("noDataYet")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className={section} aria-labelledby="click-milestones">
            <div className="flex items-center justify-between gap-4">
              <h2 id="click-milestones" className={sectionTitle}>
                {t("goalMilestones")}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="-mr-3 font-semibold"
                aria-expanded={editingGoals}
                aria-controls="milestone-editor"
                onClick={() => setEditingGoals((value) => !value)}
              >
                {editingGoals ? t("doneEditing") : t("editMilestones")}
              </Button>
            </div>
            <p className="-mt-3 text-sm text-muted-foreground">
              {t("goalsDescription")}
            </p>
            {goals.length ? (
              <>
                <div
                  role="progressbar"
                  aria-label={t("goalMilestones")}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(goalProgress)}
                  aria-valuetext={`${formatNumber(link.clicks, locale)} / ${formatNumber(goalTarget, locale)}`}
                  className="h-2.5 overflow-hidden rounded-full bg-border-soft"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-[var(--duration-fast)]"
                    style={{ width: `${goalProgress}%` }}
                  />
                </div>
                <ol className="grid grid-cols-2 gap-x-4 gap-y-4 sm:flex sm:justify-between">
                  {goals.map((goal) => (
                    <li key={goal.id} className="flex flex-col gap-0.5">
                      <span className="metric text-[15px] font-semibold">
                        {formatNumber(goal.clicks, locale)}
                      </span>
                      <span
                        className={cn(
                          "text-[13px]",
                          goal.reachedAt ? "text-success" : "text-muted-foreground"
                        )}
                      >
                        {goal.reachedAt
                          ? t("goalReached")
                          : t("goalToGo", {
                              remaining: formatNumber(
                                Math.max(0, goal.clicks - link.clicks),
                                locale
                              ),
                            })}
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                {t("noGoals")}
              </p>
            )}

            {editingGoals ? (
              <div id="milestone-editor" className="flex flex-col gap-4">
                {goals.length ? (
                  <ul className="overflow-hidden rounded-xl border">
                    {goals.map((goal, index) => (
                      <li
                        className="flex items-center gap-3 px-4 py-2 not-last:border-b"
                        key={goal.id}
                      >
                        <FlagIcon
                          aria-hidden="true"
                          className="size-4 text-muted-foreground"
                        />
                        <div className="min-w-0">
                          <p className="metric text-sm font-semibold">
                            {t("goalClicks", { count: goal.clicks })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {index === goals.length - 1
                              ? t("goalTargetAuto")
                              : `${Math.round((goal.clicks / goalTarget) * 100)}%`}
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
                    ))}
                  </ul>
                ) : null}
                <form
                  className="flex flex-col gap-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (!Number.isInteger(goalInputValue) || duplicateGoal)
                      return

                    updateGoals.mutate(
                      [...goals.map((goal) => goal.clicks), goalInputValue].sort(
                        (left, right) => left - right
                      ),
                      { onSuccess: () => setGoalInput("") }
                    )
                  }}
                >
                  <label
                    htmlFor="link-goal-input"
                    className="text-sm font-semibold"
                  >
                    {t("goalNew")}
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {t("goalTargetDescription")}
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      aria-invalid={duplicateGoal}
                      className="metric"
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
                </form>
              </div>
            ) : null}

            {updateGoals.isError ? (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertTitle>{t("goalsNotSaved")}</AlertTitle>
                <AlertDescription>{updateGoals.error.message}</AlertDescription>
              </Alert>
            ) : null}
          </section>

          <section
            className={cn(section, "border-b-0")}
            aria-labelledby="recent-clicks"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 id="recent-clicks" className={sectionTitle}>
                {t("recentClicks")}
              </h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  items={[
                    { value: "all", label: t("allCountries") },
                    ...analytics.countries.map((item) => ({
                      value: item.country,
                      label: item.country,
                    })),
                  ]}
                  value={country || "all"}
                  onValueChange={(value) => {
                    setCountry(value === "all" || !value ? "" : value)
                    setRecentClicksPage(1)
                  }}
                >
                  <SelectTrigger
                    aria-label={t("country")}
                    className="h-10 w-full sm:w-40"
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
                  items={[
                    { value: "all", label: t("allDevices") },
                    ...analytics.devices.map((item) => ({
                      value: item.device,
                      label: item.device,
                    })),
                  ]}
                  value={device || "all"}
                  onValueChange={(value) => {
                    setDevice(value === "all" || !value ? "" : value)
                    setRecentClicksPage(1)
                  }}
                >
                  <SelectTrigger
                    aria-label={t("device")}
                    className="h-10 w-full sm:w-40"
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
            </div>

            {analytics.recentClicks.length ? (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <Table className="text-[15px]">
                    <TableHeader>
                      <TableRow className="border-border-soft hover:bg-transparent">
                        {[t("date"), t("country"), t("device"), t("source")].map(
                          (heading) => (
                            <TableHead
                              key={heading}
                              className="h-11 px-0 text-[13px] font-semibold text-muted-foreground"
                            >
                              {heading}
                            </TableHead>
                          )
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.recentClicks.map((click) => (
                        <TableRow key={click.id} className="border-border-soft">
                          <TableCell className="px-0 py-3.5">
                            {formatDate(click.clickedAt, locale)}
                          </TableCell>
                          <TableCell className="px-0 py-3.5">
                            {click.country || "—"}
                          </TableCell>
                          <TableCell className="px-0 py-3.5">
                            {click.device || "—"}
                          </TableCell>
                          <TableCell className="max-w-[30ch] truncate px-0 py-3.5">
                            {click.referrer || t("direct")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <ul className="flex flex-col md:hidden">
                  {analytics.recentClicks.map((click) => (
                    <li
                      className="flex flex-col gap-1 border-b border-border-soft py-3"
                      key={click.id}
                    >
                      <div className="flex items-start justify-between gap-3 text-[15px]">
                        <span>{formatDate(click.clickedAt, locale)}</span>
                        <span className="text-muted-foreground">
                          {click.device || "—"}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {click.referrer || t("direct")} · {click.country || "—"}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("noRecentEvents")}
              </p>
            )}

            {analytics.recentClicksPagination.total ? (
              <footer className="flex items-center justify-between gap-3">
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
                    recentClicksPage >=
                    analytics.recentClicksPagination.pageCount
                  }
                  onClick={() => setRecentClicksPage((page) => page + 1)}
                >
                  {t("nextPage")}
                  <ChevronRightIcon data-icon="inline-end" />
                </Button>
              </footer>
            ) : null}
          </section>
        </div>

        <aside className="flex flex-col lg:sticky lg:top-6 lg:h-fit">
          <section
            aria-labelledby="link-settings"
            className="flex flex-col gap-5 rounded-2xl border p-6 shadow-[0_6px_16px_rgb(0_0_0/0.12)]"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="link-settings" className={sectionTitle}>
                {t("linkSettings")}
              </h2>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-xs font-semibold",
                  link.active
                    ? "bg-success-soft text-success"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-[7px] rounded-full",
                    link.active ? "bg-success" : "bg-subtle-foreground"
                  )}
                />
                {link.active ? t("linkLive") : t("paused")}
              </span>
            </div>
            <LinkForm
              link={link}
              pending={updateLink.isPending}
              onSubmit={(values) =>
                updateLink.mutateAsync(values).then(() => undefined)
              }
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold">
                    {t("redirectActive")}
                  </p>
                  <p className="text-[13px] text-muted-foreground">
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
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold">
                    {t("advertisingMode")}
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    {advertisingAvailable
                      ? t("advertisingLinkDescription")
                      : t("advertisingUnavailableDescription")}
                  </p>
                </div>
                <Switch
                  aria-label={t("excludeFromAdvertising")}
                  checked={adsOn}
                  disabled={!advertisingAvailable || updateLink.isPending}
                  onCheckedChange={(enabled) =>
                    updateLink.mutate({ adFree: !enabled })
                  }
                />
              </div>
              {updateLink.isError ? (
                <Alert variant="destructive">
                  <TriangleAlertIcon />
                  <AlertTitle>{t("changesNotSaved")}</AlertTitle>
                  <AlertDescription>{updateLink.error.message}</AlertDescription>
                </Alert>
              ) : null}
            </LinkForm>
          </section>

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  className="mx-auto mt-3 h-12 font-semibold text-muted-foreground hover:text-destructive"
                />
              }
            >
              <RotateCcwIcon data-icon="inline-start" />
              {t("resetStats")}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("resetStatsQuestion")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("resetStatsWarning")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={resetStats.isPending}
                  onClick={() => resetStats.mutate()}
                >
                  {t("resetStatsConfirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {resetStats.isError ? (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>{t("statsNotReset")}</AlertTitle>
              <AlertDescription>{resetStats.error.message}</AlertDescription>
            </Alert>
          ) : null}

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  className="mx-auto h-12 font-semibold text-muted-foreground hover:text-destructive"
                />
              }
            >
              <Trash2Icon data-icon="inline-start" />
              {t("deleteThisLink")}
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
        </aside>
      </div>
    </div>
  )
}
