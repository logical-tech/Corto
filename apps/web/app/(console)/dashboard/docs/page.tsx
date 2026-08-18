"use client"

import { Badge } from "@workspace/ui/components/badge"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { ArrowUpRightIcon, CloudIcon, TerminalIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useAppUrl } from "@/lib/app-url"

const repositoryUrl = "https://github.com/logical-tech/Corto"
const localSetupExample = `git clone ${repositoryUrl}.git
cd Corto
cp .env.example .env
bun install --frozen-lockfile
bun run --cwd apps/api migrate
bun run dev`

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-2xl bg-foreground p-6 font-mono text-sm leading-7 text-background shadow-xl">
      <code>{children}</code>
    </pre>
  )
}

export function DocumentationContent() {
  const { t } = useTranslation("docs")
  const apiUrl = `${useAppUrl()}/api`
  const authenticationExample = `curl ${apiUrl}/v1/links \\
  -H "x-api-key: $CORTO_API_KEY"`
  const createExample = `curl -X POST ${apiUrl}/v1/links \\
  -H "x-api-key: $CORTO_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{"url":"https://example.com/catalog"}'`
  const advertisingExample = `curl -X PATCH ${apiUrl}/v1/advertising \\
  -H "x-api-key: $CORTO_API_KEY" \\
  -H "content-type: application/json" \\
  -d '{"enabled":true,"automaticRedirect":false,"delaySeconds":5,"banners":[{"preset":"320x50","script":"https://www.highperformanceformat.com/<key>/invoke.js"}]}'`
  const endpoints = [
    ["GET", "/api/v1/links", t("listLinks")],
    ["POST", "/api/v1/links", t("docsCreate")],
    ["GET", "/api/v1/links/:id", t("getLinkAnalytics")],
    ["PUT", "/api/v1/links/:id/goals", t("manageGoals")],
    ["GET", "/api/v1/advertising", t("getAdvertising")],
    ["PATCH", "/api/v1/advertising", t("configureAdvertising")],
    ["PATCH", "/api/v1/links/:id", t("updateLinkEndpoint")],
    ["DELETE", "/api/v1/links/:id", t("deleteLinkEndpoint")],
    ["GET", "/api/v1/analytics/summary", t("accountReport")],
  ] as const

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <header className="max-w-3xl">
        <Badge variant="outline">{t("selfHost")}</Badge>
        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
          {t("docsTitle")}
        </h1>
        <p className="mt-5 text-lg leading-8 text-pretty text-muted-foreground">
          {t("docsDescription")}
        </p>
      </header>

      <section className="border-y py-10 sm:py-12">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-[-0.025em] text-balance">
            {t("selfHost")}
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            {t("selfHostDescription")}
          </p>
        </div>
        <div className="mt-7 grid gap-6 lg:grid-cols-2">
          <Card className="bg-muted/35 shadow-none">
            <CardHeader>
              <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <TerminalIcon aria-hidden="true" className="size-5" />
              </div>
              <CardTitle>{t("localSetup")}</CardTitle>
              <CardDescription>{t("localSetupDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <Code>{localSetupExample}</Code>
              <a
                href={`${repositoryUrl}/blob/main/docs/LOCAL.md`}
                target="_blank"
                rel="noreferrer"
                className={`${buttonVariants({ variant: "outline" })} w-fit`}
              >
                {t("readLocalGuide")}
                <ArrowUpRightIcon data-icon="inline-end" />
              </a>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <CloudIcon aria-hidden="true" className="size-5" />
              </div>
              <CardTitle>{t("productionDeploy")}</CardTitle>
              <CardDescription>
                {t("productionDeployDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <p className="text-sm leading-6 text-muted-foreground">
                {t("deploymentRequirements")}
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`${repositoryUrl}/blob/main/docs/DEPLOY.md`}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "outline" })}
                >
                  {t("deployOnDokploy")}
                  <ArrowUpRightIcon data-icon="inline-end" />
                </a>
                <a
                  href={`${repositoryUrl}/blob/main/docs/COOLIFY.md`}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "outline" })}
                >
                  {t("deployOnCoolify")}
                  <ArrowUpRightIcon data-icon="inline-end" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("baseUrl")}</CardTitle>
          <CardDescription>{apiUrl}/v1</CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href={`${apiUrl}/openapi.json`}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            {t("openApi")}
            <ArrowUpRightIcon data-icon="inline-end" />
          </a>
        </CardContent>
      </Card>

      <section className="grid gap-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.025em]">
            {t("authentication")}
          </h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            {t("authenticationDescription")}
          </p>
        </div>
        <Code>{authenticationExample}</Code>
      </section>

      <section className="grid gap-6">
        <h2 className="text-2xl font-semibold tracking-[-0.025em]">
          {t("docsEndpoints")}
        </h2>
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("method")}</TableHead>
                <TableHead>{t("path")}</TableHead>
                <TableHead>{t("use")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoints.map(([method, path, description]) => (
                <TableRow key={`${method}-${path}`}>
                  <TableCell>
                    <Badge variant={method === "GET" ? "secondary" : "outline"}>
                      {method}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{path}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="grid gap-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.025em]">
            {t("docsCreate")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("createDescription")}</p>
        </div>
        <Code>{createExample}</Code>
      </section>

      <section className="grid gap-6 border-t border-border pt-10">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.025em]">
            {t("docsAdvertising")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("advertisingDescription")}
          </p>
        </div>
        <Code>{advertisingExample}</Code>
      </section>

      <section className="grid gap-6 border-t border-border pt-10">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.025em]">
            {t("docsUpdate")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("updateDescription")}</p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.025em]">
            {t("docsErrors")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("errorsDescription")}</p>
        </div>
      </section>
    </div>
  )
}

export default function DashboardDocsPage() {
  return <DocumentationContent />
}
