"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
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
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Switch } from "@workspace/ui/components/switch"
import { Textarea } from "@workspace/ui/components/textarea"
import { toast } from "@workspace/ui/components/toast"
import { cn } from "@workspace/ui/lib/utils"
import {
  CircleDashedIcon,
  LockIcon,
  MegaphoneIcon,
  MessageCircleIcon,
  MinusIcon,
  PlusIcon,
  SendIcon,
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
import { useAppUrl } from "@/lib/app-url"

type AdvertisingDraft = Pick<
  AdvertisingSettings,
  "enabled" | "automaticRedirect" | "delaySeconds"
>

const darkButton = "bg-foreground text-background hover:bg-foreground/85"
const presetLabel = (id: AdsterraBannerPreset) => id.replace("x", " × ")

function SettingRow({
  id,
  title,
  description,
  control,
}: {
  id: string
  title: string
  description: string
  control: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor={id} className="font-semibold">
          {title}
        </label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {control}
    </div>
  )
}

function SectionTitle({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

function BannerShape({ preset }: { preset: AdsterraBannerPreset }) {
  const size = adsterraBannerPresets.find((item) => item.id === preset)
  if (!size) return null
  const scale = Math.min(40 / size.width, 32 / size.height)
  return (
    <div
      aria-hidden
      className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg bg-muted"
    >
      <div
        className="rounded-[2px] bg-subtle-foreground"
        style={{
          width: Math.max(4, size.width * scale),
          height: Math.max(4, size.height * scale),
        }}
      />
    </div>
  )
}

export default function SettingsPage() {
  const { t } = useTranslation("settings")
  const { t: common } = useTranslation("common")
  const client = useQueryClient()
  const appHost = new URL(useAppUrl()).host
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("")
  const [telegramBotToken, setTelegramBotToken] = useState("")
  const [telegramChatId, setTelegramChatId] = useState("")
  const [adsterraPreset, setAdsterraPreset] =
    useState<AdsterraBannerPreset | null>(null)
  const [adsterraSnippet, setAdsterraSnippet] = useState("")
  const [addingBanner, setAddingBanner] = useState(false)
  const [draft, setDraft] = useState<Partial<AdvertisingDraft>>({})
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
      values: Partial<
        AdvertisingDraft & {
          banners: Array<{ preset: AdsterraBannerPreset; script: string }>
        }
      >
    ) =>
      api<AdvertisingSettings>("/v1/advertising", {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: (data) => {
      client.setQueryData(["advertising"], data)
      toast.add({ title: t("settingUpdated"), type: "success" })
    },
  })
  const saved = advertising.data
  const current: AdvertisingDraft = {
    enabled: draft.enabled ?? saved?.enabled ?? false,
    automaticRedirect:
      draft.automaticRedirect ?? saved?.automaticRedirect ?? false,
    delaySeconds: draft.delaySeconds ?? saved?.delaySeconds ?? 5,
  }
  const dirty = Boolean(
    saved &&
      (current.enabled !== saved.enabled ||
        current.automaticRedirect !== saved.automaticRedirect ||
        current.delaySeconds !== saved.delaySeconds)
  )
  const remainingPresets = adsterraBannerPresets.filter(
    (preset) => !saved?.banners.some((banner) => banner.preset === preset.id)
  )
  const selectedPreset = adsterraPreset ?? remainingPresets[0]?.id ?? null
  const bannerInputs = (banners: AdvertisingSettings["banners"]) =>
    banners.map((banner) => ({
      preset: banner.preset,
      script: banner.scriptUrl,
    }))
  // Mirrors the interstitial on a phone: slots 0 and 4 sit above the countdown.
  const previewBanners = (saved?.banners ?? []).map((banner, index) => ({
    ...banner,
    top: index === 0 || index === 4,
  }))

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[32px] leading-tight font-bold tracking-[-0.6px]">
          {t("settings")}
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          {t("settingsDescription")}
        </p>
      </header>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_380px] xl:gap-16">
        <div className="flex min-w-0 flex-col">
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
          {saved ? (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                if (dirty)
                  updateAdvertising.mutate(current, {
                    onSuccess: () => setDraft({}),
                  })
              }}
            >
              <section className="flex flex-col gap-5 border-b border-border-soft pb-7">
                <SettingRow
                  id="advertising-enabled"
                  title={t("enableAdvertising")}
                  description={
                    saved.banners.length
                      ? t("enableAdvertisingDescription")
                      : t("advertisingNeedsBanner")
                  }
                  control={
                    <Switch
                      id="advertising-enabled"
                      checked={current.enabled}
                      disabled={
                        updateAdvertising.isPending ||
                        (saved.banners.length === 0 && !current.enabled)
                      }
                      onCheckedChange={(enabled) =>
                        setDraft((value) => ({ ...value, enabled }))
                      }
                    />
                  }
                />
                <SettingRow
                  id="automatic-redirect"
                  title={t("automaticRedirect")}
                  description={t("automaticRedirectDescription")}
                  control={
                    <Switch
                      id="automatic-redirect"
                      checked={current.automaticRedirect}
                      disabled={updateAdvertising.isPending}
                      onCheckedChange={(automaticRedirect) =>
                        setDraft((value) => ({ ...value, automaticRedirect }))
                      }
                    />
                  }
                />
              </section>

              <section className="flex flex-col gap-5 border-b border-border-soft py-7">
                <SectionTitle title={t("advertisingNetwork")} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-3.5 rounded-xl border-2 border-foreground p-[19px]">
                    <div className="flex items-center justify-between">
                      <MegaphoneIcon
                        aria-hidden
                        className="size-7"
                        strokeWidth={1.5}
                      />
                      <span className="rounded-full bg-success-soft px-2 py-[3px] text-xs font-semibold text-success">
                        {t("available")}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="font-semibold">AdsTerra</p>
                      <p className="text-sm text-muted-foreground">
                        {t("adsterraDescription")}
                      </p>
                    </div>
                  </div>
                  <div
                    aria-disabled="true"
                    className="flex flex-col gap-3.5 rounded-xl border border-border-soft p-5 text-subtle-foreground"
                  >
                    <div className="flex items-center justify-between">
                      <CircleDashedIcon
                        aria-hidden
                        className="size-7"
                        strokeWidth={1.5}
                      />
                      <span className="rounded-full bg-muted px-2 py-[3px] text-xs font-semibold text-muted-foreground">
                        {t("soon")}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="font-semibold">Google AdSense</p>
                      <p className="text-sm">{t("adsenseDescription")}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="flex flex-col gap-4 border-b border-border-soft py-7 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="flex min-w-0 flex-col gap-1">
                  <h2 id="delay-label" className="font-semibold">
                    {t("advertisingDelay")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("advertisingDelayDescription")}
                  </p>
                </div>
                <div
                  role="group"
                  aria-labelledby="delay-label"
                  className="flex shrink-0 items-center gap-4"
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9 rounded-full"
                    aria-label={t("decreaseDelay")}
                    disabled={current.delaySeconds <= 1}
                    onClick={() =>
                      setDraft((value) => ({
                        ...value,
                        delaySeconds: current.delaySeconds - 1,
                      }))
                    }
                  >
                    <MinusIcon />
                  </Button>
                  <output
                    aria-live="polite"
                    className="min-w-10 text-center font-medium tabular-nums"
                  >
                    {t("secondsShort", { count: current.delaySeconds })}
                  </output>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9 rounded-full"
                    aria-label={t("increaseDelay")}
                    disabled={current.delaySeconds >= 60}
                    onClick={() =>
                      setDraft((value) => ({
                        ...value,
                        delaySeconds: current.delaySeconds + 1,
                      }))
                    }
                  >
                    <PlusIcon />
                  </Button>
                </div>
              </section>

              <section className="flex flex-col gap-5 py-7">
                <SectionTitle
                  title={t("adsterraBanners")}
                  description={t("adsterraBannersDescription")}
                />
                {saved.banners.length ? (
                  <ul className="flex flex-col gap-5">
                    {saved.banners.map((banner) => (
                      <li
                        key={banner.preset}
                        className="flex items-center gap-4 rounded-xl border border-border p-4"
                      >
                        <BannerShape preset={banner.preset} />
                        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                          <p className="text-[15px] font-semibold">
                            {presetLabel(banner.preset)}
                          </p>
                          <p className="truncate font-mono text-[13px] text-muted-foreground">
                            {banner.scriptUrl.replace(/^https?:\/\/(www\.)?/, "")}
                          </p>
                        </div>
                        <Button
                          type="button"
                          aria-label={t("removeBanner")}
                          title={t("removeBanner")}
                          className="text-muted-foreground hover:text-destructive"
                          disabled={updateAdvertising.isPending}
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            updateAdvertising.mutate({
                              banners: bannerInputs(
                                saved.banners.filter(
                                  (item) => item.preset !== banner.preset
                                )
                              ),
                            })
                          }
                        >
                          <Trash2Icon />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {remainingPresets.length && !addingBanner ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-auto w-full rounded-xl bg-muted p-[18px] text-[15px] font-semibold whitespace-normal"
                    onClick={() => setAddingBanner(true)}
                  >
                    <PlusIcon data-icon="inline-start" className="size-[18px]" />
                    {t("addBanner")}
                  </Button>
                ) : null}

                {addingBanner && selectedPreset ? (
                  <div className="flex flex-col gap-4 rounded-xl border border-border p-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="banner-preset">{t("bannerPreset")}</Label>
                      <Select
                        items={remainingPresets.map((preset) => ({
                          value: preset.id,
                          label: presetLabel(preset.id),
                        }))}
                        onValueChange={(value) =>
                          setAdsterraPreset(value as AdsterraBannerPreset)
                        }
                        value={selectedPreset}
                      >
                        <SelectTrigger
                          id="banner-preset"
                          className="w-full sm:w-52"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="start">
                          <SelectGroup>
                            {remainingPresets.map((preset) => (
                              <SelectItem key={preset.id} value={preset.id}>
                                {presetLabel(preset.id)}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="adsterra-snippet">
                        {t("adsterraCode")}
                      </Label>
                      <p
                        id="adsterra-snippet-description"
                        className="text-sm text-muted-foreground"
                      >
                        {t("adsterraCodeDescription")}
                      </p>
                      <Textarea
                        id="adsterra-snippet"
                        aria-describedby="adsterra-snippet-description"
                        onChange={(event) =>
                          setAdsterraSnippet(event.target.value)
                        }
                        placeholder="https://www.highperformanceformat.com/.../invoke.js"
                        value={adsterraSnippet}
                      />
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setAddingBanner(false)
                          setAdsterraSnippet("")
                        }}
                      >
                        {common("cancel")}
                      </Button>
                      <Button
                        type="button"
                        disabled={
                          updateAdvertising.isPending || !adsterraSnippet.trim()
                        }
                        onClick={() =>
                          updateAdvertising.mutate(
                            {
                              banners: [
                                ...bannerInputs(saved.banners),
                                {
                                  preset: selectedPreset,
                                  script: adsterraSnippet,
                                },
                              ],
                            },
                            {
                              onSuccess: () => {
                                setAdsterraSnippet("")
                                setAdsterraPreset(null)
                                setAddingBanner(false)
                              },
                            }
                          )
                        }
                      >
                        <PlusIcon data-icon="inline-start" />
                        {t("addBanner")}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </section>

              {updateAdvertising.isError ? (
                <Alert variant="destructive" className="mb-5">
                  <TriangleAlertIcon />
                  <AlertTitle>{t("changesNotSaved")}</AlertTitle>
                  <AlertDescription>
                    {updateAdvertising.error.message}
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="flex items-center justify-end gap-5 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-[15px] font-semibold"
                  disabled={!dirty || updateAdvertising.isPending}
                  onClick={() => setDraft({})}
                >
                  {t("discard")}
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className={cn("px-7 font-semibold", darkButton)}
                  disabled={!dirty || updateAdvertising.isPending}
                >
                  {t("saveSettings")}
                </Button>
              </div>
            </form>
          ) : null}

          {settings.isPending || settings.isSuccess ? (
            <section className="mt-12 flex flex-col gap-5 border-t border-border-soft pt-10">
              <h2 className="text-[22px] font-semibold">{t("access")}</h2>
              {settings.isPending ? <Skeleton className="h-16 w-full" /> : null}
              {settings.isSuccess ? (
                <SettingRow
                  id="allow-registrations"
                  title={t("allowRegistrations")}
                  description={t("allowRegistrationsDescription")}
                  control={
                    <Switch
                      id="allow-registrations"
                      checked={settings.data.registrationEnabled}
                      disabled={updateSettings.isPending}
                      onCheckedChange={(registrationEnabled) =>
                        updateSettings.mutate({ registrationEnabled })
                      }
                    />
                  }
                />
              ) : null}
            </section>
          ) : null}

          {settings.isPending || settings.isSuccess ? (
            <section className="mt-12 flex flex-col gap-5 border-t border-border-soft pt-10">
              <div className="flex flex-col gap-1">
                <h2 className="text-[22px] font-semibold">
                  {t("notifications")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("notificationsDescription")}
                </p>
              </div>
              {settings.isPending ? <Skeleton className="h-72 w-full" /> : null}
              {settings.isSuccess ? (
                <>
                  <form
                    className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:p-5"
                    onSubmit={(event) => {
                      event.preventDefault()
                      updateSettings.mutate({ discordWebhookUrl })
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <MessageCircleIcon className="size-5" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[15px] font-semibold">
                              {t("discord")}
                            </p>
                            {settings.data.discordConfigured ? (
                              <span className="rounded-full bg-success-soft px-2 py-[3px] text-xs font-semibold text-success">
                                {t("connected")}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t("discordDescription")}
                          </p>
                        </div>
                      </div>
                      {settings.data.discordConfigured ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="font-semibold"
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
                        className={cn("h-11 px-6", darkButton)}
                        disabled={
                          updateSettings.isPending || !discordWebhookUrl.trim()
                        }
                      >
                        {t("save")}
                      </Button>
                    </div>
                  </form>

                  <form
                    className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:p-5"
                    onSubmit={(event) => {
                      event.preventDefault()
                      updateSettings.mutate({
                        telegramBotToken,
                        telegramChatId,
                      })
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <SendIcon className="size-5" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[15px] font-semibold">
                              {t("telegram")}
                            </p>
                            {settings.data.telegramConfigured ? (
                              <span className="rounded-full bg-success-soft px-2 py-[3px] text-xs font-semibold text-success">
                                {t("connected")}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t("telegramDescription")}
                          </p>
                        </div>
                      </div>
                      {settings.data.telegramConfigured ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="font-semibold"
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
                    <div className="grid gap-3 sm:grid-cols-2">
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
                      className={cn("h-11 w-fit px-6", darkButton)}
                      disabled={
                        updateSettings.isPending ||
                        !telegramBotToken.trim() ||
                        !telegramChatId.trim()
                      }
                    >
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
            </section>
          ) : null}
        </div>

        {saved ? (
          <aside
            aria-label={t("livePreview")}
            className="flex flex-col gap-4 rounded-[20px] bg-muted p-6 lg:sticky lg:top-0"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-semibold">{t("livePreview")}</h2>
              <p className="text-[13px] text-muted-foreground">
                {t("whatVisitorsSee")}
              </p>
            </div>
            <div
              aria-hidden
              className={cn(
                "mx-auto flex w-full max-w-[280px] flex-col items-center gap-[18px] rounded-[32px] border border-border bg-background px-5 pt-5 pb-6 transition-opacity",
                !current.enabled && "opacity-60"
              )}
            >
              <div className="flex w-full items-center justify-center gap-1.5 rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">
                <LockIcon className="size-[11px]" />
                <span className="truncate">{appHost}</span>
              </div>
              {previewBanners
                .filter((banner) => banner.top)
                .map((banner) => (
                  <div
                    key={banner.preset}
                    className="flex h-10 w-full items-center justify-center rounded-md bg-border-soft text-[11px] font-semibold tracking-[0.6px] text-subtle-foreground"
                  >
                    AD · {presetLabel(banner.preset)}
                  </div>
                ))}
              <div className="relative size-[120px]">
                <svg viewBox="0 0 120 120" className="size-full -rotate-90">
                  <circle
                    cx="60"
                    cy="60"
                    r="55"
                    fill="none"
                    strokeWidth="6"
                    className="stroke-border-soft"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="55"
                    fill="none"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="stroke-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[40px] leading-none font-bold tabular-nums">
                    {current.delaySeconds}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("seconds")}
                  </span>
                </div>
              </div>
              <p className="text-center text-[15px] font-semibold">
                {t("previewAlmostReady")}
              </p>
              <div className="w-full rounded-[10px] bg-border-soft py-3 text-center text-sm font-semibold text-subtle-foreground">
                {current.automaticRedirect
                  ? t("previewRedirecting")
                  : t("previewContinue")}
              </div>
              {previewBanners
                .filter((banner) => !banner.top)
                .map((banner) => (
                <div
                  key={banner.preset}
                  className="flex h-14 w-full items-center justify-center rounded-md bg-border-soft text-[11px] font-semibold tracking-[0.6px] text-subtle-foreground"
                >
                  AD · {presetLabel(banner.preset)}
                </div>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  )
}
