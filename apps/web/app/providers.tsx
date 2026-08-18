"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@workspace/ui/components/toast"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { defaultLocale, locales } from "@/lib/i18n"

function LocaleSync() {
  const { i18n } = useTranslation()

  useEffect(() => {
    const syncDocumentLanguage = (language: string) => {
      const locale = locales.includes(language as (typeof locales)[number])
        ? language
        : defaultLocale
      document.documentElement.lang = locale
      window.localStorage.setItem("corto.locale", locale)
    }
    const savedLocale = window.localStorage.getItem("corto.locale")

    i18n.on("languageChanged", syncDocumentLanguage)
    if (
      savedLocale &&
      locales.includes(savedLocale as (typeof locales)[number]) &&
      savedLocale !== i18n.language
    ) {
      void i18n.changeLanguage(savedLocale)
    } else {
      syncDocumentLanguage(i18n.resolvedLanguage ?? i18n.language)
    }

    return () => i18n.off("languageChanged", syncDocumentLanguage)
  }, [i18n])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleSync />
      <TooltipProvider>
        <Toaster>{children}</Toaster>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
