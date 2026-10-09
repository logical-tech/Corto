"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"
import {
  CalendarClockIcon,
  CheckIcon,
  GaugeIcon,
  GlobeIcon,
  LockIcon,
  MegaphoneIcon,
  type LucideIcon,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import type { ShortLink } from "@/lib/api"

export const createLinkSchema = (t: (key: string) => string) =>
  z.object({
    url: z.string().trim().url(t("invalidUrl")),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t("invalidSlug"))
      .min(3, t("shortSlug"))
      .max(64)
      .or(z.literal("")),
    title: z.string().trim().max(200, t("longTitle")),
    expiresAt: z.string(),
    clickLimit: z
      .string()
      .trim()
      .regex(/^\d+$/, t("invalidClickLimit"))
      .refine((value) => Number(value) >= 1, t("invalidClickLimit"))
      .or(z.literal("")),
    password: z.string().min(4, t("shortPassword")).max(128).or(z.literal("")),
    removePassword: z.string().optional(),
  })

export type LinkInput = {
  url: string
  slug?: string
  title?: string | null
  expiresAt?: string | null
  clickLimit?: number | null
  password?: string | null
  adFree?: boolean
}

type Option = "expiresAt" | "clickLimit" | "password" | "ads"

const fieldInput =
  "w-full min-w-0 bg-transparent outline-none placeholder:text-subtle-foreground"

export function LinkForm({
  link,
  pending,
  onSubmit,
  advertisingAvailable = false,
  children,
}: {
  link?: ShortLink
  pending: boolean
  onSubmit: (values: LinkInput) => Promise<void>
  advertisingAvailable?: boolean
  children?: React.ReactNode
}) {
  const { t } = useTranslation("links")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState<1 | 2>(1)
  const [destination, setDestination] = useState("")
  const [options, setOptions] = useState<Set<Option>>(() => new Set(["ads"]))
  const isWizard = !link

  function showValidationErrors(
    form: HTMLFormElement,
    fields: Record<string, string[] | undefined>
  ) {
    setErrors(
      Object.fromEntries(
        Object.entries(fields).map(([key, value]) => [
          key,
          value?.[0] ?? t("invalidValue"),
        ])
      )
    )
    const firstInvalid = Object.keys(fields)[0]
    if (firstInvalid) {
      ;(form.elements.namedItem(firstInvalid) as HTMLElement | null)?.focus()
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    // Unselected wizard options are not rendered, so they submit as blank.
    const values = {
      expiresAt: "",
      clickLimit: "",
      password: "",
      ...Object.fromEntries(new FormData(form)),
    }

    if (isWizard && step === 1) {
      const parsed = createLinkSchema(t).pick({ url: true }).safeParse(values)

      if (!parsed.success) {
        showValidationErrors(form, parsed.error.flatten().fieldErrors)
        return
      }

      setErrors({})
      setDestination(parsed.data.url)
      setStep(2)
      return
    }

    const result = createLinkSchema(t).safeParse(values)

    if (!result.success) {
      showValidationErrors(form, result.error.flatten().fieldErrors)
      return
    }

    setErrors({})
    try {
      await onSubmit({
        url: result.data.url,
        slug: result.data.slug || undefined,
        title: result.data.title || null,
        expiresAt: result.data.expiresAt
          ? new Date(`${result.data.expiresAt}T23:59:59`).toISOString()
          : null,
        clickLimit: result.data.clickLimit
          ? Number(result.data.clickLimit)
          : null,
        // An untouched password field leaves the stored one alone.
        ...(result.data.removePassword
          ? { password: null }
          : result.data.password
            ? { password: result.data.password }
            : {}),
        ...(isWizard && advertisingAvailable
          ? { adFree: !options.has("ads") }
          : {}),
      })
    } catch {
      return
    }
    if (!link) {
      form.reset()
      setStep(1)
    }
  }

  function cell(
    name: string,
    label: string,
    input: React.ReactNode,
    className?: string
  ) {
    return (
      <div
        className={cn(
          "group flex min-w-0 flex-col gap-0.5 focus-within:relative focus-within:z-10 focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-foreground",
          isWizard ? "px-4 py-3 text-base" : "px-3 py-2.5 text-sm",
          className
        )}
        data-invalid={Boolean(errors[name]) || undefined}
      >
        <label
          htmlFor={name}
          className={cn(
            "group-data-invalid:text-destructive",
            isWizard
              ? "text-xs text-muted-foreground"
              : "text-[10px] font-bold tracking-[0.04em] uppercase"
          )}
        >
          {label}
        </label>
        {input}
        {errors[name] ? (
          <p
            id={`${name}-error`}
            className="text-xs font-medium text-destructive"
            role="alert"
          >
            {errors[name]}
          </p>
        ) : null}
      </div>
    )
  }

  function inputProps(name: string) {
    return {
      id: name,
      name,
      className: fieldInput,
      "aria-invalid": Boolean(errors[name]),
      "aria-describedby": errors[name] ? `${name}-error` : undefined,
    }
  }

  const slugCell = cell(
    "slug",
    t("linkFormSlug"),
    <input
      {...inputProps("slug")}
      defaultValue={link?.slug}
      placeholder="estate-2026"
      autoComplete="off"
      spellCheck={false}
    />
  )
  const titleCell = cell(
    "title",
    t("linkFormTitle"),
    <input
      {...inputProps("title")}
      defaultValue={link?.title ?? ""}
      placeholder="Campagna estate"
      autoComplete="off"
    />
  )
  const actionLabel = isWizard
    ? step === 1
      ? t("linkWizardContinue")
      : t("createLink")
    : t("saveChanges")

  if (!isWizard) {
    return (
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border">
          {cell(
            "url",
            t("linkFormDestination"),
            <input
              {...inputProps("url")}
              type="url"
              defaultValue={link.url}
              placeholder="https://example.com/pagina"
              autoComplete="url"
            />,
            "col-span-2 border-b"
          )}
          <div className="border-r border-b">{slugCell}</div>
          {cell(
            "expiresAt",
            t("linkFormExpiry"),
            <input
              {...inputProps("expiresAt")}
              type="date"
              defaultValue={link.expiresAt?.slice(0, 10)}
            />,
            "border-b"
          )}
          {cell(
            "clickLimit",
            t("linkFormClickLimit"),
            <input
              {...inputProps("clickLimit")}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              defaultValue={link.clickLimit ?? ""}
              placeholder={t("noLimit")}
            />,
            "border-r border-b"
          )}
          {cell(
            "password",
            t("linkFormPassword"),
            <input
              {...inputProps("password")}
              type="password"
              autoComplete="new-password"
              placeholder={link.hasPassword ? "••••••••" : t("noPassword")}
            />,
            "border-b"
          )}
          <div className="col-span-2">{titleCell}</div>
        </div>
        {link.hasPassword ? (
          <label className="-mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="removePassword"
              className="size-4 accent-foreground"
            />
            {t("removePassword")}
          </label>
        ) : null}
        {children}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {actionLabel}
        </Button>
        <p className="text-center text-[13px] text-muted-foreground">
          {t("linkSettingsNote")}
        </p>
      </form>
    )
  }

  const optionCards: Array<{
    id: Option
    icon: LucideIcon
    label: string
    hint: string
    input?: React.ReactNode
  }> = [
    {
      id: "expiresAt",
      icon: CalendarClockIcon,
      label: t("linkFormExpiry"),
      hint: t("optionExpiryHint"),
      input: (
        <Input
          {...inputProps("expiresAt")}
          className="bg-background"
          type="date"
          aria-label={t("linkFormExpiry")}
        />
      ),
    },
    {
      id: "clickLimit",
      icon: GaugeIcon,
      label: t("linkFormClickLimit"),
      hint: t("optionClickLimitHint"),
      input: (
        <Input
          {...inputProps("clickLimit")}
          className="bg-background"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          placeholder="1000"
          aria-label={t("linkFormClickLimit")}
        />
      ),
    },
    {
      id: "password",
      icon: LockIcon,
      label: t("linkFormPassword"),
      hint: t("optionPasswordHint"),
      input: (
        <Input
          {...inputProps("password")}
          className="bg-background"
          type="password"
          autoComplete="new-password"
          aria-label={t("linkFormPassword")}
        />
      ),
    },
    ...(advertisingAvailable
      ? [
          {
            id: "ads" as const,
            icon: MegaphoneIcon,
            label: t("optionAdsTitle"),
            hint: t("optionAdsHint"),
          },
        ]
      : []),
  ]

  return (
    <form onSubmit={submit} className="flex flex-col gap-7" noValidate>
      <header className="flex flex-col gap-2.5">
        <p className="text-sm font-semibold text-muted-foreground">
          {t("linkWizardProgress", { step })}
        </p>
        <h1 className="text-[28px] leading-tight font-bold tracking-[-0.8px] sm:text-4xl">
          {step === 1 ? t("linkWizardStepTitle1") : t("linkWizardStepTitle2")}
        </h1>
        <p className="text-[17px] leading-[25px] text-muted-foreground">
          {step === 1
            ? t("linkWizardStepDescription1")
            : t("linkWizardStepDescription2")}
        </p>
      </header>

      <div
        hidden={step !== 1}
        className="overflow-hidden rounded-xl border border-border"
      >
        {cell(
          "url",
          t("linkFormDestination"),
          <input
            {...inputProps("url")}
            type="url"
            placeholder="https://example.com/pagina"
            autoComplete="url"
          />
        )}
      </div>

      {step === 2 ? (
        <>
          <div className="flex items-center gap-4 rounded-2xl bg-muted p-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-border-soft bg-background text-muted-foreground">
              <GlobeIcon className="size-6" strokeWidth={1.5} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="text-xs font-semibold text-muted-foreground">
                {t("linkWizardDestination")}
              </p>
              <p className="truncate font-semibold">
                {URL.canParse(destination)
                  ? new URL(destination).hostname
                  : destination}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {destination}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="font-semibold"
              onClick={() => setStep(1)}
            >
              {t("linkWizardEdit")}
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <div className="border-b">{slugCell}</div>
            {titleCell}
          </div>

          <section
            className="flex flex-col gap-4"
            aria-labelledby="extra-controls"
          >
            <div className="flex flex-col gap-1">
              <h2 id="extra-controls" className="text-xl font-semibold">
                {t("extraControls")}
              </h2>
              <p className="text-[15px] text-muted-foreground">
                {t("extraControlsDescription")}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {optionCards.map((option) => {
                const selected = options.has(option.id)
                const Icon = option.icon

                return (
                  <div
                    key={option.id}
                    className={cn(
                      "relative flex flex-col gap-3.5 rounded-xl border p-5 transition-colors duration-[var(--duration-quick)]",
                      selected
                        ? "border-transparent bg-muted outline-2 -outline-offset-1 outline-foreground"
                        : "hover:bg-muted/60"
                    )}
                  >
                    <button
                      type="button"
                      aria-pressed={selected}
                      className="flex flex-col gap-3.5 text-left outline-none before:absolute before:inset-0 before:rounded-xl focus-visible:before:ring-3 focus-visible:before:ring-ring/50"
                      onClick={() =>
                        setOptions((current) => {
                          const next = new Set(current)
                          if (selected) next.delete(option.id)
                          else next.add(option.id)
                          return next
                        })
                      }
                    >
                      <span className="flex w-full items-start justify-between">
                        <Icon
                          aria-hidden="true"
                          className="size-7"
                          strokeWidth={1.5}
                        />
                        {selected ? (
                          <span className="flex size-[22px] items-center justify-center rounded-full bg-foreground text-background">
                            <CheckIcon
                              aria-hidden="true"
                              className="size-3.5"
                              strokeWidth={3}
                            />
                          </span>
                        ) : null}
                      </span>
                      <span className="flex flex-col gap-0.5">
                        <span className="font-semibold">{option.label}</span>
                        <span className="text-sm text-muted-foreground">
                          {option.hint}
                        </span>
                      </span>
                    </button>
                    {selected && option.input ? (
                      <div className="relative z-10 flex flex-col gap-1.5">
                        {option.input}
                        {errors[option.id] ? (
                          <p
                            id={`${option.id}-error`}
                            className="text-xs font-medium text-destructive"
                            role="alert"
                          >
                            {errors[option.id]}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </section>
        </>
      ) : null}

      {children}

      <footer className="sticky bottom-0 z-20 mt-2 flex flex-col bg-background pb-4">
        <div className="grid grid-cols-2 gap-1.5" aria-hidden="true">
          <span className="h-1.5 bg-foreground" />
          <span
            className={cn(
              "h-1.5 transition-colors duration-[var(--duration-fast)]",
              step === 2 ? "bg-foreground" : "bg-border-soft"
            )}
          />
        </div>
        <div className="flex items-center justify-between gap-3 pt-4">
          {step === 2 ? (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="-ml-3 font-semibold underline-offset-4 hover:underline"
              disabled={pending}
              onClick={() => setStep(1)}
            >
              {t("linkWizardBack")}
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="submit"
            size="lg"
            className="bg-foreground px-7 text-background hover:bg-foreground/90"
            disabled={pending}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {actionLabel}
          </Button>
        </div>
      </footer>
    </form>
  )
}
