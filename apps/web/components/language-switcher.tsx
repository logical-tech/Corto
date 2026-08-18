"use client"

import { LanguagesIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { defaultLocale, languageKeys, locales } from "@/lib/i18n"

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation("common")
  const locale = i18n.resolvedLanguage ?? defaultLocale

  return (
    <label className="relative inline-flex items-center rounded-2xl border border-input bg-card text-sm text-muted-foreground shadow-sm">
      <LanguagesIcon aria-hidden="true" className="ml-3 size-3.5" />
      <span className="sr-only">{t("language")}</span>
      <select
        aria-label={t("language")}
        className="h-8 cursor-pointer appearance-none bg-transparent py-1 pr-7 pl-2 text-sm text-foreground outline-none"
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
