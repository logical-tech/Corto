"use client"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { ShieldCheckIcon, TriangleAlertIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { authClient } from "@/lib/auth-client"

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

  return (
    <div className="flex flex-col gap-10">
      <div>
        <ShieldCheckIcon className="mb-5 size-7 text-primary" />
        <h1 className="max-w-[11ch] text-5xl leading-[0.94] font-semibold tracking-[-0.04em] text-balance sm:text-6xl">
          {t("twoFactorRequired")}
        </h1>
        <p className="mt-5 max-w-[38ch] leading-6 text-pretty text-muted-foreground">
          {recovery
            ? t("recoveryCodeDescription")
            : t("twoFactorRequiredDescription")}
        </p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={verify}>
        <Input
          value={code}
          autoFocus
          inputMode={recovery ? "text" : "numeric"}
          autoComplete="one-time-code"
          placeholder={recovery ? t("recoveryCode") : t("verificationCode")}
          aria-label={recovery ? t("recoveryCode") : t("verificationCode")}
          className="h-12 rounded-xl bg-background px-3.5"
          onChange={(event) => setCode(event.target.value)}
        />
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
          className="h-12 justify-between rounded-xl px-5"
          disabled={pending || !code.trim()}
        >
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {t("verifySignIn")}
        </Button>
      </form>

      <Button
        variant="ghost"
        className="w-fit"
        onClick={() => {
          setRecovery((value) => !value)
          setCode("")
          setError("")
        }}
      >
        {recovery ? t("useAuthenticatorCode") : t("useRecoveryCode")}
      </Button>
    </div>
  )
}
