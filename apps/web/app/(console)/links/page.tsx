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
  CardFooter,
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
import { Input } from "@workspace/ui/components/input"
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
import {
  CopyIcon,
  ExternalLinkIcon,
  Link2Icon,
  MousePointerClickIcon,
  PlusIcon,
  SearchIcon,
  TriangleAlertIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { MetricStrip } from "@/components/metric-strip"
import { api, type AnalyticsSummary, type ShortLink } from "@/lib/api"
import { formatDate, formatNumber } from "@/lib/format"

export default function LinksPage() {
  const { i18n, t } = useTranslation("links")
  const locale = i18n.resolvedLanguage ?? i18n.language
  const router = useRouter()
  const [search, setSearch] = useState("")
  const links = useQuery({
    queryKey: ["links"],
    queryFn: ({ signal }) =>
      api<{ links: ShortLink[] }>("/v1/links", { signal }),
  })
  const summary = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: ({ signal }) =>
      api<AnalyticsSummary>("/v1/analytics/summary", { signal }),
  })

  const filtered =
    links.data?.links.filter((link) =>
      `${link.slug} ${link.title ?? ""} ${link.url}`
        .toLowerCase()
        .includes(search.toLowerCase())
    ) ?? []

  function renderActions(link: ShortLink, mobile = false) {
    const sizeClass = mobile ? "size-10" : undefined

    return (
      <div
        className="flex items-center gap-1"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          className={sizeClass}
          aria-label={t("copyLink", { link: link.shortUrl })}
          onClick={() =>
            navigator.clipboard
              .writeText(link.shortUrl)
              .then(() =>
                toast.add({ title: t("linkCopied"), type: "success" })
              )
          }
        >
          <CopyIcon />
        </Button>
        <a
          href={link.shortUrl}
          target="_blank"
          rel="noreferrer"
          className={`${buttonVariants({ variant: "ghost", size: "icon-sm" })} ${sizeClass ?? ""}`}
          aria-label={t("openLink", { link: link.shortUrl })}
        >
          <ExternalLinkIcon />
        </a>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">
          {t("links")}
        </h1>
        <Link href="/links/new" className={buttonVariants({ size: "lg" })}>
          <PlusIcon data-icon="inline-start" />
          {t("createLink")}
        </Link>
      </header>

      {summary.isPending ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : null}
      {summary.isError ? (
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
      ) : null}
      {summary.isSuccess ? (
        <MetricStrip
          label={t("mainMetrics")}
          items={[
            {
              label: t("linksCreated"),
              value: formatNumber(summary.data.totals.links, locale),
              detail: `${formatNumber(summary.data.totals.activeLinks, locale)} ${t("activeLinks")}`,
              icon: Link2Icon,
            },
            {
              label: t("totalClicks"),
              value: formatNumber(summary.data.totals.clicks, locale),
              icon: MousePointerClickIcon,
            },
            {
              label: t("last30Days"),
              value: formatNumber(summary.data.totals.clicksLast30Days, locale),
              icon: MousePointerClickIcon,
            },
          ]}
        />
      ) : null}

      <section
        className="flex flex-col gap-5"
        aria-labelledby="all-links-title"
      >
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <h2
              id="all-links-title"
              className="text-2xl font-semibold tracking-[-0.025em]"
            >
              {t("allLinks")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("allLinksDescription")}
            </p>
          </div>
          <label className="relative block w-full sm:max-w-sm">
            <span className="sr-only">{t("searchLinks")}</span>
            <SearchIcon
              aria-hidden="true"
              className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              name="search"
              className="h-10 pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchLinksPlaceholder")}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
        </header>

        {links.isPending ? (
          <div className="flex gap-3 overflow-hidden md:flex-col">
            <Skeleton className="h-52 w-[80vw] shrink-0 md:h-12 md:w-full" />
            <Skeleton className="h-52 w-[80vw] shrink-0 md:h-12 md:w-full" />
            <Skeleton className="h-52 w-[80vw] shrink-0 md:h-12 md:w-full" />
          </div>
        ) : null}
        {links.isError ? (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>{t("linksUnavailable")}</AlertTitle>
            <AlertDescription>
              {t("dashboardErrorDescription")}
            </AlertDescription>
            <Button
              variant="outline"
              className="mt-3 w-fit"
              onClick={() => links.refetch()}
            >
              {t("retry")}
            </Button>
          </Alert>
        ) : null}
        {links.isSuccess && filtered.length ? (
          <>
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 md:hidden">
              {filtered.map((link, index) => (
                <Card
                  key={link.id}
                  size="sm"
                  className="link-list-card w-[min(82vw,21rem)] shrink-0 cursor-pointer snap-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
                  tabIndex={0}
                  aria-label={t("openLink", { link: link.shortUrl })}
                  onClick={(event) => {
                    if (!event.defaultPrevented)
                      router.push(`/links/${link.id}`)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      router.push(`/links/${link.id}`)
                    }
                  }}
                >
                  <CardHeader className="border-b">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/links/${link.id}`}
                          className="block truncate font-mono font-medium hover:text-primary hover:underline"
                        >
                          {link.shortUrl}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("created")} {formatDate(link.createdAt, locale)}
                        </p>
                      </div>
                      <Badge variant={link.active ? "default" : "secondary"}>
                        {link.active ? t("active") : t("paused")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <p className="truncate font-medium">
                      {link.title || t("destination")}
                    </p>
                    <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {link.url}
                    </p>
                  </CardContent>
                  <CardFooter className="justify-between border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t("clicks")}
                      </p>
                      <p className="metric text-lg font-semibold">
                        {formatNumber(link.clicks, locale)}
                      </p>
                    </div>
                    {renderActions(link, true)}
                  </CardFooter>
                </Card>
              ))}
            </div>

            <Card className="hidden overflow-hidden py-0 md:flex">
              <CardContent className="px-0">
                <Table>
                  <TableHeader className="bg-muted/45">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-11 pl-5">
                        {t("shortLink")}
                      </TableHead>
                      <TableHead>{t("destination")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead className="text-right">
                        {t("clicks")}
                      </TableHead>
                      <TableHead className="pr-5">
                        <span className="sr-only">{t("actions")}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((link, index) => (
                      <TableRow
                        className="link-list-row cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
                        key={link.id}
                        style={{
                          animationDelay: `${Math.min(index, 6) * 40}ms`,
                        }}
                        tabIndex={0}
                        aria-label={t("openLink", { link: link.shortUrl })}
                        onClick={(event) => {
                          if (!event.defaultPrevented) {
                            router.push(`/links/${link.id}`)
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            router.push(`/links/${link.id}`)
                          }
                        }}
                      >
                        <TableCell className="pl-5">
                          <Link
                            href={`/links/${link.id}`}
                            className="font-mono font-medium hover:text-primary hover:underline"
                          >
                            {link.shortUrl}
                          </Link>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("created")} {formatDate(link.createdAt, locale)}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-[38ch] truncate text-muted-foreground">
                          {link.title || link.url}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={link.active ? "default" : "secondary"}
                          >
                            {link.active ? t("active") : t("paused")}
                          </Badge>
                        </TableCell>
                        <TableCell className="metric text-right font-medium">
                          {formatNumber(link.clicks, locale)}
                        </TableCell>
                        <TableCell className="pr-5">
                          {renderActions(link)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : null}
        {links.isSuccess && !filtered.length ? (
          <Empty className="min-h-60 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Link2Icon />
              </EmptyMedia>
              <EmptyTitle>
                {search ? t("noResults") : t("firstLinkStartsHere")}
              </EmptyTitle>
              <EmptyDescription>
                {search ? t("tryAnotherSearch") : t("firstLinkDescription")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
      </section>
    </div>
  )
}
