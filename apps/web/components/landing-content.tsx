"use client"

import { Badge } from "@workspace/ui/components/badge"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  ArrowRightIcon,
  BarChart3Icon,
  CheckIcon,
  KeyRoundIcon,
  MegaphoneIcon,
  RouteIcon,
} from "lucide-react"
import Link from "next/link"
import { useTranslation } from "react-i18next"

import { useAppUrl } from "@/lib/app-url"
import { Brand } from "@/components/brand"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"

const repositoryUrl = "https://github.com/logical-tech/Corto"

const routeRows = [
  ["sho.rt/brief", "design.example.com/brief", "12,482"],
  ["sho.rt/notes", "notes.example.com/issue-04", "3,620"],
  ["sho.rt/launch", "product.example.com/launch", "842"],
] as const

export function LandingContent() {
  const { t } = useTranslation("landing")
  const apiUrl = `${useAppUrl()}/api`
  const features = [
    ["controllableLinks", "controllableLinksDescription", RouteIcon],
    ["readableAnalytics", "readableAnalyticsDescription", BarChart3Icon],
    ["advertisingRedirects", "advertisingRedirectsDescription", MegaphoneIcon],
    ["firstClassApi", "firstClassApiDescription", KeyRoundIcon],
  ] as const

  return (
    <main id="main-content" tabIndex={-1} className="overflow-hidden">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Brand />
        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-1"
        >
          <Link
            className={`${buttonVariants({ variant: "ghost", size: "lg" })} max-sm:!hidden`}
            href="/docs"
          >
            {t("publicDocs")}
          </Link>
          <a
            className={`${buttonVariants({ variant: "ghost", size: "lg" })} max-sm:!hidden`}
            href={repositoryUrl}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <ThemeToggle />
          <LanguageSwitcher />
          <Link
            className={`${buttonVariants({ variant: "ghost", size: "lg" })} max-sm:!hidden`}
            href="/login"
          >
            {t("signIn")}
          </Link>
          <Link
            className={`${buttonVariants({ size: "lg" })} max-sm:!hidden`}
            href="/register"
          >
            {t("getStarted")}
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid min-h-[calc(100svh-5rem)] max-w-7xl min-w-0 items-center gap-14 px-5 py-14 sm:px-8 lg:grid-cols-[0.86fr_1.14fr] lg:py-20">
        <div className="flex max-w-2xl min-w-0 flex-col items-start gap-7">
          <h1 className="max-w-[12ch] text-5xl font-semibold tracking-[-0.04em] text-balance sm:text-6xl lg:text-[5.5rem] lg:leading-[0.96]">
            {t("landingTitle")}
          </h1>
          <p className="max-w-[62ch] text-lg leading-8 text-pretty text-muted-foreground sm:text-xl">
            {t("landingDescription")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className={buttonVariants({ size: "lg" })} href="/register">
              {t("createLink")}
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
            <Link
              className={buttonVariants({ size: "lg", variant: "outline" })}
              href="/docs"
            >
              {t("exploreApi")}
            </Link>
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckIcon className="text-primary" aria-hidden="true" />
            {t("landingNote")}
          </p>
        </div>

        <div
          aria-label={t("liveRoutes")}
          className="relative min-h-[500px] min-w-0 rounded-2xl bg-card p-5 shadow-[0_24px_80px_-48px_oklch(0.18_0.025_260/0.65)] ring-1 ring-foreground/5 sm:p-8"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <RouteIcon aria-hidden="true" />
              {t("liveRoutes")}
            </div>
            <Badge variant="secondary">{t("illustrativeData")}</Badge>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl bg-background ring-1 ring-foreground/5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-b px-5 py-3 text-xs font-medium text-muted-foreground sm:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_auto]">
              <span>{t("shortLink")}</span>
              <span className="hidden sm:block">{t("destination")}</span>
              <span>{t("clicks")}</span>
            </div>
            <div className="divide-y">
              {routeRows.map(([slug, destination, clicks]) => (
                <div
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_auto]"
                  key={slug}
                >
                  <span className="truncate font-mono text-sm font-medium">
                    {slug}
                  </span>
                  <span className="hidden truncate text-sm text-muted-foreground sm:block">
                    {destination}
                  </span>
                  <span className="metric font-mono text-sm font-semibold">
                    {clicks}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <svg
            aria-hidden="true"
            className="my-4 h-24 w-full overflow-visible"
            viewBox="0 0 680 96"
            fill="none"
          >
            <path
              className="routing-path"
              pathLength="1"
              d="M18 48H236C286 48 288 16 340 16H446C496 16 496 80 550 80H662"
              stroke="var(--primary)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="18" cy="48" r="7" fill="var(--signal)" />
            <circle cx="662" cy="80" r="7" fill="var(--primary)" />
          </svg>

          <div className="route-arrival grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-sm">
              <p className="text-xs font-medium opacity-75">
                {t("latestRoute")}
              </p>
              <p className="mt-2 font-mono text-xl font-semibold">
                sho.rt/brief
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-secondary p-4 text-secondary-foreground">
              <span className="signal-dot size-2 rounded-full" />
              <div>
                <p className="metric font-mono text-lg font-semibold">16,944</p>
                <p className="text-xs opacity-70">{t("totalClicks")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="content-auto border-y bg-card">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
            <h2 className="max-w-[12ch] text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
              {t("landingFeatures")}
            </h2>
            <div>
              <p className="max-w-[62ch] text-lg leading-8 text-pretty text-muted-foreground">
                {t("landingFeaturesDescription")}
              </p>
              <div className="mt-8 divide-y">
                {features.map(([title, description, Icon]) => (
                  <article
                    className="grid gap-4 py-7 first:pt-0 last:pb-0 sm:grid-cols-[auto_1fr] sm:gap-6"
                    key={title}
                  >
                    <Icon className="mt-1 text-primary" aria-hidden="true" />
                    <div>
                      <h3 className="text-xl font-semibold">{t(title)}</h3>
                      <p className="mt-2 max-w-[65ch] leading-7 text-pretty text-muted-foreground">
                        {t(description)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="workflow"
        className="content-auto mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32"
      >
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
          <div>
            <h2 className="text-4xl font-semibold tracking-[-0.035em] text-balance">
              {t("sameProduct")}
            </h2>
            <p className="mt-5 max-w-[60ch] text-lg leading-8 text-pretty text-muted-foreground">
              {t("sameProductDescription")}
            </p>
          </div>
          <pre
            aria-label={t("exploreApi")}
            className="overflow-x-auto rounded-2xl bg-foreground p-6 font-mono text-sm leading-7 text-background shadow-xl"
          >
            <code>{`curl -X POST ${apiUrl}/v1/links \\
  -H "x-api-key: $CORTO_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{"url":"https://example.com/brief"}'`}</code>
          </pre>
        </div>
      </section>

      <section className="content-auto bg-foreground text-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-24 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:py-28">
          <div>
            <h2 className="max-w-[13ch] text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
              {t("nextLinkReady")}
            </h2>
            <p className="mt-5 text-lg text-background/70">
              {t("nextLinkDescription")}
            </p>
          </div>
          <Link
            className={buttonVariants({ size: "lg", variant: "secondary" })}
            href="/register"
          >
            {t("openDashboard")}
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Brand />
        <div className="flex gap-5">
          <Link className="hover:text-foreground" href="/docs">
            {t("publicDocs")}
          </Link>
          <Link className="hover:text-foreground" href="/login">
            {t("signIn")}
          </Link>
          <a
            className="hover:text-foreground"
            href={repositoryUrl}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </footer>
    </main>
  )
}
