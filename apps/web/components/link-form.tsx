"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "lucide-react"
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
}

export function LinkForm({
  link,
  pending,
  onSubmit,
}: {
  link?: ShortLink
  pending: boolean
  onSubmit: (values: LinkInput) => Promise<void>
}) {
  const { t } = useTranslation("links")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState<1 | 2>(1)
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
    const values = Object.fromEntries(new FormData(form))

    if (isWizard && step === 1) {
      const destination = createLinkSchema(t)
        .pick({ url: true })
        .safeParse(values)

      if (!destination.success) {
        showValidationErrors(form, destination.error.flatten().fieldErrors)
        return
      }

      setErrors({})
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
      })
    } catch {
      return
    }
    if (!link) {
      form.reset()
      setStep(1)
    }
  }

  const linkDetails = (
    <div className="grid gap-5 md:grid-cols-2">
      <Field data-invalid={Boolean(errors.slug)}>
        <FieldLabel htmlFor="slug">{t("linkFormSlug")}</FieldLabel>
        <Input
          id="slug"
          name="slug"
          defaultValue={link?.slug}
          placeholder="estate-2026"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(errors.slug)}
        />
        <FieldDescription>{t("linkFormSlugHelp")}</FieldDescription>
        <FieldError>{errors.slug}</FieldError>
      </Field>
      <Field data-invalid={Boolean(errors.expiresAt)}>
        <FieldLabel htmlFor="expiresAt">{t("linkFormExpiry")}</FieldLabel>
        <Input
          id="expiresAt"
          name="expiresAt"
          type="date"
          defaultValue={link?.expiresAt?.slice(0, 10)}
          aria-invalid={Boolean(errors.expiresAt)}
        />
        <FieldDescription>{t("linkFormExpiryHelp")}</FieldDescription>
        <FieldError>{errors.expiresAt}</FieldError>
      </Field>
      <Field data-invalid={Boolean(errors.clickLimit)}>
        <FieldLabel htmlFor="clickLimit">{t("linkFormClickLimit")}</FieldLabel>
        <Input
          id="clickLimit"
          name="clickLimit"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          defaultValue={link?.clickLimit ?? ""}
          placeholder="1000"
          aria-invalid={Boolean(errors.clickLimit)}
        />
        <FieldDescription>{t("linkFormClickLimitHelp")}</FieldDescription>
        <FieldError>{errors.clickLimit}</FieldError>
      </Field>
      <Field data-invalid={Boolean(errors.password)}>
        <FieldLabel htmlFor="password">{t("linkFormPassword")}</FieldLabel>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder={link?.hasPassword ? "••••••••" : ""}
          aria-invalid={Boolean(errors.password)}
        />
        <FieldDescription>
          {link?.hasPassword
            ? t("linkFormPasswordSetHelp")
            : t("linkFormPasswordHelp")}
        </FieldDescription>
        {link?.hasPassword ? (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" name="removePassword" className="size-4" />
            {t("removePassword")}
          </label>
        ) : null}
        <FieldError>{errors.password}</FieldError>
      </Field>
      <Field className="md:col-span-2" data-invalid={Boolean(errors.title)}>
        <FieldLabel htmlFor="title">{t("linkFormTitle")}</FieldLabel>
        <Input
          id="title"
          name="title"
          defaultValue={link?.title ?? ""}
          placeholder="Campagna estate"
          autoComplete="off"
          aria-invalid={Boolean(errors.title)}
        />
        <FieldError>{errors.title}</FieldError>
      </Field>
    </div>
  )

  return (
    <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
      {isWizard ? (
        <ol
          className="grid grid-cols-2 gap-3 text-sm"
          aria-label={t("linkWizardProgress", { step })}
        >
          {(
            [
              [1, "linkWizardDestination"],
              [2, "linkWizardDetails"],
            ] as const
          ).map(([number, label]) => {
            const completed = step > number
            const current = step === number

            return (
              <li
                className={`flex items-center gap-2 ${current ? "text-foreground" : "text-muted-foreground"}`}
                key={number}
                aria-current={current ? "step" : undefined}
              >
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${completed ? "bg-primary text-primary-foreground" : current ? "bg-foreground text-background" : "bg-muted"}`}
                >
                  {completed ? <CheckIcon className="size-3.5" /> : number}
                </span>
                <span className="truncate">{t(label)}</span>
              </li>
            )
          })}
        </ol>
      ) : null}
      <FieldGroup className={isWizard ? undefined : "gap-5"}>
        <Field data-invalid={Boolean(errors.url)}>
          <FieldLabel htmlFor="url">{t("linkFormDestination")}</FieldLabel>
          <Input
            id="url"
            name="url"
            type="url"
            defaultValue={link?.url}
            placeholder="https://example.com/pagina"
            autoComplete="url"
            aria-invalid={Boolean(errors.url)}
          />
          <FieldError>{errors.url}</FieldError>
        </Field>
        {isWizard ? (
          <div className="link-wizard-options" data-open={step === 2}>
            <div aria-hidden={step !== 2} inert={step !== 2}>
              <div className="pt-6">{linkDetails}</div>
            </div>
          </div>
        ) : (
          linkDetails
        )}
      </FieldGroup>
      <div
        className={`flex flex-wrap items-center gap-3 ${isWizard ? "" : "border-t pt-5 sm:justify-end"}`}
      >
        {isWizard && step === 2 ? (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            disabled={pending}
            onClick={() => setStep(1)}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            {t("linkWizardBack")}
          </Button>
        ) : null}
        <Button
          type="submit"
          size="lg"
          className={isWizard ? "w-fit" : "w-full sm:w-fit"}
          disabled={pending}
        >
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {isWizard && step === 1
            ? t("linkWizardContinue")
            : link
              ? t("saveChanges")
              : t("createLink")}
          {!pending ? <ArrowRightIcon data-icon="inline-end" /> : null}
        </Button>
      </div>
    </form>
  )
}
