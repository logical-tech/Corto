"use client"

import { GlobeIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { defaultLocale, languageKeys, locales } from "@/lib/i18n"

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation("common")
  const locale = i18n.resolvedLanguage ?? defaultLocale

  return (
    <label
      title={t("language")}
      className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors focus-within:ring-3 focus-within:ring-ring/30 hover:bg-muted"
    >
      <GlobeIcon aria-hidden="true" className="size-4.5" />
      <select
        aria-label={t("language")}
        className="absolute inset-0 cursor-pointer appearance-none rounded-full opacity-0 outline-none"
        value={locale}
        onChange={(event) => void i18n.changeLanguage(event.target.value)}
      >
        {locales.map((language) => (
          <option key={language} value={language}>
            {t(languageKeys[language])}
          </option>
        ))}
      </select>
    </label>
  )
}
