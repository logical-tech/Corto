"use client"

import { XIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { AuthForm, AuthHeading, AuthPanel } from "@/components/auth-form"

export default function LoginPage() {
  const { t } = useTranslation("auth")
  return (
    <AuthPanel
      title={t("loginOrSignUp")}
      backHref="/"
      backLabel={t("backToHome")}
      backIcon={XIcon}
    >
      <AuthHeading
        title={t("welcomeBack")}
        description={t("signInDescription")}
      />
      <AuthForm mode="login" />
    </AuthPanel>
  )
}
