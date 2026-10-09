"use client"

import { useQuery } from "@tanstack/react-query"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { LockKeyholeIcon, ScanFaceIcon, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { authClient, usePasskeyEnabled } from "@/lib/auth-client"
import { api, type RegistrationStatus } from "@/lib/api"

export function AuthPanel({
  title,
  backHref,
  backLabel,
  backIcon: BackIcon,
  children,
}: {
  title: string
  backHref: string
  backLabel: string
  backIcon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <div className="w-full max-w-[35.5rem] overflow-hidden rounded-2xl bg-card text-card-foreground shadow-[0_8px_28px_rgb(0_0_0/0.25)]">
      <div className="grid h-16 grid-cols-[2rem_1fr_2rem] items-center gap-2 border-b border-border-soft px-6">
        <Link
          href={backHref}
          aria-label={backLabel}
          title={backLabel}
          className="flex size-8 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <BackIcon aria-hidden="true" className="size-4" />
        </Link>
        <p className="truncate text-center text-base font-bold">{title}</p>
      </div>
      <div className="flex flex-col gap-4 p-6">{children}</div>
    </div>
  )
}

export function AuthHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <>
      <h1 className="text-[1.375rem] font-semibold text-pretty">{title}</h1>
      <p className="text-[0.9375rem] text-pretty text-muted-foreground">
        {description}
      </p>
    </>
  )
}

export function AuthFooter({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex flex-wrap justify-center gap-x-1.5 pt-2 text-sm text-muted-foreground">
      {children}
    </p>
  )
}

export const authLinkClassName =
  "rounded-sm font-semibold text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/30"

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { t } = useTranslation("auth")
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const formErrorRef = useRef<HTMLParagraphElement>(null)
  const isRegister = mode === "register"
  const passkeyStatus = usePasskeyEnabled()
  const registration = useQuery({
    queryKey: ["registration"],
    queryFn: ({ signal }) =>
      api<RegistrationStatus>("/v1/registration", { signal }),
    enabled: isRegister,
    retry: false,
  })

  useEffect(() => {
    if (formError) formErrorRef.current?.focus()
  }, [formError])

  if (isRegister && registration.data?.enabled === false) {
    return (
      <Alert>
        <LockKeyholeIcon />
        <AlertTitle>{t("registrationsDisabled")}</AlertTitle>
        <AlertDescription>
          {t("registrationsDisabledDescription")} {t("alreadyHaveAccount")}{" "}
          <Link href="/login" className="font-medium underline">
            {t("signIn")}
          </Link>
          .
        </AlertDescription>
      </Alert>
    )
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError("")
    const form = new FormData(event.currentTarget)
    const values = Object.fromEntries(form)
    const loginSchema = z.object({
      email: z.string().email(t("validEmail")),
      password: z.string().min(8, t("passwordLength")),
    })
    const result = isRegister
      ? loginSchema
          .extend({ name: z.string().trim().min(2, t("validName")) })
          .safeParse(values)
      : loginSchema.safeParse(values)

    if (!result.success) {
      const fields = result.error.flatten().fieldErrors
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
        ;(
          event.currentTarget.elements.namedItem(
            firstInvalid
          ) as HTMLElement | null
        )?.focus()
      }
      return
    }

    setErrors({})
    setPending(true)
    try {
      const response = isRegister
        ? await authClient.signUp.email(
            result.data as { name: string; email: string; password: string }
          )
        : await authClient.signIn.email({
            ...result.data,
            callbackURL: "/dashboard",
          })

      if (response.error) {
        setFormError(response.error.message ?? t("signInFailed"))
        return
      }

      if (!isRegister) return

      window.location.replace("/dashboard")
    } catch {
      setFormError(t("apiUnreachable"))
    } finally {
      setPending(false)
    }
  }

  async function signInWithPasskey() {
    setFormError("")
    setPending(true)
    try {
      const response = await authClient.signIn.passkey()
      if (response.error) {
        setFormError(response.error.message ?? t("signInFailed"))
        return
      }
      window.location.replace("/dashboard")
    } catch {
      setFormError(t("apiUnreachable"))
    } finally {
      setPending(false)
    }
  }

  const fields = [
    ...(isRegister
      ? [
          {
            name: "name",
            label: t("name"),
            autoComplete: "name",
            placeholder: t("namePlaceholder"),
          },
        ]
      : []),
    {
      name: "email",
      label: t("email"),
      type: "email",
      autoComplete: "email",
      placeholder: "name@company.com",
    },
    {
      name: "password",
      label: t("password"),
      type: showPassword ? "text" : "password",
      autoComplete: isRegister ? "new-password" : "current-password",
    },
  ]

  return (
    <form className="flex w-full flex-col gap-4" onSubmit={onSubmit} noValidate>
      <div className="flex flex-col divide-y divide-subtle-foreground rounded-[0.625rem] border border-subtle-foreground">
        {fields.map((field) => (
          <div
            key={field.name}
            className="flex items-center gap-3 px-3.5 py-2.5 first:rounded-t-[0.5625rem] last:rounded-b-[0.5625rem] focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-foreground has-aria-invalid:outline-2 has-aria-invalid:-outline-offset-1 has-aria-invalid:outline-destructive"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <label
                htmlFor={field.name}
                className="text-xs text-muted-foreground"
              >
                {field.label}
              </label>
              <input
                id={field.name}
                name={field.name}
                type={field.type ?? "text"}
                autoComplete={field.autoComplete}
                placeholder={field.placeholder}
                spellCheck={false}
                aria-invalid={Boolean(errors[field.name])}
                aria-describedby={
                  errors[field.name] ? `${field.name}-error` : undefined
                }
                className="w-full bg-transparent text-base outline-none placeholder:text-subtle-foreground"
              />
            </div>
            {field.name === "password" ? (
              <button
                type="button"
                aria-pressed={showPassword}
                aria-controls="password"
                onClick={() => setShowPassword((value) => !value)}
                className="rounded-sm text-sm font-semibold outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                {showPassword ? t("hidePassword") : t("showPassword")}
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="-mt-1 flex flex-col gap-1 text-xs">
        {fields.map((field) =>
          errors[field.name] ? (
            <p
              key={field.name}
              id={`${field.name}-error`}
              className="text-destructive"
            >
              {errors[field.name]}
            </p>
          ) : null
        )}
        {errors.password ? null : (
          <p className="text-muted-foreground">{t("passwordHint")}</p>
        )}
      </div>

      {formError ? (
        <p
          ref={formErrorRef}
          role="alert"
          tabIndex={-1}
          className="rounded-[0.625rem] bg-destructive/10 p-3 text-sm text-destructive"
        >
          {formError}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="rounded-[0.625rem] font-semibold"
        disabled={pending}
      >
        {pending ? <Spinner data-icon="inline-start" /> : null}
        {isRegister ? t("signUp") : t("signIn")}
      </Button>

      {!isRegister && passkeyStatus.data?.passkeyEnabled ? (
        <>
          <div className="flex items-center gap-4 py-1 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border-soft" />
            {t("or")}
            <span className="h-px flex-1 bg-border-soft" />
          </div>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="justify-between rounded-[0.625rem] border-foreground font-semibold"
            disabled={pending}
            onClick={signInWithPasskey}
          >
            <ScanFaceIcon data-icon="inline-start" className="size-5" />
            {t("signInWithPasskey")}
            <span aria-hidden="true" className="size-5" />
          </Button>
        </>
      ) : null}

      <AuthFooter>
        {isRegister ? t("alreadyHaveAccount") : t("needAccount")}
        <Link
          className={authLinkClassName}
          href={isRegister ? "/login" : "/register"}
        >
          {isRegister ? t("signIn") : t("signUp")}
        </Link>
      </AuthFooter>
    </form>
  )
}
