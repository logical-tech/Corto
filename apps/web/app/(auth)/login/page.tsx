"use client"

import { AuthForm } from "@/components/auth-form"
import { useTranslation } from "react-i18next"

export default function LoginPage() {
  const { t } = useTranslation("auth")
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="max-w-[11ch] text-5xl leading-[0.94] font-semibold tracking-[-0.04em] text-balance sm:text-6xl">
          {t("welcomeBack")}
        </h1>
        <p className="mt-5 max-w-[38ch] leading-6 text-pretty text-muted-foreground">
          {t("signInDescription")}
        </p>
      </div>
      <AuthForm mode="login" />
    </div>
  )
}
