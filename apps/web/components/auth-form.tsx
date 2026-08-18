"use client"

import { useQuery } from "@tanstack/react-query"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { ArrowRightIcon, KeyRoundIcon, LockKeyholeIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { authClient, usePasskeyEnabled } from "@/lib/auth-client"
import { api, type RegistrationStatus } from "@/lib/api"

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { t } = useTranslation("auth")
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
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

  return (
    <form className="flex w-full flex-col gap-8" onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-5">
        {isRegister ? (
          <Field data-invalid={Boolean(errors.name)}>
            <FieldLabel htmlFor="name">{t("name")}</FieldLabel>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              placeholder="Ada Lovelace"
              className="h-11 rounded-xl bg-background px-3.5"
            />
            <FieldError>{errors.name}</FieldError>
          </Field>
        ) : null}
        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            aria-invalid={Boolean(errors.email)}
            placeholder="name@company.com"
            className="h-11 rounded-xl bg-background px-3.5"
          />
          <FieldError>{errors.email}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            aria-invalid={Boolean(errors.password)}
            className="h-11 rounded-xl bg-background px-3.5"
          />
          <FieldError>{errors.password}</FieldError>
        </Field>
      </FieldGroup>

      {formError ? (
        <p
          ref={formErrorRef}
          role="alert"
          tabIndex={-1}
          className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
        >
          {formError}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="h-12 justify-between rounded-xl px-5"
        disabled={pending}
      >
        {pending ? <Spinner data-icon="inline-start" /> : null}
        {isRegister ? t("signUp") : t("signIn")}
        {!pending ? <ArrowRightIcon data-icon="inline-end" /> : null}
      </Button>

      {!isRegister && passkeyStatus.data?.passkeyEnabled ? (
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-12 rounded-xl"
          disabled={pending}
          onClick={signInWithPasskey}
        >
          <KeyRoundIcon data-icon="inline-start" />
          {t("signInWithPasskey")}
        </Button>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        {isRegister ? t("alreadyHaveAccount") : t("needAccount")}{" "}
        <Link
          className="font-medium text-foreground underline hover:text-primary"
          href={isRegister ? "/login" : "/register"}
        >
          {isRegister ? t("signIn") : t("signUp")}
        </Link>
      </p>
    </form>
  )
}
