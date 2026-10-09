"use client"

import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  ArrowRightIcon,
  ChartColumnBigIcon,
  ChartColumnIcon,
  CheckIcon,
  CodeXmlIcon,
  KeyRoundIcon,
  LinkIcon,
  MegaphoneIcon,
  MenuIcon,
  RouteIcon,
  ScissorsIcon,
  SparklesIcon,
  UserRoundIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useId, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"

import { useAppUrl } from "@/lib/app-url"
import { Brand } from "@/components/brand"
import { LanguageSwitcher } from "@/components/language-switcher"
import {
  normalizePastedDestination,
  pendingDestinationKey,
} from "@/components/quick-link-capture"
import { ThemeToggle } from "@/components/theme-toggle"

export const repositoryUrl = "https://github.com/logical-tech/Corto"

export function SiteHeader({
  active,
  children,
}: {
  active: "links" | "api"
  children?: React.ReactNode
}) {
  const { t } = useTranslation("landing")
  const tabs = [
    ["links", "/", "shortLinks", LinkIcon],
    ["analytics", "/#features", "analytics", ChartColumnIcon],
    ["api", "/docs", "api", CodeXmlIcon],
  ] as const

  return (
    <header className="border-b border-border-soft">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-5 pt-5 pb-5 sm:px-8 lg:px-20 lg:pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="lg:w-80">
            <Brand />
          </div>
          <nav
            aria-label={t("primaryNavigation")}
            className="flex items-center gap-8 max-lg:hidden"
          >
            {tabs.map(([key, href, label, Icon]) => (
              <Link
                aria-current={active === key ? "page" : undefined}
                className={cn(
                  "-mb-px flex items-center gap-2 border-b-2 whitespace-nowrap pt-1.5 pb-2.5 text-[15px] font-semibold transition-colors",
                  active === key
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                href={href}
                key={key}
              >
                <Icon aria-hidden="true" className="size-5" strokeWidth={1.5} />
                {t(label)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center justify-end gap-1 lg:w-80">
            <Link
              className="rounded-full px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap hover:bg-muted max-sm:hidden"
              href="/docs"
            >
              {t("publicDocs")}
            </Link>
            <a
              className="rounded-full px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap hover:bg-muted max-sm:hidden"
              href={repositoryUrl}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <ThemeToggle />
            <LanguageSwitcher />
            <Link
              aria-label={t("signIn")}
              className="ml-1 flex items-center gap-2.5 rounded-full border border-border py-1 pr-1 pl-3.5 transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
              href="/login"
              title={t("signIn")}
            >
              <MenuIcon aria-hidden="true" className="size-4" />
              <span className="flex size-8 items-center justify-center rounded-full bg-muted-foreground text-background">
                <UserRoundIcon aria-hidden="true" className="size-[18px]" />
              </span>
            </Link>
          </div>
        </div>
        {children}
      </div>
    </header>
  )
}

function ShortenBar() {
  const { t } = useTranslation("landing")
  const router = useRouter()
  const inputId = useId()
  const [invalid, setInvalid] = useState(false)

  // Signed-out visitors land on /register, signed-in ones are bounced to the
  // dashboard; either way the console's quick-link dialog picks the URL up.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const destination = normalizePastedDestination(
      String(new FormData(event.currentTarget).get("destination") ?? "")
    )
    setInvalid(!destination)
    if (!destination) return
    try {
      sessionStorage.setItem(pendingDestinationKey, destination)
    } catch {}
    router.push("/register")
  }

  return (
    <form
      className="mx-auto w-full max-w-[900px] pb-3 lg:pb-4"
      noValidate
      onSubmit={submit}
    >
      <div className="flex items-center gap-2 rounded-full bg-background p-2 pl-0 shadow-[0_3px_12px_rgb(0_0_0/0.1),0_1px_2px_rgb(0_0_0/0.08)] ring-1 ring-border-soft">
        <label
          className="flex min-w-0 flex-1 cursor-text flex-col gap-0.5 rounded-full px-6 py-1.5 focus-within:bg-muted sm:px-8"
          htmlFor={inputId}
        >
          <span className="text-xs font-bold" id={`${inputId}-label`}>
            {t("destination")}
          </span>
          <input
            aria-describedby={invalid ? `${inputId}-error` : undefined}
            aria-invalid={invalid}
            aria-labelledby={`${inputId}-label`}
            autoComplete="url"
            className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            id={inputId}
            inputMode="url"
            name="destination"
            onChange={() => setInvalid(false)}
            placeholder={t("destinationPlaceholder")}
            type="text"
          />
        </label>
        <button
          className="flex h-13 shrink-0 items-center gap-2 rounded-full bg-primary pr-5.5 pl-4.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none max-sm:size-13 max-sm:justify-center max-sm:p-0"
          type="submit"
        >
          <ScissorsIcon aria-hidden="true" className="size-[18px]" />
          <span className="max-sm:sr-only">{t("shorten")}</span>
        </button>
      </div>
      {invalid ? (
        <p
          className="mt-2 px-8 text-sm text-destructive"
          id={`${inputId}-error`}
          role="alert"
        >
          {t("invalidDestination")}
        </p>
      ) : null}
    </form>
  )
}

export function LandingContent() {
  const { t } = useTranslation("landing")
  const appUrl = useAppUrl()
  const apiUrl = `${appUrl}/api`
  const features = [
    ["controllableLinks", "controllableLinksDescription", RouteIcon],
    ["readableAnalytics", "readableAnalyticsDescription", ChartColumnBigIcon],
    ["advertisingRedirects", "advertisingRedirectsDescription", MegaphoneIcon],
    ["firstClassApi", "firstClassApiDescription", KeyRoundIcon],
  ] as const
  const developerChecks = ["checkKeys", "checkMcp", "checkRateLimit"] as const
  const footerColumns = [
    [
      "product",
      [
        ["/dashboard", t("dashboard")],
        ["/links/new", t("createLink")],
        ["/#features", t("analytics")],
        ["/#features", t("advertisingRedirects")],
      ],
    ],
    [
      "developers",
      [
        ["/docs", t("publicDocs")],
        [`${apiUrl}/openapi.json`, t("openApiJson")],
        ["/docs#endpoints", t("mcpEndpoint")],
        ["/docs#self-host", t("selfHostGuide")],
      ],
    ],
    [
      "openSource",
      [
        [repositoryUrl, "GitHub"],
        [`${repositoryUrl}/blob/main/LICENSE`, t("license")],
        [`${repositoryUrl}/blob/main/docs/DEPLOY.md`, t("deployOnDokploy")],
        [`${repositoryUrl}/blob/main/docs/COOLIFY.md`, t("deployOnCoolify")],
      ],
    ],
  ] as const

  return (
    <>
      <SiteHeader active="links">
        <ShortenBar />
      </SiteHeader>
      <main id="main-content" tabIndex={-1} className="overflow-hidden">
        <section className="mx-auto flex max-w-[1440px] flex-col items-center gap-5 px-5 pt-16 pb-20 text-center sm:px-8 lg:px-20 lg:pt-22 lg:pb-24">
          <p className="flex items-center gap-2 rounded-full bg-primary-soft px-3.5 py-1.5 text-[13px] font-semibold text-primary-hover dark:text-primary">
            <SparklesIcon aria-hidden="true" className="size-3.5" />
            {t("eyebrow")}
          </p>
          <h1 className="max-w-[760px] text-5xl font-bold tracking-[-0.035em] text-balance sm:text-6xl lg:text-[72px] lg:leading-[73px]">
            {t("landingTitle")}
          </h1>
          <p className="max-w-[640px] text-lg leading-7 text-pretty text-muted-foreground sm:text-xl sm:leading-[29px]">
            {t("landingDescription")}
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-3">
            <Link
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-auto rounded-[10px] px-6 py-3.5 text-base"
              )}
              href="/register"
            >
              {t("getStartedFree")}
            </Link>
            <Link
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "h-auto rounded-[10px] px-6 py-3.5 text-base"
              )}
              href="/docs"
            >
              <CodeXmlIcon aria-hidden="true" data-icon="inline-start" />
              {t("exploreApi")}
            </Link>
          </div>
        </section>

        <section id="features" className="content-auto scroll-mt-4 bg-muted">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-12 px-5 py-20 sm:px-8 lg:px-20">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="max-w-[16ch] text-4xl font-bold tracking-[-0.03em] text-balance lg:text-[44px] lg:leading-[48px]">
                {t("landingFeatures")}
              </h2>
              <p className="max-w-[480px] text-lg leading-[27px] text-pretty text-muted-foreground">
                {t("landingFeaturesDescription")}
              </p>
            </div>
            <div className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(([title, description, Icon]) => (
                <article
                  className="flex flex-col gap-4 rounded-[20px] bg-background p-7"
                  key={title}
                >
                  <span className="flex size-13 items-center justify-center rounded-[14px] bg-primary-soft text-primary">
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                  <h3 className="text-[19px] font-semibold">{t(title)}</h3>
                  <p className="text-[15px] leading-[23px] text-pretty text-muted-foreground">
                    {t(description)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className="content-auto mx-auto grid max-w-[1440px] items-center gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:px-20"
        >
          <div className="flex flex-col gap-5">
            <p className="text-[13px] font-bold tracking-[0.09em] text-primary uppercase">
              {t("forDevelopers")}
            </p>
            <h2 className="text-4xl font-bold tracking-[-0.03em] text-balance lg:text-[44px] lg:leading-[48px]">
              {t("sameProduct")}
            </h2>
            <p className="max-w-[60ch] text-lg leading-[27px] text-pretty text-muted-foreground">
              {t("sameProductDescription")}
            </p>
            <ul className="flex flex-col gap-3 pt-2">
              {developerChecks.map((key) => (
                <li className="flex items-center gap-3" key={key}>
                  <CheckIcon aria-hidden="true" className="size-[18px]" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
          <figure className="min-w-0 overflow-hidden rounded-[20px] bg-foreground text-background shadow-[0_20px_40px_rgb(0_0_0/0.15)] dark:bg-muted dark:text-foreground">
            <figcaption className="flex items-center gap-2 border-b border-background/10 px-5 py-4 font-mono text-[13px] text-background/60 dark:border-foreground/10 dark:text-foreground/60">
              <span aria-hidden="true" className="flex gap-2 pr-3">
                <span className="size-3 rounded-full bg-background/25 dark:bg-foreground/25" />
                <span className="size-3 rounded-full bg-background/25 dark:bg-foreground/25" />
                <span className="size-3 rounded-full bg-background/25 dark:bg-foreground/25" />
              </span>
              create-link.sh
            </figcaption>
            <pre className="overflow-x-auto px-7 pt-6 pb-7 font-mono text-sm leading-[25px]">
              <code>
                {`curl -X POST ${apiUrl}/v1/links \\
  -H "x-api-key: $CORTO_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{"url":"https://example.com/brief"}'`}
                <span className="mt-4 block opacity-60">{`→ 201 { "link": { "shortUrl": "${appUrl}/…" } }`}</span>
              </code>
            </pre>
          </figure>
        </section>

        <section className="content-auto mx-auto max-w-[1440px] px-5 pb-24 sm:px-8 lg:px-20">
          <div className="flex flex-col items-start gap-5 rounded-3xl bg-primary px-8 py-16 text-primary-foreground sm:px-16 lg:min-h-[440px] lg:justify-center">
            <h2 className="max-w-[13ch] text-4xl font-bold tracking-[-0.03em] text-balance sm:text-[52px] sm:leading-[55px]">
              {t("nextLinkReady")}
            </h2>
            <p className="max-w-[440px] text-lg leading-[26px] text-primary-foreground/85">
              {t("nextLinkDescription")}
            </p>
            <Link
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-auto rounded-[10px] bg-background px-6 py-3.5 text-base text-foreground hover:bg-background/90"
              )}
              href="/register"
            >
              {t("openDashboard")}
              <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-soft bg-muted">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-5 pt-12 pb-8 sm:px-8 lg:px-20">
          <div className="grid gap-10 sm:grid-cols-3 sm:gap-6">
            {footerColumns.map(([heading, links]) => (
              <nav
                aria-label={t(heading)}
                className="flex flex-col items-start gap-3.5 text-[15px]"
                key={heading}
              >
                <h2 className="font-semibold">{t(heading)}</h2>
                {links.map(([href, label]) =>
                  href.startsWith("/") ? (
                    <Link
                      className="text-muted-foreground hover:text-foreground"
                      href={href}
                      key={label}
                    >
                      {label}
                    </Link>
                  ) : (
                    <a
                      className="text-muted-foreground hover:text-foreground"
                      href={href}
                      key={label}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {label}
                    </a>
                  )
                )}
              </nav>
            ))}
          </div>
          <div className="flex flex-col gap-4 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>{t("copyright", { year: new Date().getFullYear() })}</p>
            <LanguageSwitcher />
          </div>
        </div>
      </footer>
    </>
  )
}
