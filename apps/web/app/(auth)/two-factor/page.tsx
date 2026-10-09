"use client"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@workspace/ui/components/input-otp"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  ChevronLeftIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import {
  AuthFooter,
  AuthPanel,
  authLinkClassName,
} from "@/components/auth-form"
import { authClient } from "@/lib/auth-client"

const totpLength = 6

export default function TwoFactorPage() {
  const { t } = useTranslation("auth")
  const [code, setCode] = useState("")
  const [recovery, setRecovery] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setPending(true)
    try {
      const response = recovery
        ? await authClient.twoFactor.verifyBackupCode({ code })
        : await authClient.twoFactor.verifyTotp({ code })
      if (response.error) {
        setError(response.error.message ?? t("signInFailed"))
        return
      }
      window.location.replace("/dashboard")
    } catch {
      setError(t("apiUnreachable"))
    } finally {
      setPending(false)
    }
  }

  const codeLabel = recovery ? t("recoveryCode") : t("verificationCode")

  return (
    <AuthPanel
      title={t("twoStepVerification")}
      backHref="/login"
      backLabel={t("backToSignIn")}
      backIcon={ChevronLeftIcon}
    >
      <form className="flex flex-col gap-5" onSubmit={verify}>
        <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
          <ShieldCheckIcon aria-hidden="true" className="size-6.5" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[1.375rem] font-semibold text-pretty">
            {t("twoFactorRequired")}
          </h1>
          <p className="text-[0.9375rem] text-pretty text-muted-foreground">
            {recovery
              ? t("recoveryCodeDescription")
              : t("twoFactorRequiredDescription")}
          </p>
        </div>

        {recovery ? (
          <Input
            value={code}
            autoFocus
            autoComplete="one-time-code"
            placeholder={codeLabel}
            aria-label={codeLabel}
            className="h-16 rounded-xl px-4 text-lg"
            onChange={(event) => setCode(event.target.value)}
          />
        ) : (
          <InputOTP
            value={code}
            autoFocus
            maxLength={totpLength}
            pattern="^[0-9]*$"
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label={codeLabel}
            containerClassName="w-full"
            onChange={setCode}
          >
            <InputOTPGroup className="w-full gap-2.5">
              {Array.from({ length: totpLength }, (_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="h-16 min-w-0 flex-1 rounded-xl border border-border bg-transparent text-[1.625rem] font-semibold first:rounded-xl last:rounded-xl data-[active=true]:border-foreground data-[active=true]:ring-0 data-[active=true]:outline-1 data-[active=true]:outline-foreground"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        )}

        {error ? (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>{t("signInFailed")}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="rounded-[0.625rem] font-semibold"
          disabled={
            pending || (recovery ? !code.trim() : code.length < totpLength)
          }
        >
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {t("verifySignIn")}
        </Button>

        <AuthFooter>
          {recovery ? null : t("lostDevice")}
          <button
            type="button"
            className={authLinkClassName}
            onClick={() => {
              setRecovery((value) => !value)
              setCode("")
              setError("")
            }}
          >
            {recovery ? t("useAuthenticatorCode") : t("useRecoveryCode")}
          </button>
        </AuthFooter>
      </form>
    </AuthPanel>
  )
}
