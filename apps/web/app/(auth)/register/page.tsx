"use client"

import { XIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { AuthForm, AuthHeading, AuthPanel } from "@/components/auth-form"

export default function RegisterPage() {
  const { t } = useTranslation("auth")
  return (
    <AuthPanel
      title={t("loginOrSignUp")}
      backHref="/"
      backLabel={t("backToHome")}
      backIcon={XIcon}
    >
      <AuthHeading
        title={t("createWorkspace")}
        description={t("signUpDescription")}
      />
      <AuthForm mode="register" />
    </AuthPanel>
  )
}
