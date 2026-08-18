"use client"

import { useTranslation } from "react-i18next"

export function SkipToContent() {
  const { t } = useTranslation("common")

  return (
    <a
      href="#main-content"
      className="fixed top-3 left-3 z-[100] -translate-y-20 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg transition-transform duration-150 focus:translate-y-0"
    >
      {t("skipToContent")}
    </a>
  )
}
