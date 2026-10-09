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
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/toast"
import {
  ArrowRightIcon,
  CopyIcon,
  KeyRoundIcon,
  PartyPopperIcon,
  TerminalIcon,
  TriangleAlertIcon,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { api, type ApiKey } from "@/lib/api"
import { useAppUrl } from "@/lib/app-url"
import { formatDate } from "@/lib/format"

export default function ApiKeysPage() {
  const { i18n, t } = useTranslation("apiKeys")
  const locale = i18n.resolvedLanguage ?? i18n.language
  const client = useQueryClient()
  const appUrl = useAppUrl()
  const [createOpen, setCreateOpen] = useState(false)
  const [nameError, setNameError] = useState("")
  const [secret, setSecret] = useState<{ name: string; key: string } | null>(
    null
  )
  const keys = useQuery({
    queryKey: ["api-keys"],
    queryFn: ({ signal }) =>
      api<{ keys: ApiKey[] }>("/v1/api-keys", { signal }),
  })
  const createKey = useMutation({
    mutationFn: (name: string) =>
      api<{ apiKey: ApiKey }>("/v1/api-keys", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onSuccess: async ({ apiKey }) => {
      setSecret({ name: apiKey.name, key: apiKey.key ?? "" })
      setCreateOpen(false)
      await client.invalidateQueries({ queryKey: ["api-keys"] })
      toast.add({ title: t("apiKeyCreated"), type: "success" })
    },
  })
  const removeKey = useMutation({
    mutationFn: (id: string) =>
      api<void>(`/v1/api-keys/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["api-keys"] })
      toast.add({ title: t("apiKeyRevoked"), type: "success" })
    },
  })

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const result = z
      .string()
      .trim()
      .min(2, t("invalidKeyName"))
      .max(100)
      .safeParse(new FormData(form).get("name"))
    if (!result.success) {
      setNameError(result.error.issues[0]?.message ?? t("invalidValue"))
      ;(form.elements.namedItem("name") as HTMLElement | null)?.focus()
      return
    }
    setNameError("")
    try {
      await createKey.mutateAsync(result.data)
    } catch {
      return
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[32px] leading-tight font-bold tracking-[-0.6px] text-balance">
            {t("apiKeys")}
          </h1>
          <p className="max-w-2xl text-base text-pretty text-muted-foreground">
            {t("apiKeysDescription")}
          </p>
        </div>
        <Button
          size="lg"
          className="w-full px-6 text-base sm:w-fit"
          onClick={() => {
            createKey.reset()
            setNameError("")
            setCreateOpen(true)
          }}
        >
          <KeyRoundIcon data-icon="inline-start" />
          {t("createApiKey")}
        </Button>
      </header>

      {secret ? (
        <section
          aria-live="polite"
          className="flex flex-col gap-4 rounded-2xl bg-primary-soft p-5 sm:flex-row sm:items-center"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-background text-primary">
            <PartyPopperIcon className="size-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <p className="font-semibold">
              {t("keyReady", { name: secret.name })}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("keyShownOnce")}
            </p>
          </div>
          <div className="flex min-w-0 items-center gap-3 rounded-[10px] border border-border bg-background py-1 pr-1 pl-4 sm:max-w-[50%]">
            <code className="min-w-0 flex-1 truncate font-mono text-sm">
              {secret.key}
            </code>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("copyApiKey")}
              onClick={() =>
                navigator.clipboard
                  .writeText(secret.key)
                  .then(() =>
                    toast.add({ title: t("apiKeyCopied"), type: "success" })
                  )
              }
            >
              <CopyIcon />
            </Button>
          </div>
        </section>
      ) : null}

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="flex min-w-0 flex-col gap-1">
          <h2 className="text-[22px] font-semibold">{t("activeKeys")}</h2>
          <p className="text-sm text-muted-foreground">
            {keys.isSuccess
              ? t("activeKeysSummary", { count: keys.data.keys.length })
              : t("activeKeysDescription")}
          </p>
          <div className="pt-3">
            {keys.isPending ? (
              <div className="flex flex-col gap-3 py-5">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : null}
            {keys.isError ? (
              <Alert variant="destructive" className="mt-2">
                <TriangleAlertIcon />
                <AlertTitle>{t("apiKeysUnavailable")}</AlertTitle>
                <AlertDescription>
                  {t("dashboardErrorDescription")}
                </AlertDescription>
                <Button
                  variant="outline"
                  className="mt-3 w-fit"
                  onClick={() => keys.refetch()}
                >
                  {t("retry")}
                </Button>
              </Alert>
            ) : null}
            {keys.isSuccess && keys.data.keys.length ? (
              <ul>
                {keys.data.keys.map((key) => (
                  <li
                    key={key.id}
                    className="flex items-center gap-4 border-b border-border-soft py-5"
                  >
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <KeyRoundIcon className="size-5" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{key.name}</h3>
                        <span className="rounded-full bg-muted px-2 py-[3px] text-xs font-semibold text-muted-foreground">
                          {key.permissions?.join(" · ") || "read · write"}
                        </span>
                      </div>
                      <p className="flex flex-wrap gap-x-2 text-[13px] text-muted-foreground">
                        <span className="truncate font-mono">
                          {key.start || key.prefix || "••••••••"}
                          {key.lastFour ? `••••${key.lastFour}` : ""}
                        </span>
                        <span>
                          ·{" "}
                          {t("createdAt", {
                            date: formatDate(key.createdAt, locale),
                          })}
                        </span>
                        <span>
                          ·{" "}
                          {t("lastUsed", {
                            date: formatDate(key.lastUsedAt, locale),
                          })}
                        </span>
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 font-semibold"
                          />
                        }
                      >
                        {t("revoke")}
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t("revokeKeyQuestion", { name: key.name })}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("revokeKeyWarning")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            disabled={removeKey.isPending}
                            onClick={() => removeKey.mutate(key.id)}
                          >
                            {t("revokeKey")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </li>
                ))}
              </ul>
            ) : null}
            {keys.isSuccess && !keys.data.keys.length ? (
              <Empty className="mt-2 min-h-64 border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <KeyRoundIcon />
                  </EmptyMedia>
                  <EmptyTitle>{t("noActiveApiKeys")}</EmptyTitle>
                  <EmptyDescription>
                    {t("noActiveApiKeysDescription")}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : null}
            {removeKey.isError ? (
              <Alert variant="destructive" className="mt-5">
                <TriangleAlertIcon />
                <AlertTitle>{t("apiKeyNotRevoked")}</AlertTitle>
                <AlertDescription>{removeKey.error.message}</AlertDescription>
              </Alert>
            ) : null}
          </div>
        </section>

        <aside className="flex min-w-0 flex-col gap-4 rounded-2xl bg-muted p-6">
          <TerminalIcon className="size-6" aria-hidden />
          <h2 className="text-lg font-semibold">{t("headerTitle")}</h2>
          <p className="text-sm leading-5 text-muted-foreground">
            {t("headerDescription")}
          </p>
          <pre className="overflow-x-auto rounded-xl bg-foreground p-5 font-mono text-[13px] leading-6 text-background">
            <code>
              {`curl ${appUrl}/api/v1/links \\\n  -H "x-api-key: $CORTO_API_KEY"`}
            </code>
          </pre>
          <Link
            href="/dashboard/docs"
            className="flex w-fit items-center gap-1.5 rounded-sm text-sm font-semibold underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {t("readApiDocs")}
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </aside>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("newApiKey")}</DialogTitle>
            <DialogDescription>{t("apiKeyPermissions")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
            <FieldGroup>
              <Field data-invalid={Boolean(nameError)}>
                <FieldLabel htmlFor="key-name">{t("name")}</FieldLabel>
                <Input
                  id="key-name"
                  name="name"
                  placeholder={t("keyNamePlaceholder")}
                  autoComplete="off"
                  aria-invalid={Boolean(nameError)}
                />
                <FieldError>{nameError}</FieldError>
              </Field>
            </FieldGroup>
            {createKey.isError ? (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertTitle>{t("apiKeyNotCreated")}</AlertTitle>
                <AlertDescription>{createKey.error.message}</AlertDescription>
              </Alert>
            ) : null}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={createKey.isPending}
            >
              {createKey.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <KeyRoundIcon data-icon="inline-start" />
              )}
              {t("createApiKey")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
