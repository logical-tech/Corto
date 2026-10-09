"use client"

import { Button } from "@workspace/ui/components/button"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

const themeStorageKey = "corto.theme"

export function ThemeToggle() {
  const { t } = useTranslation("common")

  function toggleTheme() {
    const isDark = !document.documentElement.classList.contains("dark")

    document.documentElement.classList.toggle("dark", isDark)
    window.localStorage.setItem(themeStorageKey, isDark ? "dark" : "light")
  }

  return (
    <Button
      aria-label={t("toggleTheme")}
      className="relative size-10 overflow-hidden rounded-full"
      onClick={toggleTheme}
      size="icon"
      title={t("toggleTheme")}
      variant="ghost"
    >
      <MoonIcon
        aria-hidden="true"
        className="size-4.5 transition-[opacity,transform] duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] dark:scale-0 dark:-rotate-90 dark:opacity-0"
      />
      <SunIcon
        aria-hidden="true"
        className="absolute size-4.5 scale-0 rotate-90 opacity-0 transition-[opacity,transform] duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] dark:scale-100 dark:rotate-0 dark:opacity-100"
      />
    </Button>
  )
}
