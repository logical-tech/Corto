"use client"

import { useQuery } from "@tanstack/react-query"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { buttonVariants, Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyContent,
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
import { toast } from "@workspace/ui/components/toast"
import { cn } from "@workspace/ui/lib/utils"
import {
  CircleCheckIcon,
  CirclePauseIcon,
  CopyIcon,
  GaugeIcon,
  HourglassIcon,
  LayoutGridIcon,
  Link2Icon,
  ListIcon,
  LockIcon,
  MegaphoneIcon,
  PlusIcon,
  SearchIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  api,
  type AdvertisingSettings,
  type ShortLink,
} from "@/lib/api"
import { formatDate, formatNumber } from "@/lib/format"

type Filter =
  | "all"
  | "active"
  | "paused"
  | "password"
  | "expiring"
  | "ads"
  | "clickLimit"

const filters: Array<{
  id: Filter
  label: string
  icon: LucideIcon
  match: (link: ShortLink) => boolean
}> = [
  { id: "all", label: "allLinks", icon: LayoutGridIcon, match: () => true },
  {
    id: "active",
    label: "active",
    icon: CircleCheckIcon,
    match: (link) => link.active,
  },
  {
    id: "paused",
    label: "paused",
    icon: CirclePauseIcon,
    match: (link) => !link.active,
  },
  {
    id: "password",
    label: "linkFormPassword",
    icon: LockIcon,
    match: (link) => link.hasPassword,
  },
  {
    id: "expiring",
    label: "filterExpiring",
    icon: HourglassIcon,
    match: (link) => Boolean(link.expiresAt),
  },
  {
    id: "ads",
    label: "filterAdSupported",
    icon: MegaphoneIcon,
    match: (link) => !link.adFree,
  },
  {
    id: "clickLimit",
    label: "linkFormClickLimit",
    icon: GaugeIcon,
    match: (link) => link.clickLimit !== null,
  },
]

const withoutProtocol = (url: string) => url.replace(/^https?:\/\//, "")

export default function LinksPage() {
  return (
    <Suspense>
      <LinksList />
    </Suspense>
  )
}

function LinksList() {
  const { i18n, t } = useTranslation("links")
  const locale = i18n.resolvedLanguage ?? i18n.language
  const router = useRouter()
  // The URL is the source of truth so the topbar search can deep link here.
  const search = useSearchParams().get("q") ?? ""
  const [filter, setFilter] = useState<Filter>("all")
  const [view, setView] = useState<"grid" | "list">("grid")
  const links = useQuery({
    queryKey: ["links"],
    queryFn: ({ signal }) =>
      api<{ links: ShortLink[] }>("/v1/links", { signal }),
  })
  const advertising = useQuery({
    queryKey: ["advertising"],
    queryFn: ({ signal }) =>
      api<AdvertisingSettings>("/v1/advertising", { signal }),
    retry: false,
  })
  const advertisingAvailable = Boolean(
    advertising.data?.enabled && advertising.data.banners.length
  )
  const visibleFilters = filters.filter(
    (item) => item.id !== "ads" || advertisingAvailable
  )
  const match =
    visibleFilters.find((item) => item.id === filter)?.match ?? (() => true)
  const allLinks = links.data?.links ?? []
  const filtered = allLinks.filter(
    (link) =>
      match(link) &&
      `${link.slug} ${link.title ?? ""} ${link.url}`
        .toLowerCase()
        .includes(search.toLowerCase())
  )

  function setSearch(value: string) {
    window.history.replaceState(
      null,
      "",
      value ? `/links?q=${encodeURIComponent(value)}` : "/links"
    )
  }

  function copy(link: ShortLink) {
    navigator.clipboard
      .writeText(link.shortUrl)
      .then(() => toast.add({ title: t("linkCopied"), type: "success" }))
  }

  function status(link: ShortLink) {
    if (!link.active) return { label: t("paused"), dot: "bg-subtle-foreground" }
    if (link.expiresAt && new Date(link.expiresAt) < new Date())
      return { label: t("linkStatusExpired"), dot: "bg-destructive" }
    if (link.hasPassword)
      return { label: t("linkFormPassword"), dot: "bg-foreground" }
    if (link.clickLimit !== null)
      return {
        label: t("clickLimitProgress", {
          clicks: formatNumber(link.clicks, locale),
          limit: formatNumber(link.clickLimit, locale),
        }),
        dot: "bg-primary",
      }
    if (link.expiresAt)
      return {
        label: t("linkStatusExpires", {
          date: formatDate(link.expiresAt, locale),
        }),
        dot: "bg-destructive",
      }
    return { label: t("active"), dot: "bg-success" }
  }

  function statusPill(link: ShortLink, className?: string) {
    const { label, dot } = status(link)

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap",
          className
        )}
      >
        <span aria-hidden="true" className={cn("size-[7px] rounded-full", dot)} />
        {label}
      </span>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[32px] leading-tight font-bold tracking-[-0.6px]">
            {t("links")}
          </h1>
          {links.isSuccess ? (
            <p className="text-muted-foreground">
              {t("linksSummary", {
                total: formatNumber(allLinks.length, locale),
                active: formatNumber(
                  allLinks.filter((link) => link.active).length,
                  locale
                ),
              })}
            </p>
          ) : null}
        </div>
        <Link
          href="/links/new"
          className={buttonVariants({ size: "lg", className: "px-6" })}
        >
          <PlusIcon data-icon="inline-start" />
          {t("createLink")}
        </Link>
      </header>

      <div className="flex flex-col gap-4 border-b border-border-soft lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div
          role="group"
          aria-label={t("linkFilters")}
          className="-mb-px flex gap-7 overflow-x-auto sm:gap-9"
        >
          {visibleFilters.map((item) => {
            const selected = filter === item.id
            const Icon = item.icon

            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(item.id)}
                className={cn(
                  "flex shrink-0 flex-col items-center gap-2 border-b-2 pt-1 pb-3 text-xs font-semibold whitespace-nowrap transition-colors duration-[var(--duration-quick)] outline-none focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                <Icon aria-hidden="true" className="size-6" strokeWidth={1.5} />
                {t(item.label)}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-3 pb-4 lg:pb-0">
          <label className="relative block min-w-0 flex-1 lg:w-64">
            <span className="sr-only">{t("searchLinks")}</span>
            <SearchIcon
              aria-hidden="true"
              className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              name="search"
              className="h-11 w-full rounded-xl border bg-background pr-3 pl-10 text-[13px] font-medium outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchLinksPlaceholder")}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <div
            role="group"
            aria-label={t("linkView")}
            className="flex shrink-0 gap-0.5 rounded-xl border p-1"
          >
            {(
              [
                ["grid", LayoutGridIcon, "viewGrid"],
                ["list", ListIcon, "viewList"],
              ] as const
            ).map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={view === id}
                aria-label={t(label)}
                title={t(label)}
                onClick={() => setView(id)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                  view === id && "bg-muted text-foreground"
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {links.isPending ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="flex flex-col gap-3">
              <Skeleton className="aspect-square rounded-2xl" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : null}
      {links.isError ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>{t("linksUnavailable")}</AlertTitle>
          <AlertDescription>{t("linksUnavailableDescription")}</AlertDescription>
          <Button
            variant="outline"
            className="mt-3 w-fit"
            onClick={() => links.refetch()}
          >
            {t("retry")}
          </Button>
        </Alert>
      ) : null}

      {links.isSuccess && filtered.length && view === "grid" ? (
        <ul className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((link, index) => (
            <li
              key={link.id}
              className="link-list-card group/card relative"
              style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
            >
              <Link
                href={`/links/${link.id}`}
                className="flex flex-col gap-3 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
              >
                <div className="flex aspect-[252/250] flex-col justify-between rounded-2xl bg-muted p-3.5 transition-colors duration-[var(--duration-quick)] group-hover/card:bg-accent">
                  {statusPill(link, "w-fit")}
                  <div className="flex flex-1 items-center justify-center text-subtle-foreground">
                    <Link2Icon
                      aria-hidden="true"
                      className="size-10"
                      strokeWidth={1.25}
                    />
                  </div>
                  <p className="truncate text-center text-xs font-medium text-muted-foreground">
                    {URL.canParse(link.url) ? new URL(link.url).hostname : ""}
                  </p>
                </div>
                <div className="flex min-w-0 flex-col gap-[3px] text-[15px]">
                  <p className="truncate font-semibold">
                    {withoutProtocol(link.shortUrl)}
                  </p>
                  {link.title ? (
                    <p className="truncate text-muted-foreground">
                      {link.title}
                    </p>
                  ) : null}
                  <p className="truncate text-muted-foreground">
                    {withoutProtocol(link.url)}
                  </p>
                  <p className="pt-1">
                    <span className="metric font-semibold">
                      {formatNumber(link.clicks, locale)}
                    </span>{" "}
                    {t("clicksUnit")}
                  </p>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-3.5 right-3.5 size-8 rounded-full bg-background/90 hover:bg-background"
                aria-label={t("copyLink", { link: link.shortUrl })}
                onClick={() => copy(link)}
              >
                <CopyIcon className="size-[15px]" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {links.isSuccess && filtered.length && view === "list" ? (
        <div className="overflow-x-auto rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-11 pl-5">{t("shortLink")}</TableHead>
                <TableHead>{t("destination")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-right">{t("clicks")}</TableHead>
                <TableHead className="pr-5">
                  <span className="sr-only">{t("actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((link, index) => (
                <TableRow
                  className="link-list-row cursor-pointer"
                  key={link.id}
                  style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
                  onClick={(event) => {
                    if (!event.defaultPrevented) router.push(`/links/${link.id}`)
                  }}
                >
                  <TableCell className="pl-5">
                    <Link
                      href={`/links/${link.id}`}
                      className="font-semibold hover:underline"
                    >
                      {withoutProtocol(link.shortUrl)}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("created")} {formatDate(link.createdAt, locale)}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-[38ch] truncate text-muted-foreground">
                    {link.title || withoutProtocol(link.url)}
                  </TableCell>
                  <TableCell>{statusPill(link, "border")}</TableCell>
                  <TableCell className="metric text-right font-semibold">
                    {formatNumber(link.clicks, locale)}
                  </TableCell>
                  <TableCell className="pr-5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("copyLink", { link: link.shortUrl })}
                      onClick={(event) => {
                        event.preventDefault()
                        copy(link)
                      }}
                    >
                      <CopyIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      {links.isSuccess && !filtered.length ? (
        <Empty className="min-h-60 rounded-2xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Link2Icon />
            </EmptyMedia>
            <EmptyTitle>
              {allLinks.length ? t("noResults") : t("firstLinkStartsHere")}
            </EmptyTitle>
            <EmptyDescription>
              {allLinks.length
                ? t("tryAnotherSearch")
                : t("firstLinkDescription")}
            </EmptyDescription>
          </EmptyHeader>
          {allLinks.length ? null : (
            <EmptyContent>
              <Link href="/links/new" className={buttonVariants()}>
                <PlusIcon data-icon="inline-start" />
                {t("createLink")}
              </Link>
            </EmptyContent>
          )}
        </Empty>
      ) : null}
    </div>
  )
}
