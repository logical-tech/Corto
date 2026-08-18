"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Switch } from "@workspace/ui/components/switch"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import { toast } from "@workspace/ui/components/toast"
import {
  BellRingIcon,
  Clock3Icon,
  MegaphoneIcon,
  MessageCircleIcon,
  PlusIcon,
  SendIcon,
  ShieldCheckIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import {
  adsterraBannerPresets,
  api,
  type AdsterraBannerPreset,
  type AdvertisingSettings,
  type AppSettings,
} from "@/lib/api"

export default function SettingsPage() {
  const { t } = useTranslation("settings")
  const client = useQueryClient()
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("")
  const [telegramBotToken, setTelegramBotToken] = useState("")
  const [telegramChatId, setTelegramChatId] = useState("")
  const [adsterraPreset, setAdsterraPreset] =
    useState<AdsterraBannerPreset>("320x50")
  const [adsterraSnippet, setAdsterraSnippet] = useState("")
  const [delayDraft, setDelayDraft] = useState<string | null>(null)
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: ({ signal }) => api<AppSettings>("/v1/settings", { signal }),
    retry: false,
  })
  const updateSettings = useMutation({
    mutationFn: (
      values: Partial<{
        registrationEnabled: boolean
        discordWebhookUrl: string | null
        telegramBotToken: string | null
        telegramChatId: string | null
      }>
    ) =>
      api<AppSettings>("/v1/settings", {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: (data, values) => {
      client.setQueryData(["settings"], data)
      client.setQueryData(["registration"], {
        enabled: data.registrationEnabled,
      })
      if (Object.hasOwn(values, "discordWebhookUrl")) setDiscordWebhookUrl("")
      if (Object.hasOwn(values, "telegramBotToken")) {
        setTelegramBotToken("")
        setTelegramChatId("")
      }
      toast.add({ title: t("settingUpdated"), type: "success" })
    },
  })
  const advertising = useQuery({
    queryKey: ["advertising"],
    queryFn: ({ signal }) =>
      api<AdvertisingSettings>("/v1/advertising", { signal }),
    retry: false,
  })
  const updateAdvertising = useMutation({
    mutationFn: (
      values: Partial<{
        enabled: boolean
        automaticRedirect: boolean
        delaySeconds: number
        banners: Array<{ preset: AdsterraBannerPreset; script: string }>
      }>
    ) =>
      api<AdvertisingSettings>("/v1/advertising", {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: (data) => {
      client.setQueryData(["advertising"], data)
      setDelayDraft(null)
      toast.add({ title: t("settingUpdated"), type: "success" })
    },
  })
  const advertisingSettings = advertising.data
  const delayValue =
    delayDraft ?? String(advertisingSettings?.delaySeconds ?? 5)
  const duplicatePreset = Boolean(
    advertisingSettings?.banners.some(
      (banner) => banner.preset === adsterraPreset
    )
  )
  const bannerInputs = (banners: AdvertisingSettings["banners"]) =>
    banners.map((banner) => ({
      preset: banner.preset,
      script: banner.scriptUrl,
    }))

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">
          {t("settings")}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {t("settingsDescription")}
        </p>
      </header>

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{t("advertising")}</CardTitle>
              <CardDescription>{t("advertisingDescription")}</CardDescription>
            </div>
            <MegaphoneIcon className="size-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-7">
          {advertising.isPending ? <Skeleton className="h-96 w-full" /> : null}
          {advertising.isError ? (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>{t("advertisingUnavailable")}</AlertTitle>
              <AlertDescription>
                {t("advertisingUnavailableDescription")}
              </AlertDescription>
              <Button
                className="mt-3 w-fit"
                onClick={() => advertising.refetch()}
                variant="outline"
              >
                {t("retry")}
              </Button>
            </Alert>
          ) : null}
          {advertisingSettings ? (
            <>
              <FieldGroup className="gap-6">
                <Field orientation="responsive">
                  <Switch
                    aria-label={t("enableAdvertising")}
                    checked={advertisingSettings.enabled}
                    disabled={
                      updateAdvertising.isPending ||
                      advertisingSettings.banners.length === 0
                    }
                    id="advertising-enabled"
                    onCheckedChange={(enabled) =>
                      updateAdvertising.mutate({ enabled })
                    }
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="advertising-enabled">
                      {t("enableAdvertising")}
                    </FieldLabel>
                    <FieldDescription>
                      {advertisingSettings.banners.length
                        ? t("enableAdvertisingDescription")
                        : t("advertisingNeedsBanner")}
                    </FieldDescription>
                  </FieldContent>
                </Field>

                <Field orientation="responsive">
                  <Switch
                    aria-label={t("automaticRedirect")}
                    checked={advertisingSettings.automaticRedirect}
                    disabled={updateAdvertising.isPending}
                    id="automatic-redirect"
                    onCheckedChange={(automaticRedirect) =>
                      updateAdvertising.mutate({ automaticRedirect })
                    }
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="automatic-redirect">
                      {t("automaticRedirect")}
                    </FieldLabel>
                    <FieldDescription>
                      {t("automaticRedirectDescription")}
                    </FieldDescription>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel>{t("advertisingNetwork")}</FieldLabel>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-primary/5 p-4 ring-1 ring-primary/25">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">AdsTerra</p>
                        <Badge>{t("available")}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t("adsterraDescription")}
                      </p>
                    </div>
                    <div
                      aria-disabled="true"
                      className="rounded-2xl bg-muted/50 p-4 opacity-70 ring-1 ring-border/70"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">Google AdSense</p>
                        <Badge variant="outline">{t("soon")}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t("adsenseDescription")}
                      </p>
                    </div>
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="advertising-delay">
                    {t("advertisingDelay")}
                  </FieldLabel>
                  <FieldDescription>
                    {t("advertisingDelayDescription")}
                  </FieldDescription>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      className="h-11 max-w-40 font-mono tabular-nums"
                      id="advertising-delay"
                      inputMode="numeric"
                      max="60"
                      min="1"
                      onChange={(event) => setDelayDraft(event.target.value)}
                      step="1"
                      type="number"
                      value={delayValue}
                    />
                    <Button
                      disabled={
                        updateAdvertising.isPending ||
                        !Number.isInteger(Number(delayValue)) ||
                        Number(delayValue) < 1 ||
                        Number(delayValue) > 60
                      }
                      onClick={() =>
                        updateAdvertising.mutate({
                          delaySeconds: Number(delayValue),
                        })
                      }
                      type="button"
                      variant="outline"
                    >
                      <Clock3Icon data-icon="inline-start" />
                      {t("updateDelay")}
                    </Button>
                  </div>
                </Field>
              </FieldGroup>

              <div className="border-t pt-7">
                <div className="flex flex-col gap-1">
                  <h3 className="font-medium">{t("adsterraBanners")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("adsterraBannersDescription")}
                  </p>
                </div>

                {advertisingSettings.banners.length ? (
                  <ol className="mt-4 overflow-hidden rounded-2xl bg-muted/50 ring-1 ring-border/70">
                    {advertisingSettings.banners.map((banner) => {
                      const preset = adsterraBannerPresets.find(
                        (item) => item.id === banner.preset
                      )

                      return (
                        <li
                          className="flex min-h-16 items-center gap-3 border-b px-4 py-3 last:border-b-0"
                          key={banner.preset}
                        >
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card font-mono text-xs font-medium tabular-nums shadow-sm">
                            {preset?.width}×{preset?.height}
                          </div>
                          <p className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                            {banner.scriptUrl}
                          </p>
                          <Button
                            aria-label={t("removeBanner")}
                            className="size-11 text-muted-foreground hover:text-destructive"
                            disabled={updateAdvertising.isPending}
                            onClick={() =>
                              updateAdvertising.mutate({
                                banners: bannerInputs(
                                  advertisingSettings.banners.filter(
                                    (item) => item.preset !== banner.preset
                                  )
                                ),
                              })
                            }
                            size="icon"
                            title={t("removeBanner")}
                            type="button"
                            variant="ghost"
                          >
                            <Trash2Icon />
                          </Button>
                        </li>
                      )
                    })}
                  </ol>
                ) : null}

                <form
                  className="mt-5"
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (!adsterraSnippet.trim() || duplicatePreset) return
                    updateAdvertising.mutate(
                      {
                        banners: [
                          ...bannerInputs(advertisingSettings.banners),
                          { preset: adsterraPreset, script: adsterraSnippet },
                        ],
                      },
                      { onSuccess: () => setAdsterraSnippet("") }
                    )
                  }}
                >
                  <FieldGroup className="gap-4">
                    <Field>
                      <FieldLabel>{t("bannerPreset")}</FieldLabel>
                      <Select
                        onValueChange={(value) =>
                          setAdsterraPreset(value as AdsterraBannerPreset)
                        }
                        value={adsterraPreset}
                      >
                        <SelectTrigger className="h-11 w-full sm:w-52">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="start">
                          <SelectGroup>
                            {adsterraBannerPresets.map((preset) => (
                              <SelectItem key={preset.id} value={preset.id}>
                                {preset.width} × {preset.height}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field data-invalid={duplicatePreset}>
                      <FieldLabel htmlFor="adsterra-snippet">
                        {t("adsterraCode")}
                      </FieldLabel>
                      <FieldDescription>
                        {t("adsterraCodeDescription")}
                      </FieldDescription>
                      <Textarea
                        aria-invalid={duplicatePreset}
                        id="adsterra-snippet"
                        onChange={(event) =>
                          setAdsterraSnippet(event.target.value)
                        }
                        placeholder="https://www.highperformanceformat.com/.../invoke.js"
                        value={adsterraSnippet}
                      />
                    </Field>
                    <Button
                      className="w-full sm:w-fit"
                      disabled={
                        updateAdvertising.isPending ||
                        !adsterraSnippet.trim() ||
                        duplicatePreset
                      }
                      type="submit"
                    >
                      <PlusIcon data-icon="inline-start" />
                      {t("addBanner")}
                    </Button>
                  </FieldGroup>
                </form>
              </div>
            </>
          ) : null}

          {updateAdvertising.isError ? (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>{t("changesNotSaved")}</AlertTitle>
              <AlertDescription>
                {updateAdvertising.error.message}
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {settings.isPending || settings.isSuccess ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("access")}</CardTitle>
            <CardDescription>{t("accessDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {settings.isPending ? <Skeleton className="h-24 w-full" /> : null}
            {settings.isSuccess ? (
              <div className="flex items-center justify-between gap-6 rounded-2xl bg-muted p-4">
                <div className="flex min-w-0 gap-3">
                  <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">{t("allowRegistrations")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("allowRegistrationsDescription")}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.data.registrationEnabled}
                  disabled={updateSettings.isPending}
                  aria-label={t("allowRegistrations")}
                  onCheckedChange={(registrationEnabled) =>
                    updateSettings.mutate({ registrationEnabled })
                  }
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {settings.isPending || settings.isSuccess ? (
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{t("notifications")}</CardTitle>
                <CardDescription>
                  {t("notificationsDescription")}
                </CardDescription>
              </div>
              <BellRingIcon className="size-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="grid gap-7">
            {settings.isPending ? <Skeleton className="h-72 w-full" /> : null}
            {settings.isSuccess ? (
              <>
                <form
                  className="grid gap-4 border-b pb-7"
                  onSubmit={(event) => {
                    event.preventDefault()
                    updateSettings.mutate({ discordWebhookUrl })
                  }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                        <MessageCircleIcon className="size-4" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{t("discord")}</p>
                          {settings.data.discordConfigured ? (
                            <Badge variant="secondary">{t("connected")}</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t("discordDescription")}
                        </p>
                      </div>
                    </div>
                    {settings.data.discordConfigured ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={updateSettings.isPending}
                        onClick={() =>
                          updateSettings.mutate({ discordWebhookUrl: null })
                        }
                      >
                        {t("disconnect")}
                      </Button>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Label className="sr-only" htmlFor="discord-webhook">
                      {t("discordWebhookUrl")}
                    </Label>
                    <Input
                      id="discord-webhook"
                      type="url"
                      value={discordWebhookUrl}
                      placeholder="https://discord.com/api/webhooks/..."
                      autoComplete="off"
                      onChange={(event) =>
                        setDiscordWebhookUrl(event.target.value)
                      }
                    />
                    <Button
                      type="submit"
                      disabled={
                        updateSettings.isPending || !discordWebhookUrl.trim()
                      }
                    >
                      <SendIcon data-icon="inline-start" />
                      {t("save")}
                    </Button>
                  </div>
                </form>

                <form
                  className="grid gap-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    updateSettings.mutate({ telegramBotToken, telegramChatId })
                  }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                        <SendIcon className="size-4" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{t("telegram")}</p>
                          {settings.data.telegramConfigured ? (
                            <Badge variant="secondary">{t("connected")}</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t("telegramDescription")}
                        </p>
                      </div>
                    </div>
                    {settings.data.telegramConfigured ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={updateSettings.isPending}
                        onClick={() =>
                          updateSettings.mutate({
                            telegramBotToken: null,
                            telegramChatId: null,
                          })
                        }
                      >
                        {t("disconnect")}
                      </Button>
                    ) : null}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="telegram-token">
                        {t("telegramBotToken")}
                      </Label>
                      <Input
                        id="telegram-token"
                        type="password"
                        value={telegramBotToken}
                        autoComplete="new-password"
                        onChange={(event) =>
                          setTelegramBotToken(event.target.value)
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="telegram-chat-id">
                        {t("telegramChatId")}
                      </Label>
                      <Input
                        id="telegram-chat-id"
                        value={telegramChatId}
                        autoComplete="off"
                        onChange={(event) =>
                          setTelegramChatId(event.target.value)
                        }
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-fit"
                    disabled={
                      updateSettings.isPending ||
                      !telegramBotToken.trim() ||
                      !telegramChatId.trim()
                    }
                  >
                    <SendIcon data-icon="inline-start" />
                    {t("save")}
                  </Button>
                </form>
              </>
            ) : null}

            {updateSettings.isError ? (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertTitle>{t("changesNotSaved")}</AlertTitle>
                <AlertDescription>
                  {updateSettings.error.message}
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
