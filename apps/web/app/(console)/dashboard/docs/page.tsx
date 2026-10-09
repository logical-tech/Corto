"use client"

import { cn } from "@workspace/ui/lib/utils"
import {
  ArrowUpRightIcon,
  CloudUploadIcon,
  LinkIcon,
  MegaphoneIcon,
  PackageIcon,
  SearchIcon,
  ServerIcon,
  ShieldCheckIcon,
  TerminalIcon,
} from "lucide-react"
import { useId, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { useAppUrl } from "@/lib/app-url"

const repositoryUrl = "https://github.com/logical-tech/Corto"
const localSetupExample = `git clone ${repositoryUrl}.git
cd Corto
cp .env.example .env
bun install --frozen-lockfile
bun run --cwd apps/api migrate
bun run dev`

const methodStyles = {
  GET: "bg-success-soft text-success",
  POST: "bg-primary-soft text-primary",
  DELETE: "bg-primary-soft text-primary-hover dark:text-primary",
  PATCH: "bg-destructive/10 text-destructive",
  PUT: "bg-destructive/10 text-destructive",
} as const

type SectionId =
  | "self-host"
  | "authentication"
  | "endpoints"
  | "create"
  | "advertising"
  | "update"
  | "errors"

const includes = (query: string, ...texts: string[]) =>
  texts.join(" ").toLowerCase().includes(query.trim().toLowerCase())

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-[14px] bg-foreground p-5.5 font-mono text-[13px] leading-[22px] text-background dark:bg-muted dark:text-foreground">
      <code>{children}</code>
    </pre>
  )
}

function DocsSearch({
  className,
  onChange,
  placeholder,
  value,
}: {
  className?: string
  onChange: (value: string) => void
  placeholder: string
  value: string
}) {
  const id = useId()

  return (
    <form
      className={cn(
        "flex h-16 w-full max-w-[640px] items-center gap-3 rounded-full bg-background pr-2.5 pl-7 shadow-[0_6px_20px_rgb(0_0_0/0.1)] ring-1 ring-border-soft focus-within:ring-2 focus-within:ring-ring/40",
        className
      )}
      onSubmit={(event) => {
        event.preventDefault()
        document.querySelector("[data-doc-result]")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }}
      role="search"
    >
      <label className="sr-only" htmlFor={id}>
        {placeholder}
      </label>
      <input
        className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
      <button
        aria-label={placeholder}
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
        type="submit"
      >
        <SearchIcon aria-hidden="true" className="size-[18px]" />
      </button>
    </form>
  )
}

function useDocs(query: string) {
  const { t } = useTranslation("docs")
  const apiUrl = `${useAppUrl()}/api`
  const endpoints = (
    [
      ["GET", "/api/v1/links", t("listLinks")],
      ["POST", "/api/v1/links", t("docsCreate")],
      ["GET", "/api/v1/links/:id", t("getLinkAnalytics")],
      ["PATCH", "/api/v1/links/:id", t("updateLinkEndpoint")],
      ["DELETE", "/api/v1/links/:id", t("deleteLinkEndpoint")],
      ["PUT", "/api/v1/links/:id/goals", t("manageGoals")],
      ["GET", "/api/v1/advertising", t("getAdvertising")],
      ["PATCH", "/api/v1/advertising", t("configureAdvertising")],
      ["GET", "/api/v1/analytics/summary", t("accountReport")],
      ["POST", "/api/mcp", t("mcpEndpoint")],
    ] as const
  ).filter((row) => includes(query, t("docsEndpoints"), ...row))
  const errors = [
    ["400", t("badRequest"), t("badRequestDescription")],
    ["401", t("unauthorized"), t("unauthorizedDescription")],
    ["404", t("notFound"), t("notFoundDescription")],
  ] as const

  const sections: Record<
    SectionId,
    { title: string; description: string; text: string[]; body?: ReactNode }
  > = {
    "self-host": {
      title: t("selfHost"),
      description: t("selfHostDescription"),
      text: [
        t("localSetup"),
        t("localSetupDescription"),
        t("productionDeploy"),
        t("productionDeployDescription"),
        t("deploymentRequirements"),
        "dokploy coolify docker",
      ],
      body: (
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <article className="flex min-w-0 flex-col gap-3.5 rounded-2xl border border-border p-6">
            <TerminalIcon aria-hidden="true" className="size-6" />
            <h3 className="text-lg font-semibold">{t("localSetup")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("localSetupDescription")}
            </p>
            <Code>{localSetupExample}</Code>
            <a
              className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold hover:underline"
              href={`${repositoryUrl}/blob/main/docs/LOCAL.md`}
              rel="noreferrer"
              target="_blank"
            >
              {t("readLocalGuide")}
              <ArrowUpRightIcon aria-hidden="true" className="size-4" />
            </a>
          </article>
          <article className="flex min-w-0 flex-col gap-3.5 rounded-2xl border border-border p-6">
            <CloudUploadIcon aria-hidden="true" className="size-6" />
            <h3 className="text-lg font-semibold">{t("productionDeploy")}</h3>
            <p className="text-sm leading-[21px] text-muted-foreground">
              {t("productionDeployDescription")}{" "}
              {t("deploymentRequirements")}
            </p>
            {(
              [
                ["DEPLOY.md", t("deployOnDokploy")],
                ["COOLIFY.md", t("deployOnCoolify")],
              ] as const
            ).map(([file, label]) => (
              <a
                className="flex items-center gap-3.5 rounded-xl bg-muted p-4 transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
                href={`${repositoryUrl}/blob/main/docs/${file}`}
                key={file}
                rel="noreferrer"
                target="_blank"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-background">
                  <PackageIcon aria-hidden="true" className="size-[18px]" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-semibold">{label}</span>
                  <span className="text-[13px] text-muted-foreground">
                    {t("composeTemplate")}
                  </span>
                </span>
                <ArrowUpRightIcon aria-hidden="true" className="size-4" />
              </a>
            ))}
          </article>
        </div>
      ),
    },
    authentication: {
      title: t("authentication"),
      description: t("authenticationDescription"),
      text: [],
      body: (
        <Code>{`curl ${apiUrl}/v1/links \\
  -H "x-api-key: $CORTO_API_KEY"`}</Code>
      ),
    },
    endpoints: {
      title: t("docsEndpoints"),
      description: `${t("baseUrl")}: ${apiUrl}/v1`,
      text: [],
      body: endpoints.length ? (
        <div className="flex flex-col gap-3">
          <a
            className="inline-flex w-fit items-center gap-1.5 self-end text-sm font-semibold hover:underline"
            href={`${apiUrl}/openapi.json`}
            rel="noreferrer"
            target="_blank"
          >
            {t("openApi")}
            <ArrowUpRightIcon aria-hidden="true" className="size-4" />
          </a>
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-sm">
              <caption className="sr-only">{t("docsEndpoints")}</caption>
              <thead className="sr-only">
                <tr>
                  <th scope="col">{t("method")}</th>
                  <th scope="col">{t("path")}</th>
                  <th scope="col">{t("use")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {endpoints.map(([method, path, use]) => (
                  <tr
                    className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-4 gap-y-1 px-5 py-3.5 sm:grid-cols-[72px_minmax(0,1fr)_minmax(0,1fr)]"
                    key={`${method}-${path}`}
                  >
                    <td>
                      <span
                        className={cn(
                          "rounded-md px-2 py-1 font-mono text-xs",
                          methodStyles[method]
                        )}
                      >
                        {method}
                      </span>
                    </td>
                    <td className="truncate font-mono">{path}</td>
                    <td className="text-muted-foreground max-sm:col-start-2">
                      {use}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : undefined,
    },
    create: {
      title: t("docsCreate"),
      description: t("createDescription"),
      text: ["slug clickLimit password expiresAt"],
      body: (
        <Code>{`curl -X POST ${apiUrl}/v1/links \\
  -H "x-api-key: $CORTO_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{"url":"https://example.com/catalog"}'`}</Code>
      ),
    },
    advertising: {
      title: t("docsAdvertising"),
      description: t("advertisingDescription"),
      text: ["adsterra"],
      body: (
        <Code>{`curl -X PATCH ${apiUrl}/v1/advertising \\
  -H "x-api-key: $CORTO_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{"enabled":true,"automaticRedirect":false,"delaySeconds":5,"banners":[{"preset":"320x50","script":"https://www.highperformanceformat.com/<key>/invoke.js"}]}'`}</Code>
      ),
    },
    update: {
      title: t("docsUpdate"),
      description: t("updateDescription"),
      text: ["active adFree"],
    },
    errors: {
      title: t("docsErrors"),
      description: t("errorsIntro"),
      text: errors.flat(),
      body: (
        <div className="grid gap-4 sm:grid-cols-3">
          {errors.map(([code, title, description]) => (
            <div
              className="flex flex-col gap-1.5 rounded-[14px] bg-muted p-5"
              key={code}
            >
              <p className="font-mono text-[22px] font-medium text-primary">
                {code}
              </p>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      ),
    },
  }

  const visible = (id: SectionId) => {
    const section = sections[id]
    if (id === "endpoints") return endpoints.length > 0
    return includes(query, section.title, section.description, ...section.text)
  }

  return { t, apiUrl, sections, visible }
}

function NoResults({ query, shown }: { query: string; shown: boolean }) {
  const { t, visible } = useDocs(query)
  if (shown || allSections.some(visible)) return null

  return (
    <p className="py-10 text-center text-muted-foreground" role="status">
      {t("noResults")}
    </p>
  )
}

function DocSections({
  ids,
  query,
}: {
  ids: readonly SectionId[]
  query: string
}) {
  const { sections, visible } = useDocs(query)
  const shown = ids.filter(visible)
  if (!shown.length) return null

  return (
    <div className="flex min-w-0 flex-col gap-14">
      {shown.map((id, index) => (
        <section
          aria-labelledby={`${id}-title`}
          className="flex scroll-mt-6 flex-col gap-5"
          data-doc-result={index === 0 && query ? "" : undefined}
          id={id}
          key={id}
        >
          <h2
            className="text-[28px] font-bold tracking-[-0.018em]"
            id={`${id}-title`}
          >
            {sections[id].title}
          </h2>
          <p className="text-pretty text-muted-foreground">
            {sections[id].description}
          </p>
          {sections[id].body}
        </section>
      ))}
    </div>
  )
}

const allSections = [
  "self-host",
  "authentication",
  "endpoints",
  "create",
  "advertising",
  "update",
  "errors",
] as const

export function DocumentationContent() {
  const { t } = useTranslation("docs")
  const [query, setQuery] = useState("")

  return (
    <>
      <section className="flex flex-col items-center gap-4 bg-muted px-5 pt-18 pb-16 text-center sm:px-8">
        <p className="rounded-full bg-background px-3.5 py-1.5 text-[13px] font-semibold">
          {t("docsTitle")}
        </p>
        <h1 className="text-4xl font-bold tracking-[-0.03em] text-balance sm:text-5xl">
          {t("heroTitle")}
        </h1>
        <p className="max-w-[600px] text-lg leading-[26px] text-pretty text-muted-foreground">
          {t("docsDescription")}
        </p>
        <DocsSearch
          className="mt-2"
          onChange={setQuery}
          placeholder={t("searchDocs")}
          value={query}
        />
      </section>
      <div className="mx-auto flex max-w-[1440px] gap-20 px-5 pt-16 pb-24 sm:px-8 lg:px-20">
        <nav
          aria-label={t("onThisPage")}
          className="sticky top-6 flex h-fit w-[220px] shrink-0 flex-col gap-1 max-lg:hidden"
        >
          <p className="mb-1 text-xs font-bold tracking-[0.05em] text-subtle-foreground">
            {t("onThisPage")}
          </p>
          <TocLinks />
        </nav>
        <div className="min-w-0 flex-1">
          <DocSections ids={allSections} query={query} />
          <NoResults query={query} shown={false} />
        </div>
      </div>
    </>
  )
}

function TocLinks() {
  const { sections } = useDocs("")
  const [current, setCurrent] = useState<SectionId>(allSections[0])

  return allSections.map((id) => (
    <a
      aria-current={current === id ? "location" : undefined}
      className={cn(
        "rounded-[10px] px-3 py-2 text-[15px] transition-colors hover:bg-muted",
        current === id
          ? "bg-muted font-semibold text-foreground"
          : "font-medium text-muted-foreground"
      )}
      href={`#${id}`}
      key={id}
      onClick={() => setCurrent(id)}
    >
      {sections[id].title}
    </a>
  ))
}

export default function DashboardDocsPage() {
  const { t } = useTranslation("docs")
  const [query, setQuery] = useState("")
  const topics = (
    [
      ["self-host", ServerIcon, t("selfHost"), t("selfHostCard")],
      [
        "authentication",
        ShieldCheckIcon,
        t("authentication"),
        t("authenticationCard"),
      ],
      ["endpoints", LinkIcon, t("linksApi"), t("linksApiCard")],
      ["advertising", MegaphoneIcon, t("advertising"), t("advertisingCard")],
    ] as const
  ).filter(([, , title, description]) => includes(query, title, description))

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-10">
      <header className="flex flex-col items-center gap-5 pt-10 pb-2 text-center">
        <h1 className="text-3xl font-bold tracking-[-0.025em] text-balance sm:text-[40px]">
          {t("helpTitle")}
        </h1>
        <DocsSearch
          onChange={setQuery}
          placeholder={t("searchGuides")}
          value={query}
        />
      </header>

      {topics.length ? (
        <nav
          aria-label={t("topics")}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {topics.map(([id, Icon, title, description]) => (
            <a
              className="flex flex-col gap-3 rounded-2xl border border-border p-6 transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
              href={`#${id}`}
              key={id}
            >
              <Icon aria-hidden="true" className="size-7" strokeWidth={1.5} />
              <span className="text-[17px] font-semibold">{title}</span>
              <span className="text-sm leading-5 text-muted-foreground">
                {description}
              </span>
            </a>
          ))}
        </nav>
      ) : null}

      <DocSections ids={["endpoints"]} query={query} />

      <CreatePanel query={query} />

      <DocSections
        ids={["self-host", "authentication", "advertising", "update", "errors"]}
        query={query}
      />
      <NoResults query={query} shown={topics.length > 0} />
    </div>
  )
}

function CreatePanel({ query }: { query: string }) {
  const { sections, visible } = useDocs(query)
  if (!visible("create")) return null

  return (
    <section
      aria-labelledby="create-title"
      className="grid scroll-mt-6 items-center gap-8 rounded-[20px] bg-muted p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]"
      id="create"
    >
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold" id="create-title">
          {sections.create.title}
        </h2>
        <p className="leading-[23px] text-pretty text-muted-foreground">
          {sections.create.description}
        </p>
      </div>
      <div className="min-w-0">{sections.create.body}</div>
    </section>
  )
}
