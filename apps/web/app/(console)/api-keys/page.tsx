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
import { Button } from "@workspace/ui/components/button"
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/toast"
import {
  CopyIcon,
  KeyRoundIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { api, type ApiKey } from "@/lib/api"
import { formatDate } from "@/lib/format"

export default function ApiKeysPage() {
  const { i18n, t } = useTranslation("apiKeys")
  const locale = i18n.resolvedLanguage ?? i18n.language
  const client = useQueryClient()
  const [nameError, setNameError] = useState("")
  const [secret, setSecret] = useState("")
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
      setSecret(apiKey.key ?? "")
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
      form.reset()
    } catch {
      return
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-balance">
          {t("apiKeys")}
        </h1>
        <p className="max-w-2xl text-pretty text-muted-foreground">
          {t("apiKeysDescription")}
        </p>
      </header>

      {secret ? (
        <Alert className="border-primary/20 bg-primary/[0.04]">
          <KeyRoundIcon />
          <AlertTitle>{t("copyNewKey")}</AlertTitle>
          <AlertDescription>
            <p>{t("keyShownOnce")}</p>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-background p-2 shadow-sm ring-1 ring-foreground/5">
              <code className="min-w-0 flex-1 overflow-x-auto px-2 font-mono text-xs sm:text-sm">
                {secret}
              </code>
              <Button
                variant="secondary"
                size="icon"
                aria-label={t("copyApiKey")}
                onClick={() =>
                  navigator.clipboard
                    .writeText(secret)
                    .then(() =>
                      toast.add({ title: t("apiKeyCopied"), type: "success" })
                    )
                }
              >
                <CopyIcon />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="grid items-start gap-6 lg:grid-cols-[minmax(18rem,0.65fr)_minmax(0,1.35fr)]">
        <Card className="surface-shadow h-fit">
          <CardHeader>
            <CardTitle>{t("newApiKey")}</CardTitle>
            <CardDescription>{t("apiKeyPermissions")}</CardDescription>
          </CardHeader>
          <CardContent>
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
            {createKey.isError ? (
              <Alert variant="destructive" className="mt-5">
                <TriangleAlertIcon />
                <AlertTitle>{t("apiKeyNotCreated")}</AlertTitle>
                <AlertDescription>{createKey.error.message}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>

        <Card className="surface-shadow">
          <CardHeader>
            <CardTitle>{t("activeKeys")}</CardTitle>
            <CardDescription>{t("activeKeysDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {keys.isPending ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            ) : null}
            {keys.isError ? (
              <Alert variant="destructive">
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
              <div className="divide-y">
                {keys.data.keys.map((key) => (
                  <article
                    key={key.id}
                    className="grid gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                      <KeyRoundIcon className="size-4" />
                    </div>
                    <div className="min-w-0 sm:col-start-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-medium">{key.name}</h2>
                        <Badge variant="secondary">
                          {key.permissions?.join(" · ") || "read · write"}
                        </Badge>
                      </div>
                      <p className="mt-2 truncate font-mono text-xs text-muted-foreground">
                        {key.start || key.prefix || "••••••••"}
                        {key.lastFour ? `••••${key.lastFour}` : ""}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t("createdAt", {
                          date: formatDate(key.createdAt, locale),
                        })}{" "}
                        ·{" "}
                        {t("lastUsed", {
                          date: formatDate(key.lastUsedAt, locale),
                        })}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant="ghost"
                            className="w-fit sm:col-start-3"
                          />
                        }
                      >
                        <Trash2Icon data-icon="inline-start" />
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
                  </article>
                ))}
              </div>
            ) : null}
            {keys.isSuccess && !keys.data.keys.length ? (
              <Empty className="min-h-64 border">
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
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
